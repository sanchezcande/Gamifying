const { getGenAIClient, CLASS_BUILD, STAGE_BUILD_MALE, STAGE_BUILD_FEMALE } = require('./avatarImageService');

const MOVE_DESCRIPTIONS = {
  ATTACK: 'lunges forward and throws a devastating straight punch that connects with full force, visible shockwave rippling from impact',
  DEFEND: 'plants feet wide and crosses arms in an iron guard stance, a translucent energy shield briefly flashes on impact',
  PROTEIN_SURGE: 'muscles swell and glow with intense golden energy, veins pulsing with light, then unleashes a massive overhead power slam that cracks the ground',
  CREATINE_BLAST: 'body crackles with blue electric lightning arcs, eyes glow bright blue, then fires a concentrated beam of raw energy from both fists',
  PREWORKOUT_RUSH: 'body blurs with extreme speed leaving afterimages, teleports behind opponent and delivers a lightning-fast five-hit combo in under a second',
  AURA_BURST: 'hovers off the ground surrounded by a swirling green healing aura, wounds visibly close, then channels all energy into a devastating spinning roundhouse kick',
};

function buildBattleVideoPrompt({ challenger, defender, rounds, winnerId }) {
  const cClass = CLASS_BUILD[challenger.avatarClass] || CLASS_BUILD.ROOKIE;
  const dClass = CLASS_BUILD[defender.avatarClass] || CLASS_BUILD.ROOKIE;
  const cGender = challenger.avatarGender === 'FEMALE' ? 'female' : 'male';
  const dGender = defender.avatarGender === 'FEMALE' ? 'female' : 'male';

  // Use stage builds for more detailed body descriptions
  const cStageBuilds = challenger.avatarGender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
  const dStageBuilds = defender.avatarGender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
  const cBuild = cStageBuilds[challenger.avatarBodyStage] || cClass;
  const dBuild = dStageBuilds[defender.avatarBodyStage] || dClass;

  const roundDescriptions = rounds.map((r) => {
    const cMove = MOVE_DESCRIPTIONS[r.challengerMove] || 'attacks';
    const dMove = MOVE_DESCRIPTIONS[r.defenderMove] || 'attacks';
    const cDmg = r.challengerDamageDealt || 0;
    const dDmg = r.defenderDamageDealt || 0;
    const bigHit = Math.max(cDmg, dDmg) > 25;
    const roundIntensity = r.round === 3 ? 'with maximum intensity and dramatic slow-motion on the final blow' : '';
    return `Round ${r.round}: Left fighter ${cMove}. Right fighter ${dMove}. ${bigHit ? 'The impact is massive, camera shakes.' : ''} ${roundIntensity}`;
  }).join(' ');

  const winnerSide = winnerId === challenger.id ? 'left' : 'right';
  const loserSide = winnerId === challenger.id ? 'right' : 'left';

  return [
    `Cinematic 3D animated battle between two fighting game characters in a dramatic gym arena with neon lights and energy particles`,
    `Art style: Pixar meets Street Fighter, stylized 3D with vibrant colors, dynamic lighting, anime-style energy effects and speed lines`,
    `Left fighter: ${cGender}, ${cBuild}, confident fighting stance`,
    `Right fighter: ${dGender}, ${dBuild}, aggressive fighting stance`,
    `The battle unfolds in 3 intense rounds:`,
    roundDescriptions,
    `After the final blow, the ${loserSide} fighter falls to their knees defeated`,
    `The ${winnerSide} fighter strikes a powerful victory pose, camera orbits around them as energy particles swirl, dramatic backlighting`,
    `Camera work: dynamic angles, close-ups on impacts, slow-motion on special moves, wide shots for the arena`,
    `No text, no watermark, no UI elements. Smooth 60fps animation, 8 seconds total`,
  ].join('. ') + '.';
}

async function generateBattleVideo({ challenger, defender, rounds, winnerId }) {
  const ai = getGenAIClient();
  if (!ai) throw new Error('GOOGLE_API_KEY is not configured');

  const prompt = buildBattleVideoPrompt({ challenger, defender, rounds, winnerId });

  // Build reference images — prefer AI-generated avatar (baseAvatarPhoto) over raw selfie (profilePhoto)
  const referenceImages = [];

  const challengerPhoto = challenger.baseAvatarPhoto || challenger.profilePhoto;
  const defenderPhoto = defender.baseAvatarPhoto || defender.profilePhoto;

  if (challengerPhoto && challengerPhoto.startsWith('data:')) {
    const [meta, data] = challengerPhoto.split(',');
    const mimeType = meta.match(/data:(.*?);/)?.[1] || 'image/png';
    referenceImages.push({
      image: { imageBytes: data, mimeType },
      referenceType: 'asset',
    });
  }

  if (defenderPhoto && defenderPhoto.startsWith('data:')) {
    const [meta, data] = defenderPhoto.split(',');
    const mimeType = meta.match(/data:(.*?);/)?.[1] || 'image/png';
    referenceImages.push({
      image: { imageBytes: data, mimeType },
      referenceType: 'asset',
    });
  }

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt,
    config: {
      ...(referenceImages.length > 0 ? { referenceImages } : {}),
      aspectRatio: '16:9',
      durationSeconds: 8,
    },
  });

  // Poll until video is ready
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const video = operation.response?.generatedVideos?.[0]?.video;
  if (!video) throw new Error('No video generated');

  return video;
}

