/**
 * TEST: Generate 1 sample per category to validate style before full run.
 * Features shown ISOLATED — not full faces.
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.join(__dirname, '..', 'mobile_app', 'src', 'assets', 'face', 'test');

// Style that matches the game avatars exactly
const STYLE = `3D cartoon Pixar-inspired style, smooth plastic-like render, soft studio lighting, vibrant saturated colors, pure black background, NO text, NO watermark`;

const TESTS = [
  {
    file: 'test_hair_curly.png',
    prompt: `Isolated hair viewed from the front: voluminous curly dark brown hair, floating with no head or face visible, just the hair shape by itself on pure black background. ${STYLE}.`
  },
  {
    file: 'test_eyes_almond.png',
    prompt: `Isolated pair of cartoon eyes on pure black background: almond-shaped eyes, big expressive Pixar-style eyes with brown iris, thick eyelashes, slightly angled at the outer corners. Just the eyes floating, no face, no nose, no other features. ${STYLE}.`
  },
  {
    file: 'test_nose_button.png',
    prompt: `Isolated cartoon nose on pure black background: small cute button nose, round and upturned, front-facing view. Just the nose floating by itself, no face, no eyes, no other features. ${STYLE}.`
  },
  {
    file: 'test_brows_arched.png',
    prompt: `Isolated pair of cartoon eyebrows on pure black background: high arched eyebrows, dramatic curved shape with peak in the middle, dark brown color, thick and well-defined. Just the eyebrows floating, no face, no eyes, no other features. ${STYLE}.`
  },
  {
    file: 'test_beard_full.png',
    prompt: `Isolated cartoon beard on pure black background: thick full bushy beard, dark brown color, covering jaw and chin area, luxurious volume. Just the beard floating by itself, no face, no eyes, no other features. ${STYLE}.`
  },
  {
    file: 'test_jaw_square.png',
    prompt: `Isolated cartoon face shape silhouette on pure black background: square jawline outline, showing just the face contour/shape with strong angular square jaw, smooth skin-colored 3D shape. No eyes, no nose, no hair, just the face shape outline. ${STYLE}.`
  },
  {
    file: 'test_cheeks_chubby.png',
    prompt: `Isolated cartoon cheeks on pure black background: round chubby cheeks, puffy and full with a slight rosy blush, showing just the cheek area as a 3D shape. No eyes, no nose, no other features, just the round puffy cheeks floating. ${STYLE}.`
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
  console.log(`Generating ${TESTS.length} test images...\n`);

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
  console.log('\nDone! Check mobile_app/src/assets/face/test/');
}

main().catch(console.error);
