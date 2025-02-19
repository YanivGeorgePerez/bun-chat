/**
 * wsHandler.ts
 * Sets up the WebSocket server for Snugchat.
 * 
 * NOTES:
 * - Verifies incoming connections (chatId, password, username).
 * - Adds control message handling for ping/pong.
 * - Broadcasts user count status.
 * - Wraps message processing in try/catch for improved error handling.
 */

import { WebSocketServer } from 'ws';
import { Request } from 'express';
import Chat from './models/Chat';
import CryptoJS from 'crypto-js';

interface ExtendedWebSocket extends WebSocket {
  chatId?: string;
  username?: string;
  password?: string;
}

export function setupWebSocketServer(server: any, path: string = '/ws') {
  const wss = new WebSocketServer({ server, path });

  // Helper: Broadcast status (user count) to all clients in a chat room.
  function broadcastStatus(chatId: string) {
    const count = Array.from(wss.clients).filter(client => {
      const cws = client as ExtendedWebSocket;
      return cws.chatId === chatId && cws.readyState === cws.OPEN;
    }).length;
    const statusMessage = { type: "status", userCount: count };
    wss.clients.forEach(client => {
      const cws = client as ExtendedWebSocket;
      if (cws.readyState === cws.OPEN && cws.chatId === chatId) {
        cws.send(JSON.stringify(statusMessage));
      }
    });
  }

  wss.on('connection', async (ws: ExtendedWebSocket, req: Request) => {
    const params = new URLSearchParams(req.url?.split('?')[1]);
    const chatId = params.get('chatId');
    const password = params.get('password');
    const username = params.get('username');

    if (!chatId || !password || !username) {
      ws.send(JSON.stringify({ type: "error", message: "Missing credentials." }));
      ws.close();
      return;
    }

    // Look up the chat in MongoDB
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      ws.send(JSON.stringify({ type: "error", message: "Chat not found." }));
      ws.close();
      return;
    }

    // Verify password using SHA256
    const providedHash = CryptoJS.SHA256(password).toString();
    if (providedHash !== chat.passwordHash) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid password for this chat." }));
      ws.close();
      return;
    }

    // Store connection details
    ws.chatId = chatId;
    ws.username = username;
    ws.password = password;

    console.log(`${username} joined chat ${chatId}`);

    // Send existing (encrypted) chat history
    ws.send(JSON.stringify({ type: "history", data: chat.messages }));

    // Broadcast a "joined" system message (encrypted)
    const joinMsgPlain = `${username} joined the chat`;
    const encryptedJoinMsg = CryptoJS.AES.encrypt(joinMsgPlain, password).toString();
    const joinMessage = { user: "System", text: encryptedJoinMsg, timestamp: new Date().toISOString() };

    chat.messages.push(joinMessage);
    await chat.save();

    wss.clients.forEach(client => {
      const clientWs = client as ExtendedWebSocket;
      if (clientWs.readyState === clientWs.OPEN && clientWs.chatId === chatId) {
        clientWs.send(JSON.stringify({ type: "message", data: joinMessage }));
      }
    });

    // Broadcast initial status
    broadcastStatus(chatId);

    ws.on('message', async (message: any) => {
      try {
        const messageStr = message.toString();

        // If message is a ping, respond with a pong control message
        if (messageStr === "PING") {
          ws.send(JSON.stringify({ type: "control", subtype: "pong", timestamp: new Date().getTime() }));
          return;
        }

        // Process as a normal chat message
        const encryptedText = CryptoJS.AES.encrypt(messageStr, password).toString();
        const chatMessage = { user: username, text: encryptedText, timestamp: new Date().toISOString() };

        chat.messages.push(chatMessage);
        await chat.save();

        // Broadcast the encrypted message to all clients in this chat room
        wss.clients.forEach(client => {
          const clientWs = client as ExtendedWebSocket;
          if (clientWs.readyState === clientWs.OPEN && clientWs.chatId === chatId) {
            clientWs.send(JSON.stringify({ type: "message", data: chatMessage }));
          }
        });
      } catch (err) {
        console.error("Error processing message:", err);
        ws.send(JSON.stringify({ type: "error", message: "Error processing your message." }));
      }
    });

    ws.on('close', async () => {
      console.log(`${username} left chat ${chatId}`);
      const leaveMsgPlain = `${username} left the chat`;
      const encryptedLeaveMsg = CryptoJS.AES.encrypt(leaveMsgPlain, password).toString();
      const leaveMessage = { user: "System", text: encryptedLeaveMsg, timestamp: new Date().toISOString() };

      chat.messages.push(leaveMessage);
      await chat.save();

      wss.clients.forEach(client => {
        const clientWs = client as ExtendedWebSocket;
        if (clientWs.readyState === clientWs.OPEN && clientWs.chatId === chatId) {
          clientWs.send(JSON.stringify({ type: "message", data: leaveMessage }));
        }
      });

      // Broadcast updated status
      broadcastStatus(chatId);
    });
  });
}
