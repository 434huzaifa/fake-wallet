import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document {
  _id: string;
  name: string;
  icon: string;
  backgroundColor: string;
  balance: number;
  userId: mongoose.Types.ObjectId; // Kept for backward compatibility, same as createdBy
  createdBy: mongoose.Types.ObjectId; // The user who created this wallet
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    name: {
      type: String,
      required: [true, 'Wallet name is required'],
      trim: true,
    },
    icon: {
      type: String,
      required: [true, 'Wallet icon is required'],
      trim: true,
      maxlength: [4, 'Icon must be a single character or emoji'],
      default: '💰',
    },
    backgroundColor: {
      type: String,
      required: [true, 'Background color is required'],
      trim: true,
      default: '#3B82F6',
      validate: {
        validator: function(v: string) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Background color must be a valid hex color'
      }
    },
    balance: {
      type: Number,
      default: 0,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);