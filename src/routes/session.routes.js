const express = require('express');
const { createSession, getSessions, joinSession, cancelSession, savePushToken, getMessages, sendMessage } = require('../controllers/session.controller');

const router = express.Router();

router.get('/', getSessions);
router.post('/', createSession);
router.post('/push-token', savePushToken);
router.post('/:id/join', joinSession);
router.delete('/:id', cancelSession);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;
