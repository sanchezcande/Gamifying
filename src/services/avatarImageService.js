function hashString(text = '') {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildAvatarImageUrl({ name, avatarClass = 'ROOKIE', gender = 'MALE', faceOptions = {}, imageVariant = 0 }) {
  const promptBits = [
    'cinematic fighting game portrait',
    gender === 'FEMALE' ? 'female athlete' : 'male athlete',
    `${avatarClass.toLowerCase()} class`,
    `jaw-${faceOptions.faceJawId || 1}`,
    `cheeks-${faceOptions.faceCheeksId || 1}`,
    `eyes-${faceOptions.faceEyeShapeId || 1}`,
    `eyeColor-${faceOptions.faceEyeColorId || 1}`,
    `nose-${faceOptions.faceNoseId || 1}`,
    `hair-${faceOptions.faceHairStyleId || 1}`,
    `hairColor-${faceOptions.faceHairColorId || 1}`,
    `skin-${faceOptions.faceSkinToneId || 1}`,
    `beard-${faceOptions.faceBeardId || 0}`,
    `eyebrow-${faceOptions.faceEyebrowId || 1}`,
    'gym aura, dramatic rim light, ultra detailed, no text'
  ];

  const prompt = encodeURIComponent(promptBits.join(', '));
  const safeVariant = Number.isFinite(Number(imageVariant)) ? Number(imageVariant) : 0;
  const seed = hashString(`${name || 'avatar'}-${avatarClass}-${safeVariant}`) % 100000;

  return `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=${seed}&model=flux`;
}

module.exports = { buildAvatarImageUrl };
