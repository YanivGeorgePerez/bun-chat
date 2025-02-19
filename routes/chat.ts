// routes/chat.ts
import { Router } from 'express';
import { generateChat, deleteChat } from '../controllers/chatController';
import Chat from '../models/Chat'; // For check endpoint

const router = Router();

router.post('/generate', generateChat);

router.delete('/:chatId', deleteChat);

router.get('/check', async (req, res) => {
  const chatCode = req.query.chatCode;
  if (!chatCode || typeof chatCode !== 'string') {
    return res.status(400).json({ error: 'chatCode required' });
  }
  const allowedRegex = /^[A-Za-z0-9 _-]+$/;
  if (!allowedRegex.test(chatCode)) {
    return res.status(400).json({ error: 'Invalid chat code format' });
  }
  const existingChat = await Chat.findOne({ chatId: chatCode });
  if (existingChat) {
    return res.json({ available: false });
  }
  return res.json({ available: true });
});

export default router;
