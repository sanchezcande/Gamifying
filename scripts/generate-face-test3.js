/**
 * TEST 3: Same exact game character for all. Close-up crop focused on the feature area.
 * Style: exactly like avatar_1_rookie.png — male chibi 3D cartoon, red tank top,
 * big brown eyes, medium skin, Pixar mobile game style.
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.join(__dirname, '..', 'mobile_app', 'src', 'assets', 'face', 'test3');

// Exact description of the game's character style from avatar_1_rookie.png
const CHAR = `3D cartoon male character in Pixar mobile game style, chibi proportions, oversized round head, big expressive brown eyes with white highlights, small cute nose, medium fair skin tone, friendly smile, smooth glossy plastic-like 3D render, soft studio lighting, pure solid black background`;

const TESTS = [
  // HAIR — show full head, hair is the differentiator
  {
    file: 'test3_hair_curly.png',
    prompt: `Front-facing head portrait of a ${CHAR}. He has voluminous CURLY dark brown hair with tight bouncy curls. Close-up of head and hair only, cropped at the neck. The curly hairstyle is the main focus.`
  },
  // EYES — close crop on eye area
  {
    file: 'test3_eyes_round.png',
    prompt: `Extreme close-up of JUST the eye area of a ${CHAR}. He has big perfectly ROUND wide-open eyes — circular shape, very round and expressive, brown iris with white highlight dot. Show only from eyebrows to top of nose, cropped tight. Black background.`
  },
  // NOSE — close crop on nose area
  {
    file: 'test3_nose_wide.png',
    prompt: `Extreme close-up of JUST the nose area of a ${CHAR}. He has a WIDE nose — broad nostrils, wide bridge, prominent and strong. Show only from bottom of eyes to top of mouth, cropped tight to focus only on the nose. Black background.`
  },
  // BROWS — close crop on brow area
  {
    file: 'test3_brows_thick.png',
    prompt: `Extreme close-up of JUST the eyebrow area of a ${CHAR}. He has THICK bold bushy dark brown eyebrows — prominent, wide, strong and expressive. Show only from forehead to mid-eye level, cropped tight. Black background.`
  },
  // BEARD — lower face crop
  {
    file: 'test3_beard_goatee.png',
    prompt: `Front-facing head portrait of a ${CHAR}. He has a dark brown GOATEE — facial hair only on chin and around mouth, cheeks are clean shaven, pointed chin beard. Short buzz cut hair. Close-up of head cropped at neck. The goatee is the main focus.`
  },
  // JAW — full head showing face shape
  {
    file: 'test3_jaw_round.png',
    prompt: `Front-facing head portrait of a ${CHAR}. He has a very ROUND face shape — circular jawline, soft rounded chin, no angular features, baby-face round contour. Bald/buzz cut to clearly show the round face shape. Close-up of head cropped at neck. The round face shape is the main focus.`
  },
  // CHEEKS — full head showing cheek shape
  {
    file: 'test3_cheeks_defined.png',
    prompt: `Front-facing head portrait of a ${CHAR}. He has DEFINED cheekbones — visible cheek structure, slightly hollow below the cheekbones, sculpted and angular mid-face. Short buzz cut hair. Close-up of head cropped at neck. The defined cheekbone structure is the main focus.`
  },
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${TESTS.length} test3 images...\n`);

  for (let i = 0; i < TESTS.length; i++) {
    const t = TESTS[i];
    console.log(`[${i + 1}/${TESTS.length}] ${t.file}...`);
    try {
      const res = await openai.images.generate({
        model: 'dall-e-3',
        prompt: t.prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });
      await downloadImage(res.data[0].url, path.join(OUT_DIR, t.file));
      console.log(`  ✓ saved`);
    } catch (err) {
      console.error(`  ✗ FAILED: ${err.message}`);
    }
    if (i < TESTS.length - 1) await new Promise(r => setTimeout(r, 1000));
  }
  console.log('\nDone!');
}

main().catch(console.error);
