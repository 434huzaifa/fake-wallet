import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../../lib/mongodb';
import { WalletEntry } from '../../../../../../../models/WalletEntry';
import { Wallet } from '../../../../../../../models/Wallet';
import { WalletAccess } from '../../../../../../../models/WalletAccess';
import Tag from '../../../../../../../models/Tag';
import { getAuthenticatedUser } from '../../../../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../../../../lib/api-response';

export const dynamic = 'force-dynamic';

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

    // Check if the entry exists and is soft-deleted
    const existingEntry = await WalletEntry.findOne({ 
      _id: entryId, 
      walletId: walletId,
      isDeleted: true
    });

    if (!existingEntry) {
      return NextResponse.json(
        createErrorResponse('Entry not found', 'The requested entry does not exist or is not in the deleted state'),
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

    // Check if user can permanently delete entries (only owners and partners)
    if (userRole === 'viewer') {
      return NextResponse.json(
        createErrorResponse('Permission denied', 'Viewers cannot permanently delete entries in this wallet'),
        { status: 403 }
      );
    }

    // Permanently delete the entry
    const deletedEntry = await WalletEntry.findByIdAndDelete(entryId);

    if (!deletedEntry) {
      return NextResponse.json(
        createErrorResponse('Delete failed', 'Failed to permanently delete the entry'),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(
        { entryId: entryId },
        'Entry permanently deleted successfully'
      ),
      { status: 200 }
    );

  } catch (error) {
    console.error('Permanent delete wallet entry error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}