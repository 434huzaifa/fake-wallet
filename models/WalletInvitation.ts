import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletInvitation extends Document {
  walletId: string;
  invitedUserId: string;
  invitedByUserId: string;
  role: 'viewer' | 'partner';
  status: 'pending' | 'accepted' | 'declined';
  invitedUserEmail: string;
  invitedUserName: string;
  invitedByUserName: string;
  walletName: string;
  walletIcon: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletInvitationSchema = new Schema<IWalletInvitation>(
  {
    walletId: {
      type: String,
      required: true,
      ref: 'Wallet'
    },
    invitedUserId: {
      type: String,
      required: true,
      ref: 'User'
    },
    invitedByUserId: {
      type: String,
      required: true,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'partner'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      required: true
    },
    invitedUserEmail: {
      type: String,
      required: true
    },
    invitedUserName: {
      type: String,
      required: true
    },
    invitedByUserName: {
      type: String,
      required: true
    },
    walletName: {
      type: String,
      required: true
    },
    walletIcon: {
      type: String,
      default: '💰'
    }
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
walletInvitationSchema.index({ invitedUserId: 1, status: 1 });
walletInvitationSchema.index({ invitedByUserId: 1 });

// Prevent duplicate pending invitations for the same wallet and user
walletInvitationSchema.index(
  { walletId: 1, invitedUserId: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

export const WalletInvitation = mongoose.models.WalletInvitation || 
  mongoose.model<IWalletInvitation>('WalletInvitation', walletInvitationSchema);