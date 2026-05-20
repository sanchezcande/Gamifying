/**
 * TEST 2: Same base mannequin head, only the specific feature is detailed/visible.
 * Everything else is a smooth blank 3D cartoon head.
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.join(__dirname, '..', 'mobile_app', 'src', 'assets', 'face', 'test2');

// Exact game style: matches avatar_1_rookie.png — chibi 3D cartoon, big head, Pixar-like
const STYLE = `3D cartoon style matching Pixar and mobile fitness game characters, smooth glossy plastic render, chibi proportions with oversized round head, medium skin tone, soft studio lighting, pure solid black background (#000000), centered, front-facing, NO text, NO watermark, NO extra objects`;

const MANNEQUIN = `A simple 3D cartoon mannequin head, bald, no eyebrows, no facial hair, smooth featureless face with only tiny dot eyes and a flat smooth area where the nose would be`;

const TESTS = [
  {
    file: 'test2_hair_curly.png',
    prompt: `${MANNEQUIN}, BUT with a detailed voluminous CURLY dark brown hairstyle on top. The hair is the only detailed feature — everything else on the face is minimal and smooth. The curly hair should be the clear focus. ${STYLE}.`
  },
  {
    file: 'test2_eyes_almond.png',
    prompt: `${MANNEQUIN}, BUT with detailed big beautiful ALMOND-SHAPED cartoon eyes — tapered at corners, wider in middle, brown iris, white highlights, thick upper lash line. The eyes are the only detailed feature, rest of face is smooth and minimal. ${STYLE}.`
  },
  {
    file: 'test2_nose_button.png',
    prompt: `${MANNEQUIN}, BUT with a detailed small cute round BUTTON NOSE — upturned, petite, adorable. The nose is the only detailed feature, rest of face has only tiny dot eyes and is smooth. ${STYLE}.`
  },
  {
    file: 'test2_brows_arched.png',
    prompt: `${MANNEQUIN} with tiny dot eyes, BUT with detailed prominent HIGH ARCHED EYEBROWS above the eyes — dramatic curved shape, dark brown, thick and well-groomed. The eyebrows are the only detailed feature. ${STYLE}.`
  },
  {
    file: 'test2_beard_full.png',
    prompt: `${MANNEQUIN} with tiny dot eyes, BUT with a detailed thick FULL BEARD covering the entire lower face — bushy, dark brown, voluminous. The beard is the only detailed feature, head is bald and smooth. ${STYLE}.`
  },
  {
    file: 'test2_jaw_square.png',
    prompt: `A 3D cartoon head showing a strong SQUARE JAWLINE — wide angular jaw, flat chin, masculine square face shape. Bald, minimal features (tiny dot eyes, small nose), the focus is entirely on the square angular jaw shape and face contour. ${STYLE}.`
  },
  {
    file: 'test2_cheeks_chubby.png',
    prompt: `A 3D cartoon head with round CHUBBY CHEEKS — puffy, full, pillowy cheeks that push up slightly toward the eyes, with a slight pink blush. Bald, minimal features (tiny dot eyes, small nose), the focus is entirely on the round full cheek volume. ${STYLE}.`
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
  console.log(`Generating ${TESTS.length} test2 images...\n`);

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
  console.log('\nDone! Check mobile_app/src/assets/face/test2/');
}

main().catch(console.error);
