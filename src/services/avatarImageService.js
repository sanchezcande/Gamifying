const { GoogleGenAI } = require('@google/genai');

let genaiClient = null;
function getGenAIClient() {
  if (!process.env.GOOGLE_API_KEY) return null;
  if (!genaiClient) {
    genaiClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }
  return genaiClient;
}

// Body build per class (fallback)
const CLASS_BUILD = {
  ROOKIE:   'slim and lean build, beginner physique',
  FIGHTER:  'athletic build, visible muscle tone',
  CHAMPION: 'muscular build, well-defined abs and arms',
  WARRIOR:  'extremely muscular and massive build, bodybuilder physique, huge arms and chest',
};

const STAGE_BUILD_MALE = {
  1: 'average skinny-fat body, small soft belly, thin arms with no muscle, narrow shoulders, normal build, a regular guy who doesnt exercise',
  2: 'belly slightly smaller, arms a tiny bit thicker with hint of shape, shoulders a touch wider, starting to look like someone who recently joined a gym',
  3: 'belly gone flat, arms noticeably thicker with bicep shape visible, chest starting to push the suit out, shoulders wider, waist tighter, clearly been training for a while',
  4: 'fit and strong, arms thick and muscular filling the sleeves, chest broad and solid, shoulders wide, torso firm with narrow waist, athletic powerful build',
  5: 'very muscular, arms large and powerful stretching the sleeves, chest and shoulders wide filling the suit tight, narrow hard waist, strong neck, peak warrior physique',
};

const STAGE_BUILD_FEMALE = {
  1: 'average untrained body, slightly soft midsection, thin arms without tone, normal waist, a regular woman who doesnt exercise',
  2: 'midsection a bit firmer, arms slightly more defined with a hint of shape, waist a little more defined, beginning to look like someone who works out',
  3: 'flat stomach, arms with clear tone and shape through the sleeves, waist slim and defined with feminine curves, legs with visible shape, looks fit and active',
  4: 'toned athletic body, arms with lean muscle visible through sleeves, slim defined waist with curves, legs strong and toned, elegant dedicated athlete',
  5: 'peak fitness, lean sculpted arms and shoulders through the suit, slim athletic waist, strong graceful legs, beautiful feminine warrior, powerful but elegant',
};

const OUTFIT = 'wearing a sleek fitted black bodysuit with dark red accent stitching along the seams and a front zipper, tactical video game combat suit style, LONG SLEEVES covering both arms completely down to the wrists, full leg coverage, black boots. The suit must have LONG SLEEVES in every image — never sleeveless, never short sleeves, never bare arms';

const STYLE = 'stylized 3D fighting game character, semi-realistic proportions like Street Fighter or Tekken, detailed face with personality, strong dynamic presence';

const RENDER_RULES = 'NEVER show bare skin on torso or arms — suit has LONG SLEEVES always, fully covering arms and stomach. NO tank tops, NO sleeveless, NO crop tops, NO lifted shirts, NO exposed belly, NO bare arms. Body shape visible THROUGH the clothes naturally. Render muscles with soft natural shading only — NO black outlines, NO comic-book lines, NO exaggerated veins. Clean, elegant, natural';

// Prompt for first-time generation from selfie → creates the base avatar
function buildBaseAvatarPrompt({ gender = 'MALE' }) {
  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const build = gender === 'FEMALE' ? STAGE_BUILD_FEMALE[1] : STAGE_BUILD_MALE[1];
  const outfit = OUTFIT;
  return [
    `Transform this person's photo into a ${STYLE} — ${genderLabel}`,
    'The face must be stylized but clearly recognizable as this person: keep their exact hair color, hairstyle, hair length, eye color, skin tone, facial structure, and distinctive features',
    'Render as a 3D fighting game character — NOT photorealistic, NOT chibi, NOT Pixar. Think Street Fighter 6, Tekken 8 art style',
    build,
    outfit,
    RENDER_RULES,
    'standing in a confident front-facing pose, full body visible from head to feet',
    'clean solid cream background (#F0EBE0), no reflections, no shadows on background',
    'smooth 3D render, vibrant colors, soft lighting',
    'IMPORTANT: only ONE character, no duplicates, no text, no watermark',
  ].join('. ') + '.';
}

