/**
 * FINAL: Full head portraits, same character, only the feature changes.
 * Style matches avatar_1_rookie.png exactly.
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.join(__dirname, '..', 'mobile_app', 'src', 'assets', 'face');

const CHAR = `Front-facing head portrait of a 3D cartoon male character, Pixar mobile game style, chibi proportions, oversized round head, big expressive brown eyes with white highlight, small nose, medium fair skin, friendly slight smile, smooth glossy 3D render, soft studio lighting, pure solid black background, cropped at neck, single character only`;

const ASSETS = [
  // ── HAIR (8) ──
  { file: 'hair_1_buzzcut.png',  prompt: `${CHAR}. He has a very short BUZZ CUT hairstyle, dark brown, almost shaved, clean and neat.` },
  { file: 'hair_2_fade.png',     prompt: `${CHAR}. He has a modern FADE hairstyle, dark brown, short sides fading to longer styled top.` },
  { file: 'hair_3_long.png',     prompt: `${CHAR}. He has LONG flowing dark brown hair past his shoulders, straight and smooth.` },
  { file: 'hair_4_curly.png',    prompt: `${CHAR}. He has voluminous CURLY dark brown hair with tight bouncy curls on top.` },
  { file: 'hair_5_mohawk.png',   prompt: `${CHAR}. He has a MOHAWK hairstyle, shaved sides with a tall spiked dark brown strip in the center.` },
  { file: 'hair_6_braids.png',   prompt: `${CHAR}. He has neat CORNROW BRAIDS, dark brown braided hair pulled back tight.` },
  { file: 'hair_7_bald.png',     prompt: `${CHAR}. He is completely BALD, smooth shaved head, no hair at all, clean scalp.` },
  { file: 'hair_8_messy.png',    prompt: `${CHAR}. He has MESSY tousled dark brown hair, disheveled spiky hair going in all directions.` },

  // ── EYES (6) ──
  { file: 'eyes_1_almond.png',   prompt: `${CHAR} with short brown hair. He has ALMOND-SHAPED eyes, elegant tapered shape wider in middle and pointed at outer corners.` },
  { file: 'eyes_2_round.png',    prompt: `${CHAR} with short brown hair. He has big perfectly ROUND wide-open eyes, very circular and expressive.` },
  { file: 'eyes_3_hooded.png',   prompt: `${CHAR} with short brown hair. He has HOODED eyes, heavy brow partially covering the upper eyelid, intense look.` },
  { file: 'eyes_4_monolid.png',  prompt: `${CHAR} with short brown hair. He has MONOLID eyes, smooth eyelid with no visible crease, East Asian eye shape.` },
  { file: 'eyes_5_upturned.png', prompt: `${CHAR} with short brown hair. He has UPTURNED eyes, outer corners tilted upward giving a cat-eye playful look.` },
  { file: 'eyes_6_deepset.png',  prompt: `${CHAR} with short brown hair. He has DEEP-SET eyes, set deeper under a prominent brow bone, creating shadow above eyes.` },

  // ── NOSE (5) ──
  { file: 'nose_1_button.png',   prompt: `${CHAR} with short brown hair. He has a small cute round BUTTON NOSE, tiny upturned and adorable.` },
  { file: 'nose_2_straight.png', prompt: `${CHAR} with short brown hair. He has a STRAIGHT NOSE, clean straight bridge, classic well-defined profile.` },
  { file: 'nose_3_wide.png',     prompt: `${CHAR} with short brown hair. He has a WIDE NOSE with broad nostrils and wide bridge, prominent.` },
  { file: 'nose_4_pointed.png',  prompt: `${CHAR} with short brown hair. He has a POINTED NOSE, sharp narrow tip, angular and defined.` },
  { file: 'nose_5_upturned.png', prompt: `${CHAR} with short brown hair. He has an UPTURNED NOSE, tip tilted upward, cute ski-slope shape.` },

  // ── EYEBROWS (4) ──
  { file: 'brows_1_thin.png',    prompt: `${CHAR} with short brown hair. He has very THIN delicate eyebrows, narrow sleek lines above the eyes, well-groomed.` },
  { file: 'brows_2_thick.png',   prompt: `${CHAR} with short brown hair. He has THICK bold bushy dark brown eyebrows, prominent and strong.` },
  { file: 'brows_3_arched.png',  prompt: `${CHAR} with short brown hair. He has HIGH ARCHED eyebrows, dramatic curved shape with peak, elegant.` },
  { file: 'brows_4_straight.png',prompt: `${CHAR} with short brown hair. He has STRAIGHT flat horizontal eyebrows with no arch, serious focused look.` },

  // ── BEARD (5) ──
  { file: 'beard_1_stubble.png', prompt: `${CHAR} with short brown hair. He has STUBBLE, light 5 o'clock shadow facial hair on jaw and chin, rough texture.` },
  { file: 'beard_2_short.png',   prompt: `${CHAR} with short brown hair. He has a neatly trimmed SHORT BEARD covering jaw and chin, well-maintained.` },
  { file: 'beard_3_full.png',    prompt: `${CHAR} with short brown hair. He has a thick FULL BUSHY BEARD covering entire lower face, impressive volume.` },
  { file: 'beard_4_goatee.png',  prompt: `${CHAR} with short brown hair. He has a GOATEE, facial hair only on chin and around mouth, clean shaved cheeks.` },
  { file: 'beard_5_mustache.png',prompt: `${CHAR} with short brown hair. He has a thick MUSTACHE only above the lip, no beard on chin or cheeks.` },

  // ── JAW SHAPE (6) ──
  { file: 'jaw_1_oval.png',      prompt: `${CHAR} with buzz cut hair. He has an OVAL face shape, smooth curved jawline, balanced proportions, egg-shaped face.` },
  { file: 'jaw_2_square.png',    prompt: `${CHAR} with buzz cut hair. He has a SQUARE face shape, wide angular jaw, flat chin, strong masculine square contour.` },
  { file: 'jaw_3_round.png',     prompt: `${CHAR} with buzz cut hair. He has a very ROUND face shape, circular soft jawline, no angles, baby-face round contour.` },
  { file: 'jaw_4_heart.png',     prompt: `${CHAR} with buzz cut hair. He has a HEART-SHAPED face, wide forehead tapering to a narrow pointed chin.` },
  { file: 'jaw_5_diamond.png',   prompt: `${CHAR} with buzz cut hair. He has a DIAMOND face shape, narrow forehead, wide prominent cheekbones, narrow chin.` },
  { file: 'jaw_6_sharp.png',     prompt: `${CHAR} with buzz cut hair. He has a SHARP angular face shape, very defined chiseled jawline, strong angular chin.` },

  // ── CHEEKS (4) ──
  { file: 'cheeks_1_flat.png',   prompt: `${CHAR} with buzz cut hair. He has FLAT cheeks, slim face with minimal cheek volume, lean and angular mid-face.` },
  { file: 'cheeks_2_chubby.png', prompt: `${CHAR} with buzz cut hair. He has CHUBBY round cheeks, puffy full cheeks with slight rosy blush, cute and full.` },
  { file: 'cheeks_3_defined.png',prompt: `${CHAR} with buzz cut hair. He has DEFINED cheekbones, visible sculpted cheek structure, angular mid-face.` },
  { file: 'cheeks_4_hollow.png', prompt: `${CHAR} with buzz cut hair. He has HOLLOW cheeks, sunken cheeks below the cheekbones, gaunt and sharp look.` },
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
  console.log(`Generating ${ASSETS.length} final face assets...\n`);

  for (let i = 0; i < ASSETS.length; i++) {
    const a = ASSETS[i];
    console.log(`[${i + 1}/${ASSETS.length}] ${a.file}...`);
    try {
      const res = await openai.images.generate({
        model: 'dall-e-3',
        prompt: a.prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });
      await downloadImage(res.data[0].url, path.join(OUT_DIR, a.file));
      console.log(`  ✓ saved`);
    } catch (err) {
      console.error(`  ✗ FAILED: ${err.message}`);
    }
    if (i < ASSETS.length - 1) await new Promise(r => setTimeout(r, 1000));
  }
  console.log('\nDone!');
}

main().catch(console.error);
