import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import { WalletEntry } from '../../../../../../models/WalletEntry';
import { Wallet } from '../../../../../../models/Wallet';
import { WalletAccess } from '../../../../../../models/WalletAccess';
import { getAuthenticatedUser } from '../../../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../../../lib/api-response';

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    await dbConnect();

    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Please log in to access this resource'),
        { status: 401 }
      );
    }

    const walletId = params.id;
    const entryId = params.entryId;
    const body = await request.json();

    // Validate input
    const { amount, type, description, tags } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        createErrorResponse('Invalid amount', 'Amount must be a positive number'),
        { status: 400 }
      );
    }

    if (!type || !['add', 'subtract'].includes(type)) {
      return NextResponse.json(
        createErrorResponse('Invalid type', 'Type must be either "add" or "subtract"'),
        { status: 400 }
      );
    }

    if (description && typeof description !== 'string') {
      return NextResponse.json(
        createErrorResponse('Invalid description', 'Description must be a string'),
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        createErrorResponse('Description too long', 'Description cannot exceed 500 characters'),
        { status: 400 }
      );
    }

    if (tags && (!Array.isArray(tags) || tags.length > 5)) {
      return NextResponse.json(
        createErrorResponse('Invalid tags', 'Tags must be an array with maximum 5 items'),
        { status: 400 }
      );
    }

    // Check if the entry exists and belongs to the wallet
    const existingEntry = await WalletEntry.findOne({ 
      _id: entryId, 
      walletId: walletId 
    });

    if (!existingEntry) {
      return NextResponse.json(
        createErrorResponse('Entry not found', 'The requested entry does not exist'),
        { status: 404 }
      );
    }

    // Check if user owns the wallet or has shared access
    let wallet = await Wallet.findOne({ 
      _id: walletId, 
      createdBy: user.userId 
    });

    let userRole: 'owner' | 'viewer' | 'partner' = 'owner';

    // If not owner, check shared access
    if (!wallet) {
      const walletAccess = await WalletAccess.findOne({
        walletId: walletId,
        userId: user.userId
      });

      if (!walletAccess) {
        return NextResponse.json(
          createErrorResponse('Wallet not found', 'The requested wallet does not exist or you do not have access to it'),
          { status: 404 }
        );
      }

      wallet = await Wallet.findById(walletId);
      if (!wallet) {
        return NextResponse.json(
          createErrorResponse('Wallet not found', 'The requested wallet does not exist'),
          { status: 404 }
        );
      }

      userRole = (walletAccess as any).role;
    }

    // Check if user can edit entries (only owners and partners)
    if (userRole === 'viewer') {
      return NextResponse.json(
        createErrorResponse('Permission denied', 'Viewers cannot edit entries in this wallet'),
        { status: 403 }
      );
    }

    // Calculate the balance difference if amount or type changed
    const oldBalanceChange = existingEntry.type === 'add' ? existingEntry.amount : -existingEntry.amount;
    const newBalanceChange = type === 'add' ? amount : -amount;
    const balanceDifference = newBalanceChange - oldBalanceChange;

    // Update the entry
    const updatedEntry = await WalletEntry.findByIdAndUpdate(
      entryId,
      {
        amount,
        type,
        description: description?.trim() || '',
        tags: tags || [],
      },
      { new: true }
    ).populate('tags', 'title emoji');

    if (!updatedEntry) {
      return NextResponse.json(
        createErrorResponse('Update failed', 'Failed to update the entry'),
        { status: 500 }
      );
    }

    // Update wallet balance if amount or type changed
    if (balanceDifference !== 0) {
      await Wallet.findByIdAndUpdate(
        walletId,
        { $inc: { balance: balanceDifference } }
      );
    }

    // Get updated wallet data
    const updatedWallet = await Wallet.findById(walletId);

    // Convert to plain objects
    const entryData = {
      _id: updatedEntry._id.toString(),
      amount: updatedEntry.amount,
      type: updatedEntry.type,
      description: updatedEntry.description || '',
      walletId: updatedEntry.walletId.toString(),
      tags: (updatedEntry as any)?.tags?.map((tag: any) => ({
        _id: tag._id.toString(),
        title: tag.title,
        emoji: tag.emoji,
        createdAt: tag.createdAt?.toISOString(),
        updatedAt: tag.updatedAt?.toISOString(),
      })) || [],
      createdAt: updatedEntry.createdAt.toISOString(),
      updatedAt: updatedEntry.updatedAt.toISOString(),
    };

    const walletData = updatedWallet ? {
      _id: updatedWallet._id.toString(),
      name: updatedWallet.name,
      balance: updatedWallet.balance,
      userId: updatedWallet.userId?.toString(),
      createdBy: updatedWallet.createdBy?.toString(),
      createdAt: updatedWallet.createdAt.toISOString(),
      updatedAt: updatedWallet.updatedAt.toISOString(),
    } : null;

    return NextResponse.json(
      createSuccessResponse(
        { entry: entryData, updatedWallet: walletData },
        'Entry updated successfully'
      ),
      { status: 200 }
    );

  } catch (error) {
    console.error('Update wallet entry error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    await dbConnect();

    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Please log in to access this resource'),
        { status: 401 }
      );
    }

    const walletId = params.id;
    const entryId = params.entryId;

    // Check if the entry exists and is not already soft-deleted
    const existingEntry = await WalletEntry.findOne({ 
      _id: entryId, 
      walletId: walletId,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });

    if (!existingEntry) {
      return NextResponse.json(
        createErrorResponse('Entry not found', 'The requested entry does not exist or has already been deleted'),
        { status: 404 }
      );
    }

    // Check if user owns the wallet or has shared access
    let wallet = await Wallet.findOne({ 
      _id: walletId, 
      createdBy: user.userId 
    });

    let userRole: 'owner' | 'viewer' | 'partner' = 'owner';

    // If not owner, check shared access
    if (!wallet) {
      const walletAccess = await WalletAccess.findOne({
        walletId: walletId,
        userId: user.userId
      });

      if (!walletAccess) {
        return NextResponse.json(
          createErrorResponse('Wallet not found', 'The requested wallet does not exist or you do not have access to it'),
          { status: 404 }
        );
      }

      wallet = await Wallet.findById(walletId);
      if (!wallet) {
        return NextResponse.json(
          createErrorResponse('Wallet not found', 'The requested wallet does not exist'),
          { status: 404 }
        );
      }

      userRole = (walletAccess as any).role;
    }

    // Check if user can delete entries (only owners and partners)
    if (userRole === 'viewer') {
      return NextResponse.json(
        createErrorResponse('Permission denied', 'Viewers cannot delete entries in this wallet'),
        { status: 403 }
      );
    }

    // Soft delete the entry
    const deletedEntry = await WalletEntry.findByIdAndUpdate(
      entryId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.userId,
      },
      { new: true }
    );

    if (!deletedEntry) {
      return NextResponse.json(
        createErrorResponse('Delete failed', 'Failed to delete the entry'),
        { status: 500 }
      );
    }

    // Update wallet balance (reverse the entry's effect)
    const balanceChange = existingEntry.type === 'add' ? -existingEntry.amount : existingEntry.amount;
    const updatedWallet = await Wallet.findByIdAndUpdate(
      walletId,
      { $inc: { balance: balanceChange } },
      { new: true }
    );

    // Convert to plain objects
    const entryData = {
      _id: deletedEntry._id.toString(),
      amount: deletedEntry.amount,
      type: deletedEntry.type,
      description: deletedEntry.description || '',
      walletId: deletedEntry.walletId.toString(),
      isDeleted: deletedEntry.isDeleted,
      deletedAt: deletedEntry.deletedAt?.toISOString(),
      deletedBy: deletedEntry.deletedBy?.toString(),
      createdAt: deletedEntry.createdAt.toISOString(),
      updatedAt: deletedEntry.updatedAt.toISOString(),
    };

    const walletData = updatedWallet ? {
      _id: updatedWallet._id.toString(),
      name: updatedWallet.name,
      balance: updatedWallet.balance,
      userId: updatedWallet.userId?.toString(),
      createdBy: updatedWallet.createdBy?.toString(),
      createdAt: updatedWallet.createdAt.toISOString(),
      updatedAt: updatedWallet.updatedAt.toISOString(),
    } : null;

    return NextResponse.json(
      createSuccessResponse(
        { entry: entryData, updatedWallet: walletData },
        'Entry deleted successfully'
      ),
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete wallet entry error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}