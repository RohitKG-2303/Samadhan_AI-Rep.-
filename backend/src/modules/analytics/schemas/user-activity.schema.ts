import { Schema } from 'mongoose';

export const UserActivitySchema = new Schema({
  userId: Number,
  action: String,
  metadata: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});
