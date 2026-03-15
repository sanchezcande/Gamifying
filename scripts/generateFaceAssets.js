/**
 * Generate ISOLATED face part preview thumbnails using DALL-E 3.
 * Each image shows ONLY the individual part (hair, eyes, nose, etc.)
 * floating on a black background — no full faces, no characters.
 * These are used as selector thumbnails in the character creator.
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

// Style lock — every part must look like it belongs to the same 3D cartoon game
const STYLE = '3D cartoon Pixar-inspired style, solid black background, game character customization icon, vibrant colors, soft lighting, clean smooth 3D render, centered in frame, no text, no watermark, no extra objects';

const ASSETS = [
  // ── Hair styles (isolated floating hair piece, NO face underneath) ──
  { file: 'hair_1_buzzcut', prompt: `An isolated buzz cut hairstyle shown as a floating hair piece from above, very short cropped dark hair, ${STYLE}, just the hair alone like a wig on display, no face, no head, no skin visible` },
  { file: 'hair_2_fade',    prompt: `An isolated fade hairstyle shown as a floating hair piece, short on sides longer on top, dark hair, ${STYLE}, just the hair alone like a wig on display, no face, no head, no skin visible` },
  { file: 'hair_3_long',    prompt: `An isolated long flowing hairstyle shown as a floating hair piece, shoulder-length straight hair, dark hair, ${STYLE}, just the hair alone like a wig on display, no face, no head, no skin visible` },
  { file: 'hair_4_curly',   prompt: `An isolated curly hairstyle shown as a floating hair piece, bouncy curls, dark hair, ${STYLE}, just the hair alone like a wig on display, no face, no head, no skin visible` },
  { file: 'hair_5_mohawk',  prompt: `An isolated mohawk hairstyle shown as a floating hair piece, tall spiked strip of hair, dark hair, ${STYLE}, just the hair alone like a wig on display, no face, no head, no skin visible` },
  { file: 'hair_6_braids',  prompt: `An isolated braided hairstyle shown as a floating hair piece, two long braids, dark hair, ${STYLE}, just the hair alone like a wig on display, no face, no head, no skin visible` },
  { file: 'hair_7_bald',    prompt: `A smooth bald head silhouette, simple round shape, no hair, ${STYLE}, minimal, just a clean smooth dome shape` },
  { file: 'hair_8_messy',   prompt: `An isolated messy tousled hairstyle shown as a floating hair piece, spiky and wild, dark hair, ${STYLE}, just the hair alone like a wig on display, no face, no head, no skin visible` },

  // ── Eye shapes (just a pair of cartoon eyes, NO face) ──
  { file: 'eyes_1_almond',  prompt: `A pair of almond-shaped cartoon eyes floating in isolation, expressive with visible iris and pupil, ${STYLE}, just two eyes side by side, no face, no eyebrows, no nose, no other facial features` },
  { file: 'eyes_2_round',   prompt: `A pair of large round cartoon eyes floating in isolation, big and expressive with visible iris and pupil, ${STYLE}, just two eyes side by side, no face, no eyebrows, no nose, no other facial features` },
  { file: 'eyes_3_hooded',  prompt: `A pair of hooded cartoon eyes floating in isolation, partially covered upper lids, with visible iris and pupil, ${STYLE}, just two eyes side by side, no face, no eyebrows, no nose, no other facial features` },
  { file: 'eyes_4_monolid', prompt: `A pair of monolid cartoon eyes floating in isolation, smooth lid without crease, with visible iris and pupil, ${STYLE}, just two eyes side by side, no face, no eyebrows, no nose, no other facial features` },
  { file: 'eyes_5_upturned',prompt: `A pair of upturned cat-like cartoon eyes floating in isolation, outer corners angled up, with visible iris and pupil, ${STYLE}, just two eyes side by side, no face, no eyebrows, no nose, no other facial features` },
  { file: 'eyes_6_deepset', prompt: `A pair of deep-set cartoon eyes floating in isolation, set back with prominent brow ridge shadow, with visible iris and pupil, ${STYLE}, just two eyes side by side, no face, no eyebrows, no nose, no other facial features` },

  // ── Nose shapes (just the nose, NO face) ──
  { file: 'nose_1_button',  prompt: `A small round button nose in isolation, cute cartoon nose, ${STYLE}, just the nose alone floating, no face, no other features, simple and clean` },
  { file: 'nose_2_straight', prompt: `A straight narrow nose in isolation, cartoon style, ${STYLE}, just the nose alone floating, no face, no other features, simple and clean` },
  { file: 'nose_3_wide',    prompt: `A wide flat nose in isolation, cartoon style, ${STYLE}, just the nose alone floating, no face, no other features, simple and clean` },
  { file: 'nose_4_pointed', prompt: `A pointed sharp nose in isolation, cartoon style, ${STYLE}, just the nose alone floating, no face, no other features, simple and clean` },
  { file: 'nose_5_upturned',prompt: `An upturned nose with tip pointing up in isolation, cartoon style, ${STYLE}, just the nose alone floating, no face, no other features, simple and clean` },

  // ── Eyebrow shapes (just the pair of eyebrows, NO face) ──
  { file: 'brows_1_thin',    prompt: `A pair of thin delicate eyebrows floating in isolation, narrow arched brow hair, ${STYLE}, just the two eyebrows alone, no face, no eyes, no other features` },
  { file: 'brows_2_thick',   prompt: `A pair of thick bold eyebrows floating in isolation, bushy wide brow hair, ${STYLE}, just the two eyebrows alone, no face, no eyes, no other features` },
  { file: 'brows_3_arched',  prompt: `A pair of high arched eyebrows floating in isolation, dramatically curved brow hair, ${STYLE}, just the two eyebrows alone, no face, no eyes, no other features` },
  { file: 'brows_4_straight',prompt: `A pair of straight flat eyebrows floating in isolation, horizontal brow hair, ${STYLE}, just the two eyebrows alone, no face, no eyes, no other features` },

  // ── Beard styles (just the facial hair, NO face) ──
  { file: 'beard_1_stubble',  prompt: `Stubble facial hair pattern in isolation, short rough hair dots forming a jaw and chin shape, ${STYLE}, just the facial hair alone floating, no face, no skin, no other features` },
  { file: 'beard_2_short',    prompt: `A short trimmed beard in isolation, neat and groomed facial hair, ${STYLE}, just the beard hair alone floating, no face, no skin, no other features` },
  { file: 'beard_3_full',     prompt: `A full thick beard in isolation, long bushy facial hair, ${STYLE}, just the beard hair alone floating, no face, no skin, no other features` },
  { file: 'beard_4_goatee',   prompt: `A goatee in isolation, small pointed chin beard, ${STYLE}, just the facial hair alone floating, no face, no skin, no other features` },
  { file: 'beard_5_mustache', prompt: `A mustache in isolation, thick curved upper lip hair, ${STYLE}, just the mustache hair alone floating, no face, no skin, no other features` },
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
  console.log(`Generating ${ASSETS.length} isolated face part assets...\n`);
  // Process in batches of 3 to avoid rate limits
  for (let i = 0; i < ASSETS.length; i += 3) {
    const batch = ASSETS.slice(i, i + 3);
    await Promise.all(batch.map(generateOne));
  }
  console.log('\nDone! Assets saved to:', OUT_DIR);
}

run();
