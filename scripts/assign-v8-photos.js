/**
 * Assign v8 avatar photos to seed users based on their gender and body stage.
 * Run after seed: node scripts/assign-v8-photos.js
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const V8_DIR = path.join(__dirname, 'output', 'v8');

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatarGender: true, avatarBodyStage: true },
    orderBy: { name: 'asc' },
  });

  for (const user of users) {
    const gender = (user.avatarGender || 'MALE').toLowerCase();
    const stage = user.avatarBodyStage || 1;
    const file = path.join(V8_DIR, `stage_${gender}_${stage}.png`);

    if (!fs.existsSync(file)) {
      console.log(`  skip ${user.name} — no file for ${gender} stage ${stage}`);
      continue;
    }

    const base64 = fs.readFileSync(file).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        profilePhoto: dataUrl,
        baseAvatarPhoto: dataUrl,
      },
    });

    console.log(`  ${user.name}: ${gender} stage ${stage} assigned`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
