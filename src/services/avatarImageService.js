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
  1: 'chubby soft body, visible round belly hanging over shorts, love handles, thick arms with zero definition, double chin, wide waist, clearly out of shape',
  2: 'less belly fat than before but still soft, slight arm shape visible under fat, waist narrower but still thick, face slimmer, starting to look like he goes to the gym occasionally',
  3: 'athletic build, flat stomach with faint abs showing through shirt, arms filling out the sleeves with visible biceps, chest pushing against shirt, V-taper waist starting to form',
  4: 'muscular and powerful, abs clearly visible through tight shirt, thick arms stretching sleeves, broad shoulders, veins on forearms, strong neck, clearly someone who lifts heavy',
  5: 'massively muscular bodybuilder physique, shirt stretched to the limit across huge chest and shoulders, enormous arms with visible veins, shredded abs, wide lats creating extreme V-taper, peak physical form',
};

const STAGE_BUILD_FEMALE = {
  1: 'soft untrained body, visible belly pouch, thick arms with no tone, wide hips, round face, clearly out of shape and just starting',
  2: 'less body fat than before, belly flatter but still soft, arms starting to show slight shape, waist slightly more defined, face slimmer, looks like she started working out recently',
  3: 'athletic and toned, flat stomach with faint ab lines visible, defined arms with visible muscle, slim waist with curves, legs toned, clearly fit and active',
  4: 'very fit and sculpted, visible abs, defined shoulders and arms with lean muscle, strong glutes, slim waist with athletic curves, looks like a dedicated athlete',
  5: 'elite fitness physique, beautifully sculpted visible muscle, defined six-pack abs, capped shoulders, toned arms with visible definition, strong athletic build while maintaining feminine shape',
};

const STAGE_OUTFIT_MALE = {
  1: 'wearing an oversized baggy gray cotton t-shirt, long black basketball shorts below the knee, old worn-out sneakers',
  2: 'wearing a regular fit dark blue gym t-shirt, black athletic shorts above the knee, clean gym sneakers',
  3: 'wearing a fitted red gym t-shirt that shows his build, black training shorts, good athletic shoes',
  4: 'wearing a fitted black compression t-shirt that hugs his muscles, dark shorts, performance training shoes',
  5: 'wearing a tight black compression t-shirt stretched across his massive build, dark shorts, premium training shoes',
};

const STAGE_OUTFIT_FEMALE = {
  1: 'wearing a loose oversized gray t-shirt hiding her body, long black leggings, old sneakers',
  2: 'wearing a regular fit colored t-shirt, black leggings, clean gym sneakers',
  3: 'wearing a fitted red athletic top, black leggings, good training shoes',
  4: 'wearing a fitted black athletic top showing her toned arms, dark leggings, performance shoes',
  5: 'wearing a fitted black athletic top showing her sculpted build, dark leggings, premium training shoes',
};

const STYLE = 'stylized 3D fighting game character, semi-realistic proportions like Street Fighter or Tekken, detailed face with personality, strong dynamic presence';

// Prompt for first-time generation from selfie → creates the base avatar
function buildBaseAvatarPrompt({ gender = 'MALE' }) {
  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const build = gender === 'FEMALE' ? STAGE_BUILD_FEMALE[1] : STAGE_BUILD_MALE[1];
  const outfit = gender === 'FEMALE' ? STAGE_OUTFIT_FEMALE[1] : STAGE_OUTFIT_MALE[1];
  return [
    `Transform this person's photo into a ${STYLE} — ${genderLabel}`,
    'The face must be stylized but clearly recognizable as this person: keep their exact hair color, hairstyle, hair length, eye color, skin tone, facial structure, and distinctive features',
    'Render as a 3D fighting game character — NOT photorealistic, NOT chibi, NOT Pixar. Think Street Fighter 6, Tekken 8 art style',
    build,
    outfit,
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
  const stageOutfits = gender === 'FEMALE' ? STAGE_OUTFIT_FEMALE : STAGE_OUTFIT_MALE;
  const build = stageBuilds[stageKey] || CLASS_BUILD.ROOKIE;
  const outfit = stageOutfits[stageKey] || stageOutfits[1];

  return [
    `Redraw this exact same ${genderLabel} fighting game character with a different body build and outfit`,
    'CRITICAL: Keep the face, hair, skin tone, and all facial features EXACTLY identical — same eyes, same nose, same mouth, same hairstyle, same hair color. The character must look like the same person',
    'Change the body build and clothes as described below',
    build,
    outfit,
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
  const stageOutfits = gender === 'FEMALE' ? STAGE_OUTFIT_FEMALE : STAGE_OUTFIT_MALE;
  const build = stageBuilds[stageKey] || CLASS_BUILD[avatarClass] || CLASS_BUILD.ROOKIE;
  const outfit = stageOutfits[stageKey] || stageOutfits[1];

  return [
    `Transform this person's photo into a ${STYLE} — ${genderLabel}`,
    'The face must be stylized but clearly recognizable as this person: keep their exact hair color, hairstyle, hair length, eye color, skin tone, facial structure',
    'Render as a 3D fighting game character — NOT photorealistic, NOT chibi, NOT Pixar. Think Street Fighter 6, Tekken 8 art style',
    build,
    outfit,
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

  const stageOutfits = gender === 'FEMALE' ? STAGE_OUTFIT_FEMALE : STAGE_OUTFIT_MALE;
  const outfit = stageOutfits[stageKey] || stageOutfits[1];

  const prompt = [
    `ONE single ${genderLabel} ${STYLE}, exactly one person, centered in frame`,
    build,
    outfit,
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
  STAGE_OUTFIT_MALE,
  STAGE_OUTFIT_FEMALE,
};