// Prompt for stage updates — uses the existing avatar as reference to keep the face identical
function buildStageUpdatePrompt({ gender = 'MALE', bodyStage }) {
  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const stageKey = Number(bodyStage);
  const stageBuilds = gender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
  const build = stageBuilds[stageKey] || CLASS_BUILD.ROOKIE;
  const outfit = OUTFIT;

  return [
    `Redraw this exact same ${genderLabel} fighting game character with a different body build`,
    'CRITICAL: Keep the face, hair, skin tone, and all facial features EXACTLY identical — same eyes, same nose, same mouth, same hairstyle, same hair color. The character must look like the same person',
    'Keep the EXACT same outfit as in the reference image — identical suit design, same colors, same stitching pattern, same boots, same every detail. Copy the outfit pixel by pixel. ONLY the body shape changes',
    build,
    outfit,
    RENDER_RULES,
    'standing in a confident front-facing pose, full body visible from head to feet',
    'clean solid cream background (#F0EBE0), no reflections, no shadows on background',
    'smooth 3D render, vibrant colors, soft lighting, fighting game art style',
    'IMPORTANT: only ONE character, no duplicates, no text, no watermark. The face must be IDENTICAL to the reference image',
  ].join('. ') + '.';
}

// Prompt for generating from selfie with specific stage
function buildAvatarPrompt({ gender = 'MALE', avatarClass = 'ROOKIE', bodyStage }) {
  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const stageKey = Number(bodyStage);
  const stageBuilds = gender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
  const build = stageBuilds[stageKey] || CLASS_BUILD[avatarClass] || CLASS_BUILD.ROOKIE;
  const outfit = OUTFIT;

  return [
    `Transform this person's photo into a ${STYLE} — ${genderLabel}`,
    'The face must be stylized but clearly recognizable as this person: keep their exact hair color, hairstyle, hair length, eye color, skin tone, facial structure',
    'Render as a 3D fighting game character — NOT photorealistic, NOT chibi, NOT Pixar. Think Street Fighter 6, Tekken 8 art style',
    build,
    outfit,
    RENDER_RULES,
    'standing in a confident front-facing pose, full body visible from head to feet',
    'clean solid cream background (#F0EBE0), no reflections, no shadows on background',
    'smooth 3D render, vibrant colors, soft lighting',
    'IMPORTANT: only ONE character, no duplicates, no text, no watermark',
  ].join('. ') + '.';
}

async function generateFromImage({ imageBase64, imageMimeType = 'image/jpeg', prompt }) {
  const ai = getGenAIClient();
  if (!ai) throw new Error('GOOGLE_API_KEY is not configured');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data: imageBase64, mimeType: imageMimeType } }
        ]
      }
    ],
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        imageBytes: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
  }
  throw new Error('No image generated');
}

// Generate base avatar from selfie (first time only)
async function generateAvatarFromSelfie({ selfieBase64, selfieMimeType = 'image/jpeg', gender, avatarClass, bodyStage }) {
  const prompt = buildAvatarPrompt({ gender, avatarClass, bodyStage });
  return generateFromImage({ imageBase64: selfieBase64, imageMimeType: selfieMimeType, prompt });
}

// Generate new stage from existing base avatar (keeps face identical)
async function generateStageFromBase({ baseAvatarBase64, gender, bodyStage }) {
  const prompt = buildStageUpdatePrompt({ gender, bodyStage });
  return generateFromImage({ imageBase64: baseAvatarBase64, imageMimeType: 'image/png', prompt });
}

async function generateAvatarWithoutSelfie({ gender, avatarClass, bodyStage }) {
  const ai = getGenAIClient();
  if (!ai) throw new Error('GOOGLE_API_KEY is not configured');

  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const stageKey = Number(bodyStage);
  const stageBuilds = gender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
  const build = stageBuilds[stageKey] || CLASS_BUILD[avatarClass] || CLASS_BUILD.ROOKIE;

  const outfit = OUTFIT;

  const prompt = [
    `ONE single ${genderLabel} ${STYLE}, exactly one person, centered in frame`,
    build,
    outfit,
    RENDER_RULES,
    'standing in a confident front-facing pose',
    'clean solid cream background (#F0EBE0), no reflections, no shadows on background',
    'smooth 3D render, vibrant colors, soft lighting',
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
    const hasBaseAvatar = user.baseAvatarPhoto;

    if (hasBaseAvatar) {
      // Use existing base avatar as reference → keeps face identical
      const base64 = user.baseAvatarPhoto.replace(/^data:[^;]+;base64,/, '');
      result = await generateStageFromBase({
        baseAvatarBase64: base64,
        gender: user.avatarGender,
        bodyStage: avatarBodyStage,
      });
    } else if (user.selfiePhoto) {
      // First time: generate from selfie
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
  generateStageFromBase,
  generateAvatarWithoutSelfie,
  generateAvatarForUser,
  buildAvatarPrompt,
  buildBaseAvatarPrompt,
  buildStageUpdatePrompt,
  getGenAIClient,
  CLASS_BUILD,
  STAGE_BUILD_MALE,
  STAGE_BUILD_FEMALE,
  OUTFIT,
};
