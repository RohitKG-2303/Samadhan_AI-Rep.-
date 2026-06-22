import { Schema } from 'mongoose';

export const LearningSchema = new Schema({
  userId: Number,
  title: String,
  formattedContent: String,
  projectId: String,
  category: String,
  tags: [String],
  issue: String,
  solution: String,
  keyTakeaways: [String],
  embeddings: [Number],
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
