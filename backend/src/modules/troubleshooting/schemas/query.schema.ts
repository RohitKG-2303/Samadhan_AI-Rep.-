import { Schema } from 'mongoose';

export const QuerySchema = new Schema({
  userId: Number,
  projectId: String,
  question: String,
  answer: String,
  sources: [Schema.Types.Mixed],
  conversationId: String,
  userRating: { type: Number, default: 0 },
  isFeedbackGiven: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
