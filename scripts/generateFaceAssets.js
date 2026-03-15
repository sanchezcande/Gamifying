/**
 * Generate face part preview thumbnails using DALL-E 3.
 * Each image shows a complete cartoon face highlighting one specific feature.
 * Run: node scripts/generateFaceAssets.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const https = require('https');
const http = require('http');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.join(__dirname, '..', 'mobile_app', 'src', 'assets', 'face');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_STYLE = '3D cartoon chibi style, close-up face portrait, dark background, mobile game character, vibrant, clean, no text, no watermark';

const ASSETS = [
  // Hair styles
  { file: 'hair_1_buzzcur', prompt: `male character with buzz cut hairstyle, ${BASE_STYLE}` },
  { file: 'hair_2_fade', prompt: `male character with fade hairstyle, ${BASE_STYLE}` },
  { file: 'hair_3_long', prompt: `male character with long flowing hair, ${BASE_STYLE}` },
  { file: 'hair_4_curly', prompt: `male character with curly hair, ${BASE_STYLE}` },
  { file: 'hair_5_mohawk', prompt: `male character with mohawk hairstyle, ${BASE_STYLE}` },
  { file: 'hair_6_braids', prompt: `male character with braided hair, ${BASE_STYLE}` },
  { file: 'hair_7_bald', prompt: `male character who is bald, smooth head, ${BASE_STYLE}` },
  { file: 'hair_8_messy', prompt: `male character with messy tousled hair, ${BASE_STYLE}` },

  // Eye shapes
  { file: 'eyes_1_almond', prompt: `character face with almond-shaped eyes, ${BASE_STYLE}` },
  { file: 'eyes_2_round', prompt: `character face with large round eyes, ${BASE_STYLE}` },
  { file: 'eyes_3_hooded', prompt: `character face with hooded eyes, ${BASE_STYLE}` },
  { file: 'eyes_4_monolid', prompt: `character face with monolid eyes, ${BASE_STYLE}` },
  { file: 'eyes_5_upturned', prompt: `character face with upturned cat-like eyes, ${BASE_STYLE}` },
  { file: 'eyes_6_deepset', prompt: `character face with deep-set eyes, ${BASE_STYLE}` },

  // Noses
  { file: 'nose_1_button', prompt: `character face with small button nose, ${BASE_STYLE}` },
  { file: 'nose_2_straight', prompt: `character face with straight nose, ${BASE_STYLE}` },
  { file: 'nose_3_wide', prompt: `character face with wide nose, ${BASE_STYLE}` },
  { file: 'nose_4_pointed', prompt: `character face with pointed nose, ${BASE_STYLE}` },
  { file: 'nose_5_upturned', prompt: `character face with upturned nose, ${BASE_STYLE}` },

  // Eyebrows
  { file: 'brows_1_thin', prompt: `character face with thin eyebrows, ${BASE_STYLE}` },
  { file: 'brows_2_thick', prompt: `character face with thick bold eyebrows, ${BASE_STYLE}` },
  { file: 'brows_3_arched', prompt: `character face with high arched eyebrows, ${BASE_STYLE}` },
  { file: 'brows_4_straight', prompt: `character face with straight flat eyebrows, ${BASE_STYLE}` },

  // Beards
  { file: 'beard_1_stubble', prompt: `male character with stubble facial hair, ${BASE_STYLE}` },
  { file: 'beard_2_short', prompt: `male character with short trimmed beard, ${BASE_STYLE}` },
  { file: 'beard_3_full', prompt: `male character with full thick beard, ${BASE_STYLE}` },
  { file: 'beard_4_goatee', prompt: `male character with goatee, ${BASE_STYLE}` },
  { file: 'beard_5_mustache', prompt: `male character with mustache only, ${BASE_STYLE}` },
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      }
      const stream = fs.createWriteStream(filepath);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(); });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

async function generateOne(asset) {
  const filepath = path.join(OUT_DIR, `${asset.file}.png`);
  if (fs.existsSync(filepath)) {
    console.log(`SKIP ${asset.file} (already exists)`);
    return;
  }
  console.log(`GEN  ${asset.file}...`);
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: asset.prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });
    const url = response.data[0].url;
    await downloadImage(url, filepath);
    console.log(`OK   ${asset.file}`);
  } catch (err) {
    console.error(`FAIL ${asset.file}: ${err.message}`);
  }
}

async function run() {
  console.log(`Generating ${ASSETS.length} face assets...\n`);
  // Process in batches of 3 to avoid rate limits
  for (let i = 0; i < ASSETS.length; i += 3) {
    const batch = ASSETS.slice(i, i + 3);
    await Promise.all(batch.map(generateOne));
  }
  console.log('\nDone! Assets saved to:', OUT_DIR);
}

run();