function buildRoundVideoPrompt({ challenger, defender, round, roundIdx, totalRounds, winnerId }) {
  const cGender = challenger.avatarGender === 'FEMALE' ? 'female' : 'male';
  const dGender = defender.avatarGender === 'FEMALE' ? 'female' : 'male';
  const cStageBuilds = challenger.avatarGender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
  const dStageBuilds = defender.avatarGender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
  const cBuild = cStageBuilds[challenger.avatarBodyStage] || CLASS_BUILD[challenger.avatarClass] || CLASS_BUILD.ROOKIE;
  const dBuild = dStageBuilds[defender.avatarBodyStage] || CLASS_BUILD[defender.avatarClass] || CLASS_BUILD.ROOKIE;

  const cMove = MOVE_DESCRIPTIONS[round.challengerMove] || 'attacks';
  const dMove = MOVE_DESCRIPTIONS[round.defenderMove] || 'attacks';
  const cDmg = round.challengerDamageDealt || 0;
  const dDmg = round.defenderDamageDealt || 0;
  const bigHit = Math.max(cDmg, dDmg) > 25;
  const isLast = roundIdx === totalRounds - 1;
  const winnerSide = winnerId === challenger.id ? 'left' : 'right';
  const loserSide = winnerId === challenger.id ? 'right' : 'left';

  const parts = [
    `Cinematic 3D animated fight scene, Round ${roundIdx + 1}, two fighting game characters in a gym arena with neon lights`,
    `Art style: Pixar meets Street Fighter, stylized 3D, vibrant colors, anime-style energy effects`,
    `Left fighter: ${cGender}, ${cBuild}`,
    `Right fighter: ${dGender}, ${dBuild}`,
    `Action: Left fighter ${cMove}. Right fighter ${dMove}`,
  ];

  if (bigHit) parts.push('Massive impact, camera shakes violently');

  if (isLast) {
    parts.push(`Final blow with dramatic slow-motion`);
    parts.push(`The ${loserSide} fighter falls to their knees defeated`);
    parts.push(`The ${winnerSide} fighter strikes a victory pose with energy particles swirling`);
  }

  parts.push('Dynamic camera angles, close-ups on impacts');
  parts.push('No text, no watermark, smooth animation, 3 seconds');

  return parts.join('. ') + '.';
}

async function generateRoundVideo({ challenger, defender, round, roundIdx, totalRounds, winnerId }) {
  const ai = getGenAIClient();
  if (!ai) throw new Error('GOOGLE_API_KEY is not configured');

  const prompt = buildRoundVideoPrompt({ challenger, defender, round, roundIdx, totalRounds, winnerId });

  const referenceImages = [];
  const challengerPhoto = challenger.baseAvatarPhoto || challenger.profilePhoto;
  const defenderPhoto = defender.baseAvatarPhoto || defender.profilePhoto;

  if (challengerPhoto && challengerPhoto.startsWith('data:')) {
    const [meta, data] = challengerPhoto.split(',');
    const mimeType = meta.match(/data:(.*?);/)?.[1] || 'image/png';
    referenceImages.push({ image: { imageBytes: data, mimeType }, referenceType: 'asset' });
  }
  if (defenderPhoto && defenderPhoto.startsWith('data:')) {
    const [meta, data] = defenderPhoto.split(',');
    const mimeType = meta.match(/data:(.*?);/)?.[1] || 'image/png';
    referenceImages.push({ image: { imageBytes: data, mimeType }, referenceType: 'asset' });
  }

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt,
    config: {
      ...(referenceImages.length > 0 ? { referenceImages } : {}),
      aspectRatio: '16:9',
      durationSeconds: 3,
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const video = operation.response?.generatedVideos?.[0]?.video;
  if (!video) throw new Error('No video generated for round ' + (roundIdx + 1));
  return video;
}

module.exports = { generateBattleVideo, buildBattleVideoPrompt, generateRoundVideo, buildRoundVideoPrompt };
