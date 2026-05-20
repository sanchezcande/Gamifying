/**
 * Generate face feature preview images for avatar creation screen.
 * Matches the exact game art style: 3D cartoon chibi character, Pixar-inspired,
 * same as avatar_1_rookie.png style.
 *
 * Usage: node scripts/generate-face-assets.js
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUT_DIR = path.join(__dirname, '..', 'mobile_app', 'src', 'assets', 'face');

// Base style prompt — matches the exact game avatar style
const BASE = `3D cartoon character face close-up, Pixar-inspired mobile game art style, chibi proportions with oversized head, big expressive eyes, smooth 3D render, soft lighting, vibrant colors, clean solid pure BLACK (#000000) background, NO text, NO watermark, single face only, front-facing portrait view cropped from forehead to chin`;

const ASSETS = [
  // ── HAIR STYLES ──
  { file: 'hair_1_buzzcut.png',   prompt: `${BASE}. Male character with BUZZ CUT hairstyle, very short cropped dark brown hair, clean and neat. Focus on showing the hair style clearly.` },
  { file: 'hair_2_fade.png',      prompt: `${BASE}. Male character with FADE hairstyle, short sides fading to longer on top, dark brown hair, modern barber fade cut. Focus on showing the hair style clearly.` },
  { file: 'hair_3_long.png',      prompt: `${BASE}. Male character with LONG flowing hair past the shoulders, dark brown hair, straight and smooth. Focus on showing the hair style clearly.` },
  { file: 'hair_4_curly.png',     prompt: `${BASE}. Male character with CURLY hair, tight bouncy curls, dark brown voluminous curly hair. Focus on showing the hair style clearly.` },
  { file: 'hair_5_mohawk.png',    prompt: `${BASE}. Male character with MOHAWK hairstyle, shaved sides with tall spiked strip of dark brown hair in the center. Focus on showing the hair style clearly.` },
  { file: 'hair_6_braids.png',    prompt: `${BASE}. Male character with BRAIDS hairstyle, neat cornrow braids, dark brown braided hair. Focus on showing the hair style clearly.` },
  { file: 'hair_7_bald.png',      prompt: `${BASE}. Male character who is completely BALD, smooth shaved head with no hair at all, clean scalp. Focus on showing the bald head clearly.` },
  { file: 'hair_8_messy.png',     prompt: `${BASE}. Male character with MESSY tousled hair, disheveled spiky dark brown hair going in all directions, bed head style. Focus on showing the hair style clearly.` },

  // ── EYE SHAPES ──
  { file: 'eyes_1_almond.png',    prompt: `${BASE}. Close-up showing ALMOND-SHAPED eyes, elegant tapered eye shape wider in the middle and pointed at corners, big expressive cartoon eyes with light brown iris.` },
  { file: 'eyes_2_round.png',     prompt: `${BASE}. Close-up showing big perfectly ROUND eyes, wide open circular cartoon eyes with light brown iris, very round and expressive.` },
  { file: 'eyes_3_hooded.png',    prompt: `${BASE}. Close-up showing HOODED eyes, partially covered upper eyelid, heavy brow creating a mysterious intense look, light brown iris.` },
  { file: 'eyes_4_monolid.png',   prompt: `${BASE}. Close-up showing MONOLID eyes, smooth eyelid with no visible crease, East Asian eye shape, elegant and clean, light brown iris.` },
  { file: 'eyes_5_upturned.png',  prompt: `${BASE}. Close-up showing UPTURNED eyes, outer corners tilted upward giving a cat-eye appearance, playful and alert look, light brown iris.` },
  { file: 'eyes_6_deepset.png',   prompt: `${BASE}. Close-up showing DEEP-SET eyes, eyes set deeper into the skull under a prominent brow bone, creating shadow above the eye, intense look, light brown iris.` },

  // ── NOSE SHAPES ──
  { file: 'nose_1_button.png',    prompt: `${BASE}. Close-up showing a small cute BUTTON NOSE, tiny round upturned nose, adorable and petite, characteristic of cute cartoon characters.` },
  { file: 'nose_2_straight.png',  prompt: `${BASE}. Close-up showing a STRAIGHT NOSE, clean straight bridge from top to bottom, classic profile, well-defined and symmetrical.` },
  { file: 'nose_3_wide.png',      prompt: `${BASE}. Close-up showing a WIDE NOSE, broad nostrils and wide bridge, strong and prominent nose shape.` },
  { file: 'nose_4_pointed.png',   prompt: `${BASE}. Close-up showing a POINTED NOSE, sharp narrow tip pointing slightly forward, angular and defined nose.` },
  { file: 'nose_5_upturned.png',  prompt: `${BASE}. Close-up showing an UPTURNED NOSE, tip tilted upward showing nostrils slightly, cute ski-slope shape.` },

  // ── EYEBROW STYLES ──
  { file: 'brows_1_thin.png',     prompt: `${BASE}. Close-up of face showing THIN eyebrows, very narrow delicate eyebrow lines, well-groomed and sleek, dark brown color.` },
  { file: 'brows_2_thick.png',    prompt: `${BASE}. Close-up of face showing THICK bushy eyebrows, bold prominent wide eyebrows, strong and expressive, dark brown color.` },
  { file: 'brows_3_arched.png',   prompt: `${BASE}. Close-up of face showing HIGH ARCHED eyebrows, dramatic curve with high peak, elegant and surprised look, dark brown color.` },
  { file: 'brows_4_straight.png', prompt: `${BASE}. Close-up of face showing STRAIGHT horizontal eyebrows, flat with no arch, serious and focused expression, dark brown color.` },

  // ── BEARD STYLES ──
  { file: 'beard_1_stubble.png',  prompt: `${BASE}. Male character face with STUBBLE beard, 5 o'clock shadow, light facial hair growth covering jaw and chin, short and rough texture, dark brown.` },
  { file: 'beard_2_short.png',    prompt: `${BASE}. Male character face with SHORT BEARD, neatly trimmed short full beard covering jaw and chin, well-maintained, dark brown.` },
  { file: 'beard_3_full.png',     prompt: `${BASE}. Male character face with FULL thick BEARD, long bushy beard covering entire lower face, impressive and voluminous, dark brown.` },
  { file: 'beard_4_goatee.png',   prompt: `${BASE}. Male character face with GOATEE, beard only on chin and around mouth, clean shaved cheeks, pointed chin beard, dark brown.` },
  { file: 'beard_5_mustache.png', prompt: `${BASE}. Male character face with thick MUSTACHE only, prominent handlebar-style mustache above the lip, no beard on chin or cheeks, dark brown.` },
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => { file.close(resolve); });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generateOne(asset, index) {
  const filepath = path.join(OUT_DIR, asset.file);
  console.log(`[${index + 1}/${ASSETS.length}] Generating ${asset.file}...`);

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
    console.log(`  ✓ ${asset.file} saved`);
  } catch (err) {
    console.error(`  ✗ ${asset.file} FAILED: ${err.message}`);
  }
}

async function main() {
  console.log(`\nGenerating ${ASSETS.length} face preview assets...`);
  console.log(`Output: ${OUT_DIR}\n`);

  // Generate sequentially to avoid rate limits
  for (let i = 0; i < ASSETS.length; i++) {
    await generateOne(ASSETS[i], i);
    // Small delay between requests to avoid rate limits
    if (i < ASSETS.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
