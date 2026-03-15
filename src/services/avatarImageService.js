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

const CLASS_STYLE = {
  WARRIOR:  'red fire aura, powerful and intimidating',
  CHAMPION: 'blue electric aura, confident and strong',
  FIGHTER:  'green energy glow, determined and fierce',
  ROOKIE:   'grey tones, motivated and eager',
};

function buildPrompt({ gender = 'MALE', avatarClass = 'ROOKIE', faceOptions = {} }) {
  const genderLabel = gender === 'FEMALE' ? 'female' : 'male';
  const classStyle = CLASS_STYLE[avatarClass] || CLASS_STYLE.ROOKIE;

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

  return `Cinematic fighting game character portrait of a ${genderLabel} gym athlete warrior. ${face}. ${classStyle}. Dramatic dark background, dramatic rim lighting, close-up face and shoulders, ultra detailed, no text, no watermark.`;
}

async function generateAvatarImage({ gender, avatarClass, faceOptions }) {
  const prompt = buildPrompt({ gender, avatarClass, faceOptions });

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  return response.data[0].url;
}

// Keep backward compat — returns a Pollinations URL as fallback
function buildAvatarImageUrl({ name, avatarClass = 'ROOKIE', gender = 'MALE', faceOptions = {}, imageVariant = 0 }) {
  const prompt = encodeURIComponent(buildPrompt({ gender, avatarClass, faceOptions }));
  return `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=${imageVariant}&model=flux`;
}

module.exports = { generateAvatarImage, buildAvatarImageUrl };
