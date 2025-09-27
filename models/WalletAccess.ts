import mongoose, { Document, Schema } from 'mongoose';

export interface IWalletAccess extends Document {
  _id: string;
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'viewer' | 'partner';
  grantedBy: mongoose.Types.ObjectId;
  grantedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WalletAccessSchema = new Schema<IWalletAccess>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    role: {
      type: String,
      enum: ['viewer', 'partner'],
      required: [true, 'Role is required'],
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Granted by user ID is required'],
    },
    grantedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to prevent duplicate access for same user-wallet pair
WalletAccessSchema.index({ walletId: 1, userId: 1 }, { unique: true });

// Create index for faster queries
WalletAccessSchema.index({ userId: 1 });
WalletAccessSchema.index({ walletId: 1 });

export const WalletAccess = mongoose.models.WalletAccess || mongoose.model<IWalletAccess>('WalletAccess', WalletAccessSchema);