import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import { Wallet } from '../../../../../models/Wallet';
import { WalletEntry } from '../../../../../models/WalletEntry';
import { WalletAccess } from '../../../../../models/WalletAccess';
import { getAuthenticatedUser } from '../../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../../lib/api-response';

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
    const { searchParams } = new URL(request.url);
    const lastUpdate = searchParams.get('lastUpdate');
    const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : new Date(0);

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

    // Get recent entries
    const recentEntries = await WalletEntry.find({
      walletId: walletId,
      createdAt: { $gt: lastUpdateDate }
    }).sort({ createdAt: -1 }).lean();

    // Check if wallet itself was updated
    const walletUpdated = wallet.updatedAt > lastUpdateDate;

    // Format entries
    const entriesData = recentEntries.map((entry: any) => ({
      _id: entry._id.toString(),
      amount: entry.amount,
      type: entry.type,
      description: entry.description || '',
      walletId: entry.walletId.toString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }));

    // Format wallet data if updated
    let walletData = null;
    if (walletUpdated) {
      walletData = {
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
    }

    return NextResponse.json(
      createSuccessResponse({
        wallet: walletData,
        entries: entriesData,
        lastUpdate: new Date().toISOString(),
        hasUpdates: entriesData.length > 0 || walletUpdated
      }, 'Wallet entry updates retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Fetch wallet entry updates error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}