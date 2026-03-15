const OpenAI = require('openai');
const { FACE_OPTIONS } = require('../utils/avatarOptions');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  eyebrow:   buildLookup(FACE_OPTIONS.eyebrow),
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

// Keep aesthetics consistent across renders
const STYLE_LOCK = [
  'consistent art style across renders',
  'premium mobile game character art',
  'gritty cinematic gym vibe',
  'dark studio background with soft haze',
  'high-contrast rim lighting',
  'muted palette with warm highlights',
  'sharp focus, ultra detailed',
  'no text, no watermark, no logo'
];

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
    LOOKUPS.eyebrow[faceOptions.faceEyebrowId] ? `${LOOKUPS.eyebrow[faceOptions.faceEyebrowId]} eyebrows` : null,
  ].filter(Boolean).join(', ');

  const stageTag = stageKey ? `body stage ${stageKey} of 5` : null;
  return `professional character portrait, ${genderLabel} athlete. ${build}. ${stageTag || ''} ${face}. Confident pose, fists clenched. ${STYLE_LOCK.join(', ')}.`;
}

async function generateAvatarImage({ gender, avatarClass, faceOptions, bodyStage }) {
  const prompt = buildPrompt({ gender, avatarClass, faceOptions, bodyStage });

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

module.exports = { generateAvatarImage, buildAvatarImageUrl };
