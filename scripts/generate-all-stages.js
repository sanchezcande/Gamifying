/**
 * Generate ALL avatar stage variations from a selfie photo.
 * Stage 1 is generated from the selfie (base avatar).
 * Stages 2-5 are generated FROM the stage 1 avatar (keeps face identical).
 *
 * Usage:
 *   node scripts/generate-all-stages.js <path-to-selfie.jpg> [gender] [subfolder]
 *
 * Examples:
 *   node scripts/generate-all-stages.js ~/selfie.jpg MALE
 *   node scripts/generate-all-stages.js ~/selfie.jpg FEMALE v3
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
  generateAvatarFromSelfie,
  generateStageFromBase,
  STAGE_BUILD_MALE,
  STAGE_BUILD_FEMALE,
} = require('../src/services/avatarImageService');

async function main() {
  const selfiePath = process.argv[2];
  const genderArg = (process.argv[3] || '').toUpperCase();
  const subfolder = process.argv[4] || '';
  const OUT_DIR = path.join(__dirname, 'output', subfolder);

  if (!selfiePath) {
    console.error('Usage: node scripts/generate-all-stages.js <selfie-path> [MALE|FEMALE] [subfolder]');
    process.exit(1);
  }

  if (!process.env.GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY not set in .env');
    process.exit(1);
  }

  const resolvedPath = path.resolve(selfiePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const selfieBase64 = fs.readFileSync(resolvedPath).toString('base64');
  const ext = path.extname(resolvedPath).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  const selfieMimeType = mimeMap[ext] || 'image/jpeg';

  const genders = genderArg === 'MALE' ? ['MALE'] : genderArg === 'FEMALE' ? ['FEMALE'] : ['MALE', 'FEMALE'];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const gender of genders) {
    const builds = gender === 'FEMALE' ? STAGE_BUILD_FEMALE : STAGE_BUILD_MALE;
    const label = gender.toLowerCase();

    // Step 1: Generate stage 1 from selfie (this is the base avatar)
    console.log(`\n=== ${gender} ===`);
    console.log(`[1/5] Stage 1 (from selfie): "${builds[1].substring(0, 60)}..."`);

    let baseAvatarBase64;
    try {
      const result = await generateAvatarFromSelfie({
        selfieBase64,
        selfieMimeType,
        gender,
        avatarClass: 'ROOKIE',
        bodyStage: 1,
      });
      baseAvatarBase64 = result.imageBytes;
      const outPath = path.join(OUT_DIR, `stage_${label}_1.png`);
      fs.writeFileSync(outPath, Buffer.from(baseAvatarBase64, 'base64'));
      console.log(`  -> ${outPath} (BASE AVATAR)`);
    } catch (err) {
      console.error(`  X FAILED: ${err.message}`);
      continue;
    }

    // Steps 2-5: Generate from the base avatar (not the selfie)
    for (let stage = 2; stage <= 5; stage++) {
      console.log(`[${stage}/5] Stage ${stage} (from base avatar): "${builds[stage].substring(0, 60)}..."`);
      await new Promise(r => setTimeout(r, 2000));

      try {
        const result = await generateStageFromBase({
          baseAvatarBase64,
          gender,
          bodyStage: stage,
        });
        const outPath = path.join(OUT_DIR, `stage_${label}_${stage}.png`);
        fs.writeFileSync(outPath, Buffer.from(result.imageBytes, 'base64'));
        console.log(`  -> ${outPath}`);
      } catch (err) {
        console.error(`  X FAILED: ${err.message}`);
      }
    }
  }

  console.log(`\nDone! Images in ${OUT_DIR}`);
}

main().catch(console.error);
