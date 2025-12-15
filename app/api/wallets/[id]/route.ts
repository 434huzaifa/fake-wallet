import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import { Wallet } from '../../../../models/Wallet';
import { WalletEntry } from '../../../../models/WalletEntry';
import { WalletAccess } from '../../../../models/WalletAccess';
import { getAuthenticatedUser } from '../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // First check if user owns the wallet
    let wallet = await Wallet.findOne({ 
      _id: walletId, 
      createdBy: user.userId 
    }).lean();

    let userRole: 'owner' | 'viewer' | 'partner' = 'owner';

    // If not owner, check if user has shared access
    if (!wallet) {
      const walletAccess = await WalletAccess.findOne({
        walletId: walletId,
        userId: user.userId
      }).lean();

      if (!walletAccess) {
        return NextResponse.json(
          createErrorResponse('Wallet not found', 'The requested wallet does not exist or you do not have access to it'),
          { status: 404 }
        );
      }

      // Get the wallet if user has access
      wallet = await Wallet.findById(walletId).lean();
      if (!wallet) {
        return NextResponse.json(
          createErrorResponse('Wallet not found', 'The requested wallet does not exist'),
          { status: 404 }
        );
      }

      userRole = (walletAccess as any).role;
    }

    // Convert to plain object with string IDs
    const walletData = {
      _id: (wallet as any)._id.toString(),
      name: (wallet as any).name,
      icon: (wallet as any).icon || '💰',
      backgroundColor: (wallet as any).backgroundColor || '#3B82F6',
      balance: (wallet as any).balance,
      userId: (wallet as any).userId?.toString() || (wallet as any).createdBy?.toString(),
      createdBy: (wallet as any).createdBy?.toString() || (wallet as any).userId?.toString(),
      userRole: userRole,
      createdAt: (wallet as any).createdAt.toISOString(),
      updatedAt: (wallet as any).updatedAt.toISOString(),
    };

    return NextResponse.json(
      createSuccessResponse(walletData, 'Wallet retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Fetch wallet error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Find wallet and ensure user is the owner (only owners can delete wallets)
    const wallet = await Wallet.findOne({ 
      _id: walletId, 
      createdBy: user.userId 
    });

    if (!wallet) {
      return NextResponse.json(
        createErrorResponse('Wallet not found', 'The requested wallet does not exist or you do not have permission to delete it. Only wallet creators can delete wallets.'),
        { status: 404 }
      );
    }

    // Start a transaction to ensure both wallet and entries are deleted together
    // First delete all wallet entries
    await WalletEntry.deleteMany({ walletId: walletId });
    
    // Delete all wallet access records
    await WalletAccess.deleteMany({ walletId: walletId });
    
    // Then delete the wallet
    await Wallet.findByIdAndDelete(walletId);

    return NextResponse.json(
      createSuccessResponse(null, 'Wallet and all associated entries deleted successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete wallet error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}