const { Router } = require('express');
const { getTodayWod, submitResults, getMonthlyAthletes } = require('../controllers/wod.controller');

const router = Router();

router.get('/today/:gymId', getTodayWod);
router.post('/:wodId/results', submitResults);
router.get('/monthly/:gymId', getMonthlyAthletes);

module.exports = router;
