import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import { WalletEntry } from '../../../../../models/WalletEntry';
import { Wallet } from '../../../../../models/Wallet';
import { WalletAccess } from '../../../../../models/WalletAccess';
import { Tag } from '../../../../../models/Tag';
import { getAuthenticatedUser } from '../../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../../lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    // Ensure Tag model is loaded
    Tag;

    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'Please log in to access this resource'),
        { status: 401 }
      );
    }

    const walletId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        createErrorResponse('Invalid pagination parameters', 'Page must be >= 1 and limit must be between 1 and 100'),
        { status: 400 }
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

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for active entries only (not soft-deleted)
    const totalEntries = await WalletEntry.countDocuments({ 
      walletId, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });

    // Fetch active entries with pagination
    const entries = await WalletEntry.find({ 
      walletId,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    })
      .populate('tags', 'title emoji')
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch soft-deleted entries (no pagination for these)
    const deletedEntries = await WalletEntry.find({ 
      walletId,
      isDeleted: true
    })
      .populate('tags', 'title emoji')
      .sort({ deletedAt: -1 }) // Most recently deleted first
      .lean();

    // Convert active entries to plain objects with string IDs
    const entriesData = entries.map((entry: any) => ({
      _id: entry._id.toString(),
      amount: entry.amount,
      type: entry.type,
      description: entry.description || '',
      walletId: entry.walletId.toString(),
      tags: entry.tags?.map((tag: any) => ({
        _id: tag._id.toString(),
        title: tag.title,
        emoji: tag.emoji,
        createdAt: tag.createdAt?.toISOString(),
        updatedAt: tag.updatedAt?.toISOString(),
      })) || [],
      isDeleted: entry.isDeleted || false,
      deletedAt: entry.deletedAt?.toISOString(),
      deletedBy: entry.deletedBy?.toString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }));

    // Convert soft-deleted entries to plain objects
    const deletedEntriesData = deletedEntries.map((entry: any) => ({
      _id: entry._id.toString(),
      amount: entry.amount,
      type: entry.type,
      description: entry.description || '',
      walletId: entry.walletId.toString(),
      tags: entry.tags?.map((tag: any) => ({
        _id: tag._id.toString(),
        title: tag.title,
        emoji: tag.emoji,
        createdAt: tag.createdAt?.toISOString(),
        updatedAt: tag.updatedAt?.toISOString(),
      })) || [],
      isDeleted: entry.isDeleted,
      deletedAt: entry.deletedAt?.toISOString(),
      deletedBy: entry.deletedBy?.toString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalEntries / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const responseData = {
      entries: entriesData,
      deletedEntries: deletedEntriesData,
      pagination: {
        page,
        limit,
        total: totalEntries,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };

    return NextResponse.json(
      createSuccessResponse(responseData, 'Wallet entries retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Fetch wallet entries error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if user can add entries (only owners and partners)
    if (userRole === 'viewer') {
      return NextResponse.json(
        createErrorResponse('Permission denied', 'Viewers cannot add entries to this wallet'),
        { status: 403 }
      );
    }

    // Create the entry
    const entry = await WalletEntry.create({
      amount,
      type,
      description: description?.trim() || '',
      walletId,
      tags: tags || [],
    });

    // Update wallet balance
    const balanceChange = type === 'add' ? amount : -amount;
    const updatedWallet = await Wallet.findByIdAndUpdate(
      walletId,
      { $inc: { balance: balanceChange } },
      { new: true }
    );

    // Populate tags for the created entry
    const populatedEntry = await WalletEntry.findById(entry._id).populate('tags', 'title emoji').lean();

    // Convert to plain objects
    const entryData = {
      _id: (entry as any)._id.toString(),
      amount: (entry as any).amount,
      type: (entry as any).type,
      description: (entry as any).description || '',
      walletId: (entry as any).walletId.toString(),
      tags: (populatedEntry as any)?.tags?.map((tag: any) => ({
        _id: tag._id.toString(),
        title: tag.title,
        emoji: tag.emoji,
        createdAt: tag.createdAt?.toISOString(),
        updatedAt: tag.updatedAt?.toISOString(),
      })) || [],
      createdAt: (entry as any).createdAt.toISOString(),
      updatedAt: (entry as any).updatedAt.toISOString(),
    };

    const walletData = {
      _id: (updatedWallet as any)._id.toString(),
      name: (updatedWallet as any).name,
      icon: (updatedWallet as any).icon,
      backgroundColor: (updatedWallet as any).backgroundColor,
      balance: (updatedWallet as any).balance,
      userId: (updatedWallet as any).userId.toString(),
      createdBy: (updatedWallet as any).createdBy.toString(),
      userRole: userRole,
      createdAt: (updatedWallet as any).createdAt.toISOString(),
      updatedAt: (updatedWallet as any).updatedAt.toISOString(),
    };

    return NextResponse.json(
      createSuccessResponse(
        { entry: entryData, updatedWallet: walletData },
        'Entry added successfully'
      ),
      { status: 201 }
    );

  } catch (error) {
    console.error('Add wallet entry error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}