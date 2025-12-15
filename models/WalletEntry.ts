import mongoose, { Document, Schema } from 'mongoose';

export type EntryType = 'add' | 'subtract';

export interface IWalletEntry extends Document {
  amount: number;
  type: EntryType;
  description?: string;
  walletId: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WalletEntrySchema = new Schema<IWalletEntry>(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['add', 'subtract'],
      required: [true, 'Entry type is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet ID is required'],
    },
    tags: [{
      type: Schema.Types.ObjectId,
      ref: 'Tag',
    }],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const WalletEntry = mongoose.models.WalletEntry || mongoose.model<IWalletEntry>('WalletEntry', WalletEntrySchema);