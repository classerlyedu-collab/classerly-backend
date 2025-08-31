const express = require('express');
const router = express.Router();
const studentAuth = require('../middlewares/studentAuth');
const {
    getOrCreateChatSession,
    sendMessage,
    getChatHistory,
    getStudentChatSessions,
    closeChatSession
} = require('../controllers/chatbot.controller');

// All routes require student authentication
router.use(studentAuth);

// Chat session management
router.post('/session', getOrCreateChatSession);
router.get('/sessions', getStudentChatSessions);
router.get('/session/:sessionId', getChatHistory);
router.delete('/session/:sessionId', closeChatSession);

// Chat messaging
router.post('/message', sendMessage);

module.exports = router;
