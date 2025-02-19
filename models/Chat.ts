// models/Chat.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  user: string;
  text: string;
  timestamp: Date;
}

export interface IChat extends Document {
  chatId: string;
  passwordHash: string;
  messages: IMessage[];
}

const MessageSchema: Schema = new Schema({
  user: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema: Schema = new Schema({
  chatId: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  messages: [MessageSchema]
});

export default mongoose.model<IChat>('Chat', ChatSchema);
