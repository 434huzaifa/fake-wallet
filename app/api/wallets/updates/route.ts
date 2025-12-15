import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import { Wallet } from '../../../../models/Wallet';
import { WalletAccess } from '../../../../models/WalletAccess';
import { getAuthenticatedUser } from '../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const lastUpdate = searchParams.get('lastUpdate');
    const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : new Date(0);

    // Get owned wallets with recent updates
    const ownedWallets = await Wallet.find({
      createdBy: user.userId,
      updatedAt: { $gt: lastUpdateDate }
    }).select('_id name icon backgroundColor balance userId createdBy updatedAt createdAt').lean();

    // Get shared wallets with recent updates
    const walletAccesses = await WalletAccess.find({
      userId: user.userId
    }).select('walletId role grantedBy').lean();

    const sharedWalletIds = walletAccesses.map((access: any) => access.walletId);
    const sharedWallets = await Wallet.find({
      _id: { $in: sharedWalletIds },
      updatedAt: { $gt: lastUpdateDate }
    }).select('_id name icon backgroundColor balance userId createdBy updatedAt createdAt').lean();

    // Add role information to shared wallets
    const sharedWalletsWithRole = sharedWallets.map((wallet: any) => {
      const access = walletAccesses.find((acc: any) => acc.walletId === wallet._id.toString());
      return {
        ...wallet,
        userRole: access?.role || 'viewer'
      };
    });

    // Add owner role to owned wallets
    const ownedWalletsWithRole = ownedWallets.map((wallet: any) => ({
      ...wallet,
      userRole: 'owner' as const
    }));

    // Combine all updated wallets
    const updatedWallets = [...ownedWalletsWithRole, ...sharedWalletsWithRole];

    // Format the response
    const walletsData = updatedWallets.map((wallet: any) => ({
      _id: wallet._id.toString(),
      name: wallet.name,
      icon: wallet.icon || '💰',
      backgroundColor: wallet.backgroundColor || '#3B82F6',
      balance: wallet.balance,
      userId: wallet.userId?.toString() || wallet.createdBy?.toString(),
      createdBy: wallet.createdBy?.toString() || wallet.userId?.toString(),
      userRole: wallet.userRole,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      createSuccessResponse({
        wallets: walletsData,
        lastUpdate: new Date().toISOString(),
        hasUpdates: walletsData.length > 0
      }, 'Wallet updates retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Fetch wallet updates error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}