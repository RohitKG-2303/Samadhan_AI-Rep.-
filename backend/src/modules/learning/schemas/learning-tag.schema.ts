import { Schema } from 'mongoose';

export const LearningTagSchema = new Schema({
  name: String,
  projectId: String,
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
