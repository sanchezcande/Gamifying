const OpenAI = require('openai');
const { FACE_OPTIONS } = require('../utils/avatarOptions');

let openaiClient = null;
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// Build lookup maps: id → label
function buildLookup(items) {
  const map = {};
  for (const item of items) map[item.id] = item.label;
  return map;
}

const LOOKUPS = {
  jaw:       buildLookup(FACE_OPTIONS.jaw),
  cheeks:    buildLookup(FACE_OPTIONS.cheeks),
  eyeShape:  buildLookup(FACE_OPTIONS.eyeShape),
  eyeColor:  buildLookup(FACE_OPTIONS.eyeColor),
  nose:      buildLookup(FACE_OPTIONS.nose),
  hairStyle: buildLookup(FACE_OPTIONS.hairStyle),
  hairColor: buildLookup(FACE_OPTIONS.hairColor),
  skinTone:  buildLookup(FACE_OPTIONS.skinTone),
  beard:     buildLookup(FACE_OPTIONS.beard),
  eyebrow:      buildLookup(FACE_OPTIONS.eyebrow),
  eyebrowColor: buildLookup(FACE_OPTIONS.eyebrowColor),
};

// Body build per class — progressively more muscular
const CLASS_BUILD = {
  ROOKIE:   'slim and lean build, beginner physique',
  FIGHTER:  'athletic build, visible muscle tone',
  CHAMPION: 'muscular build, well-defined abs and arms',
  WARRIOR:  'extremely muscular and massive build, bodybuilder physique, huge arms and chest',
};

// Five visual stages for consistent progression
const STAGE_BUILD = {
  1: 'lean starter build, light muscle definition',
  2: 'beginner athletic build, noticeable tone',
  3: 'intermediate build, solid muscle definition',
  4: 'advanced build, thick muscle volume',
  5: 'elite build, massive bodybuilder physique',
};

function buildPrompt({ gender = 'MALE', avatarClass = 'ROOKIE', faceOptions = {}, bodyStage }) {
  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const stageKey = Number(bodyStage);
  const build = STAGE_BUILD[stageKey] || CLASS_BUILD[avatarClass] || CLASS_BUILD.ROOKIE;

  const face = [
    LOOKUPS.skinTone[faceOptions.faceSkinToneId] ? `${LOOKUPS.skinTone[faceOptions.faceSkinToneId]} skin tone` : null,
    LOOKUPS.jaw[faceOptions.faceJawId] ? `${LOOKUPS.jaw[faceOptions.faceJawId]} jawline` : null,
    LOOKUPS.cheeks[faceOptions.faceCheeksId] ? `${LOOKUPS.cheeks[faceOptions.faceCheeksId]} cheeks` : null,
    LOOKUPS.eyeShape[faceOptions.faceEyeShapeId] ? `${LOOKUPS.eyeShape[faceOptions.faceEyeShapeId]} eyes` : null,
    LOOKUPS.eyeColor[faceOptions.faceEyeColorId] ? `${LOOKUPS.eyeColor[faceOptions.faceEyeColorId]} eye color` : null,
    LOOKUPS.nose[faceOptions.faceNoseId] ? `${LOOKUPS.nose[faceOptions.faceNoseId]} nose` : null,
    LOOKUPS.hairStyle[faceOptions.faceHairStyleId] ? `${LOOKUPS.hairStyle[faceOptions.faceHairStyleId]} hairstyle` : null,
    LOOKUPS.hairColor[faceOptions.faceHairColorId] ? `${LOOKUPS.hairColor[faceOptions.faceHairColorId]} hair color` : null,
    LOOKUPS.beard[faceOptions.faceBeardId] != null ? LOOKUPS.beard[faceOptions.faceBeardId] : null,
    LOOKUPS.eyebrow[faceOptions.faceEyebrowId]
      ? `${LOOKUPS.eyebrowColor[faceOptions.faceEyebrowColorId] || ''} ${LOOKUPS.eyebrow[faceOptions.faceEyebrowId]} eyebrows`.trim()
      : null,
  ].filter(Boolean).join(', ');

  const outfit = 'wearing a red athletic tank top, black shorts, white sneakers';

  return [
    `ONE single 3D cartoon stylized full-body ${genderLabel} fitness character, exactly one person, centered in frame`,
    'Pixar-inspired mobile game art style',
    'chibi proportions with oversized head and expressive face',
    build,
    face,
    outfit,
    'standing in a confident pose, front-facing',
    'clean solid pure black background (#000000), no reflections, no shadows on background',
    'smooth 3D render, vibrant colors, soft shadows',
    'IMPORTANT: only ONE character, absolutely no duplicates, no copies, no mirrors, no text, no watermark',
  ].join('. ') + '.';
}

function buildFaceOptionsFromUser(user = {}) {
  return {
    faceJawId: user.faceJawId,
    faceCheeksId: user.faceCheeksId,
    faceEyeShapeId: user.faceEyeShapeId,
    faceEyeColorId: user.faceEyeColorId,
    faceNoseId: user.faceNoseId,
    faceHairStyleId: user.faceHairStyleId,
    faceHairColorId: user.faceHairColorId,
    faceSkinToneId: user.faceSkinToneId,
    faceBeardId: user.faceBeardId,
    faceEyebrowId: user.faceEyebrowId,
    faceEyebrowColorId: user.faceEyebrowColorId
  };
}

async function generateAvatarImage({ gender, avatarClass, faceOptions, bodyStage }) {
  const prompt = buildPrompt({ gender, avatarClass, faceOptions, bodyStage });

  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  return response.data[0].url;
}

function hashString(text = '') {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Keep backward compat — returns a Pollinations URL as fallback
function buildAvatarImageUrl({ name, avatarClass = 'ROOKIE', gender = 'MALE', faceOptions = {}, imageVariant = 0, bodyStage }) {
  const prompt = encodeURIComponent(buildPrompt({ gender, avatarClass, faceOptions, bodyStage }));
  const seed = hashString(`${name || 'avatar'}-${avatarClass}-${imageVariant}`) % 100000;
  return `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=${seed}&model=flux`;
}

function buildAvatarUrlForUser({ user, avatarClass, avatarBodyStage }) {
  if (!user?.avatarGender) return null;
  return buildAvatarImageUrl({
    name: user.name,
    avatarClass,
    gender: user.avatarGender,
    faceOptions: buildFaceOptionsFromUser(user),
    imageVariant: 0,
    bodyStage: avatarBodyStage
  });
}

async function generateAvatarUrlForUser({ user, avatarClass, avatarBodyStage }) {
  if (!user?.avatarGender) return null;
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    return await generateAvatarImage({
      gender: user.avatarGender,
      avatarClass,
      faceOptions: buildFaceOptionsFromUser(user),
      bodyStage: avatarBodyStage
    });
  } catch (err) {
    console.error('Avatar generation failed, keeping fallback:', err.message);
    return null;
  }
}

module.exports = { generateAvatarImage, buildAvatarImageUrl, buildAvatarUrlForUser, generateAvatarUrlForUser };
