import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  title: string;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    title: {
      type: String,
      required: [true, 'Tag title is required'],
      trim: true,
      maxlength: [50, 'Tag title cannot exceed 50 characters'],
      unique: true,
    },
    emoji: {
      type: String,
      required: [true, 'Tag emoji is required'],
      maxlength: [4, 'Emoji cannot exceed 4 characters'],
    },
  },
  {
    timestamps: true,
  }
);

export const Tag = mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);
export default Tag;