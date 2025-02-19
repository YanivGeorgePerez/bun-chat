// controllers/chatController.ts
import { Request, Response } from 'express';
import Chat from '../models/Chat';
import CryptoJS from 'crypto-js';

// Utility function to generate a random chat ID
function generateRandomChatId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Allowed characters: letters, numbers, spaces, underscores, and dashes.
const allowedRegex = /^[A-Za-z0-9 _-]+$/;

export const generateChat = async (req: Request, res: Response) => {
  const { password, chatCode } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  let chatId: string;
  if (chatCode) {
    // Validate custom chat code format
    if (typeof chatCode !== 'string' || !allowedRegex.test(chatCode)) {
      return res.status(400).json({ error: 'Invalid chat code format. Only letters, numbers, spaces, underscores, and dashes are allowed.' });
    }
    // Check if the provided chat code is already taken
    const existingChat = await Chat.findOne({ chatId: chatCode });
    if (existingChat) {
      return res.status(400).json({ error: 'Chat code is already taken' });
    }
    chatId = chatCode;
  } else {
    chatId = generateRandomChatId();
  }

  const passwordHash = CryptoJS.SHA256(password).toString();
  try {
    const chat = new Chat({
      chatId,
      passwordHash,
      messages: []
    });
    await chat.save();
    res.json({ chatId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate chat' });
  }
};

// New: Delete Chat endpoint
export const deleteChat = async (req: Request, res: Response) => {
  const chatId = req.params.chatId;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  try {
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    const providedHash = CryptoJS.SHA256(password).toString();
    if (providedHash !== chat.passwordHash) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    await Chat.deleteOne({ chatId });
    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
