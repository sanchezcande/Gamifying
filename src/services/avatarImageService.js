const { GoogleGenAI } = require('@google/genai');

let genaiClient = null;
function getGenAIClient() {
  if (!process.env.GOOGLE_API_KEY) return null;
  if (!genaiClient) {
    genaiClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }
  return genaiClient;
}

// Body build per class
const CLASS_BUILD = {
  ROOKIE:   'slim and lean build, beginner physique',
  FIGHTER:  'athletic build, visible muscle tone',
  CHAMPION: 'muscular build, well-defined abs and arms',
  WARRIOR:  'extremely muscular and massive build, bodybuilder physique, huge arms and chest',
};

const STAGE_BUILD = {
  1: 'lean starter build, light muscle definition',
  2: 'beginner athletic build, noticeable tone',
  3: 'intermediate build, solid muscle definition',
  4: 'advanced build, thick muscle volume',
  5: 'elite build, massive bodybuilder physique',
};

function buildAvatarPrompt({ gender = 'MALE', avatarClass = 'ROOKIE', bodyStage }) {
  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const stageKey = Number(bodyStage);
  const build = STAGE_BUILD[stageKey] || CLASS_BUILD[avatarClass] || CLASS_BUILD.ROOKIE;

  return [
    `Transform this person's photo into a 3D cartoon stylized full-body ${genderLabel} fitness character`,
    'Keep their facial features, skin tone, hair color, and overall likeness',
    'Pixar-inspired mobile game art style, chibi proportions with oversized head and expressive face',
    build,
    'wearing a red athletic tank top, black shorts, white sneakers',
    'standing in a confident pose, front-facing',
    'clean solid pure black background (#000000), no reflections, no shadows on background',
    'smooth 3D render, vibrant colors, soft shadows',
    'IMPORTANT: only ONE character, no duplicates, no text, no watermark',
  ].join('. ') + '.';
}

async function generateAvatarFromSelfie({ selfieBase64, selfieMimeType = 'image/jpeg', gender, avatarClass, bodyStage }) {
  const ai = getGenAIClient();
  if (!ai) throw new Error('GOOGLE_API_KEY is not configured');

  const prompt = buildAvatarPrompt({ gender, avatarClass, bodyStage });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-preview-image-generation',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data: selfieBase64, mimeType: selfieMimeType } }
        ]
      }
    ],
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
    }
  });

  // Extract image from response parts
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        imageBytes: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
  }

  throw new Error('No image generated from selfie');
}

async function generateAvatarWithoutSelfie({ gender, avatarClass, bodyStage }) {
  const ai = getGenAIClient();
  if (!ai) throw new Error('GOOGLE_API_KEY is not configured');

  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const stageKey = Number(bodyStage);
  const build = STAGE_BUILD[stageKey] || CLASS_BUILD[avatarClass] || CLASS_BUILD.ROOKIE;

  const prompt = [
    `ONE single 3D cartoon stylized full-body ${genderLabel} fitness character, exactly one person, centered in frame`,
    'Pixar-inspired mobile game art style',
    'chibi proportions with oversized head and expressive face',
    build,
    'wearing a red athletic tank top, black shorts, white sneakers',
    'standing in a confident pose, front-facing',
    'clean solid pure black background (#000000), no reflections, no shadows on background',
    'smooth 3D render, vibrant colors, soft shadows',
    'IMPORTANT: only ONE character, no duplicates, no text, no watermark',
  ].join('. ') + '.';

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: { numberOfImages: 1 },
  });

  return {
    imageBytes: response.generatedImages[0].image.imageBytes,
    mimeType: 'image/png',
  };
}

async function generateAvatarForUser({ user, avatarClass, avatarBodyStage }) {
  if (!user?.avatarGender) return null;
  if (!process.env.GOOGLE_API_KEY) return null;

  try {
    let result;
    if (user.selfiePhoto) {
      result = await generateAvatarFromSelfie({
        selfieBase64: user.selfiePhoto,
        gender: user.avatarGender,
        avatarClass,
        bodyStage: avatarBodyStage,
      });
    } else {
      result = await generateAvatarWithoutSelfie({
        gender: user.avatarGender,
        avatarClass,
        bodyStage: avatarBodyStage,
      });
    }
    return `data:${result.mimeType};base64,${result.imageBytes}`;
  } catch (err) {
    console.error('Avatar generation failed:', err.message);
    return null;
  }
}

module.exports = {
  generateAvatarFromSelfie,
  generateAvatarWithoutSelfie,
  generateAvatarForUser,
  buildAvatarPrompt,
  getGenAIClient,
  CLASS_BUILD,
  STAGE_BUILD,
};
