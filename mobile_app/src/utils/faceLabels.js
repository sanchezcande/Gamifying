// Client-side mirror of server's avatarOptions — maps IDs to text labels for prompt building
export const JAW_LABELS      = { 1:'oval',    2:'square',      3:'round',  4:'heart',   5:'diamond', 6:'sharp' };
export const CHEEK_LABELS    = { 1:'flat',    2:'chubby',      3:'defined',4:'hollow' };
export const EYE_LABELS      = { 1:'almond',  2:'round',       3:'hooded', 4:'monolid', 5:'upturned',6:'deep-set' };
export const EYE_COLOR_LABELS= { 1:'brown',   2:'black',       3:'green',  4:'blue',    5:'grey',    6:'hazel' };
export const NOSE_LABELS     = { 1:'button',  2:'straight',    3:'wide',   4:'pointed', 5:'upturned' };
export const HAIR_LABELS     = { 1:'buzz cut',2:'fade',        3:'long',   4:'curly',   5:'mohawk',  6:'braids', 7:'bald', 8:'messy' };
export const HAIR_COLOR_LABELS={ 1:'black',   2:'brown',       3:'blonde', 4:'red',     5:'white',   6:'grey',   7:'blue', 8:'green' };
export const SKIN_LABELS     = { 1:'very light skin', 2:'light skin', 3:'medium skin', 4:'olive skin', 5:'brown skin', 6:'dark skin' };
export const BEARD_LABELS    = { 0:'clean shaven',1:'stubble',  2:'short beard', 3:'full beard', 4:'goatee', 5:'mustache' };
export const EYEBROW_LABELS  = { 1:'thin',    2:'thick',       3:'arched', 4:'straight' };

// Extract faceOptions from a flat user object (as returned by /auth/me)
export function faceOptionsFromUser(user = {}) {
  if (!user.faceJawId) return null;
  return {
    faceJawId:       user.faceJawId,
    faceCheeksId:    user.faceCheeksId,
    faceEyeShapeId:  user.faceEyeShapeId,
    faceEyeColorId:  user.faceEyeColorId,
    faceNoseId:      user.faceNoseId,
    faceHairStyleId: user.faceHairStyleId,
    faceHairColorId: user.faceHairColorId,
    faceSkinToneId:  user.faceSkinToneId,
    faceBeardId:     user.faceBeardId,
    faceEyebrowId:   user.faceEyebrowId,
  };
}

export function buildFacePrompt(faceOptions = {}) {
  const parts = [];
  if (faceOptions.faceSkinToneId)   parts.push(SKIN_LABELS[faceOptions.faceSkinToneId]);
  if (faceOptions.faceJawId)        parts.push(`${JAW_LABELS[faceOptions.faceJawId]} jaw`);
  if (faceOptions.faceEyeShapeId)   parts.push(`${EYE_LABELS[faceOptions.faceEyeShapeId]} eyes`);
  if (faceOptions.faceEyeColorId)   parts.push(`${EYE_COLOR_LABELS[faceOptions.faceEyeColorId]} eye color`);
  if (faceOptions.faceNoseId)       parts.push(`${NOSE_LABELS[faceOptions.faceNoseId]} nose`);
  if (faceOptions.faceHairStyleId)  parts.push(`${HAIR_LABELS[faceOptions.faceHairStyleId]} hair`);
  if (faceOptions.faceHairColorId)  parts.push(`${HAIR_COLOR_LABELS[faceOptions.faceHairColorId]} hair color`);
  if (faceOptions.faceBeardId != null) parts.push(BEARD_LABELS[faceOptions.faceBeardId]);
  if (faceOptions.faceEyebrowId)    parts.push(`${EYEBROW_LABELS[faceOptions.faceEyebrowId]} eyebrows`);
  return parts.join(', ');
}
