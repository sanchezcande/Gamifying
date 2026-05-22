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

const STAGE_BUILD_MALE = {
  1: 'soft untrained body, some belly fat, no visible muscle, couch potato starting their fitness journey',
  2: 'slightly leaner, lost some fat but still soft, barely visible arm definition, beginner gains',
  3: 'noticeable muscle tone, flat stomach, arms and chest showing definition, intermediate gym goer',
  4: 'muscular and strong, thick arms, visible abs, broad shoulders, clearly athletic and powerful',
  5: 'extremely muscular bodybuilder physique, massive arms and chest, shredded abs, peak physical form',
};

const STAGE_BUILD_FEMALE = {
  1: 'soft untrained body, some belly and arm fat, no muscle tone, just starting her fitness journey',
  2: 'slightly leaner, lost some fat, hints of arm tone, still soft but improving, beginner gains',
  3: 'athletic and toned, visible abs, slim waist, defined arms, feminine curves, fit and healthy',
  4: 'very fit and sculpted, strong glutes and shoulders, lean defined muscle, feminine silhouette maintained',
  5: 'elite fitness model, beautifully sculpted muscle, defined abs and arms, strong but graceful and feminine',
};

function buildAvatarPrompt({ gender = 'MALE', avatarClass = 'ROOKIE', bodyStage }) {
  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const stageKey = Number(bodyStage);
  const stageBuilds = gender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
  const build = stageBuilds[stageKey] || CLASS_BUILD[avatarClass] || CLASS_BUILD.ROOKIE;

  return [
    `Transform this person's photo into a 3D cartoon stylized full-body ${genderLabel} fitness character`,
    'CRITICAL: Keep their EXACT hair color, EXACT eye color, skin tone, and facial features — the cartoon must clearly look like this specific person',
    'Pixar-inspired mobile game art style, chibi proportions with oversized head and expressive face',
    build,
    'wearing a red athletic tank top, black shorts, white sneakers',
    'standing in a confident pose, front-facing, full body visible from head to feet',
    'clean solid pure black background (#000000), no reflections, no shadows on background',
    'smooth 3D render, vibrant colors, soft shadows',
    'IMPORTANT: only ONE character, no duplicates, no text, no watermark, must match the person hair and eye color exactly',
  ].join('. ') + '.';
}

async function generateAvatarFromSelfie({ selfieBase64, selfieMimeType = 'image/jpeg', gender, avatarClass, bodyStage }) {
  const ai = getGenAIClient();
  if (!ai) throw new Error('GOOGLE_API_KEY is not configured');

  const prompt = buildAvatarPrompt({ gender, avatarClass, bodyStage });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
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
  const stageBuilds = gender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
  const build = stageBuilds[stageKey] || CLASS_BUILD[avatarClass] || CLASS_BUILD.ROOKIE;

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
  STAGE_BUILD_MALE,
  STAGE_BUILD_FEMALE,
};
