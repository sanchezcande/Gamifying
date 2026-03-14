const cron = require('node-cron');
const prisma = require('./src/utils/prisma');
const app = require('./src/app');

const { runDailyDecay } = require('./src/jobs/dailyDecay');
const { runMonthlyReset } = require('./src/jobs/monthlyReset');
const { runExpireItems } = require('./src/jobs/expireItems');

cron.schedule('0 0 * * *', async () => {
  await runDailyDecay();
  await runExpireItems();
});

cron.schedule('1 0 1 * *', async () => {
  await runMonthlyReset();
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Gamifying API running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
