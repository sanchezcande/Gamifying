const { getGenAIClient, CLASS_BUILD } = require('./avatarImageService');

const MOVE_DESCRIPTIONS = {
  ATTACK: 'throws a powerful punch',
  DEFEND: 'blocks with arms crossed in defensive stance',
  PROTEIN_SURGE: 'glows with golden energy and unleashes a massive power strike',
  CREATINE_BLAST: 'charges up with blue lightning and delivers an explosive hit',
  PREWORKOUT_RUSH: 'dashes forward at lightning speed with a rapid combo attack',
  AURA_BURST: 'radiates green healing aura while launching a spinning kick',
};

function buildBattleVideoPrompt({ challenger, defender, rounds, winnerId }) {
  const cClass = CLASS_BUILD[challenger.avatarClass] || CLASS_BUILD.ROOKIE;
  const dClass = CLASS_BUILD[defender.avatarClass] || CLASS_BUILD.ROOKIE;
  const cGender = challenger.avatarGender === 'FEMALE' ? 'female' : 'male';
  const dGender = defender.avatarGender === 'FEMALE' ? 'female' : 'male';

  const roundDescriptions = rounds.map((r) => {
    const cMove = MOVE_DESCRIPTIONS[r.challengerMove] || 'attacks';
    const dMove = MOVE_DESCRIPTIONS[r.defenderMove] || 'attacks';
    return `Round ${r.round}: Left character ${cMove}. Right character ${dMove}.`;
  }).join(' ');

  const winnerSide = winnerId === challenger.id ? 'left' : 'right';

  return [
    `Epic 3D cartoon battle animation between two fitness characters in a gym arena`,
    `Left: ${cGender} character, ${cClass}`,
    `Right: ${dGender} character, ${dClass}`,
    `Pixar-inspired mobile game art style, chibi proportions, vibrant colors`,
    roundDescriptions,
    `The ${winnerSide} character wins with a victory pose at the end`,
    `Dynamic camera angles, dramatic lighting, anime-style action effects`,
    `Smooth animation, no text, no watermark`,
  ].join('. ') + '.';
}

async function generateBattleVideo({ challenger, defender, rounds, winnerId }) {
  const ai = getGenAIClient();
  if (!ai) throw new Error('GOOGLE_API_KEY is not configured');

  const prompt = buildBattleVideoPrompt({ challenger, defender, rounds, winnerId });

  // Build reference images from avatar profile photos (base64 data URIs)
  const referenceImages = [];

  if (challenger.profilePhoto && challenger.profilePhoto.startsWith('data:')) {
    const [meta, data] = challenger.profilePhoto.split(',');
    const mimeType = meta.match(/data:(.*?);/)?.[1] || 'image/png';
    referenceImages.push({
      image: { imageBytes: data, mimeType },
      referenceType: 'asset',
    });
  }

  if (defender.profilePhoto && defender.profilePhoto.startsWith('data:')) {
    const [meta, data] = defender.profilePhoto.split(',');
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

module.exports = { generateBattleVideo, buildBattleVideoPrompt };
