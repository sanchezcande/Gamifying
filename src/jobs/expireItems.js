const { expireSupplements } = require('../services/supplementService');

async function runExpireItems() {
  await expireSupplements();
}

module.exports = { runExpireItems };
