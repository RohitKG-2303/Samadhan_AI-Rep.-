import { Schema } from 'mongoose';

export const ConversationSchema = new Schema({
  userId: Number,
  projectId: String,
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      sources: [Schema.Types.Mixed],
      timestamp: { type: Date, default: Date.now },
    },
  ],
  startedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
