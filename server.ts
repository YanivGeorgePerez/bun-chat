/**
 * server.ts
 * Main Express server file for Snugchat.
 * 
 * NOTES:
 * - Serves the home and chat pages.
 * - Verifies chat passwords before serving the chat window.
 * - Redirects back to home with an error message if the password is invalid or the chat is not found.
 * - Sets up API routes, including chat deletion, and the WebSocket server.
 */

import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import path from 'path';
import bodyParser from 'body-parser';
import chatsRouter from './routes/chat.ts';
import { setupWebSocketServer } from './wsHandler';
import CryptoJS from 'crypto-js';
import Chat from './models/Chat';

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Homepage: Renders index.ejs and passes along any error message.
app.get('/', (req, res) => {
  const error = req.query.error || '';
  res.render('index', { error });
});

// Chat page – Verify password before rendering the chat window.
app.get('/chat/:chatId', async (req, res) => {
  const chatId = req.params.chatId;
  const chatPassword = req.query.password || '';
  try {
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.redirect('/?error=Chat%20not%20found');
    }
    const providedHash = CryptoJS.SHA256(chatPassword).toString();
    if (providedHash !== chat.passwordHash) {
      return res.redirect('/?error=Invalid%20password');
    }
    res.render('chat', { chatId, chatPassword });
  } catch (err) {
    console.error(err);
    res.redirect('/?error=Server%20error');
  }
});

// API route for chat creation and deletion
app.use('/api/chats', chatsRouter);

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/couples_chat';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Create HTTP server and attach WebSocket server
const server = http.createServer(app);
setupWebSocketServer(server, '/ws');

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
