import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import { Wallet } from '../../../models/Wallet';
import { WalletAccess } from '../../../models/WalletAccess';
import { requireAuth } from '../../../lib/auth-middleware';
import { createSuccessResponse, handleApiError } from '../../../lib/api-response';
import { createWalletSchema } from '../../../lib/validations';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    // Fetch wallets owned by the user
    const ownedWallets = await Wallet.find({ createdBy: user.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch wallets shared with the user
    const sharedAccess = await WalletAccess.find({ userId: user.userId })
      .populate('walletId')
      .sort({ createdAt: -1 })
      .lean();

    // Process owned wallets
    const ownedWalletsData = ownedWallets.map((wallet: any) => ({
      _id: wallet._id.toString(),
      name: wallet.name,
      icon: wallet.icon || '💰',
      backgroundColor: wallet.backgroundColor || '#3B82F6',
      balance: wallet.balance,
      userId: wallet.userId?.toString() || wallet.createdBy?.toString(),
      createdBy: wallet.createdBy?.toString() || wallet.userId?.toString(),
      userRole: 'owner' as const,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    }));

    // Process shared wallets
    const sharedWalletsData = sharedAccess
      .filter((access: any) => access.walletId) // Filter out null populated wallets
      .map((access: any) => {
        const wallet = access.walletId;
        return {
          _id: wallet._id.toString(),
          name: wallet.name,
          icon: wallet.icon || '💰',
          backgroundColor: wallet.backgroundColor || '#3B82F6',
          balance: wallet.balance,
          userId: wallet.userId?.toString() || wallet.createdBy?.toString(),
          createdBy: wallet.createdBy?.toString() || wallet.userId?.toString(),
          userRole: access.role as 'viewer' | 'partner',
          createdAt: wallet.createdAt.toISOString(),
          updatedAt: wallet.updatedAt.toISOString(),
        };
      });

    // Combine owned and shared wallets
    const walletsData = [...ownedWalletsData, ...sharedWalletsData];

    return NextResponse.json(
      createSuccessResponse(walletsData, 'Wallets retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Fetch wallets error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await dbConnect();

    const body = await request.json();
    
    // Validate input using Zod
    const validation = createWalletSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { isSuccess: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, icon, backgroundColor } = validation.data;

    // Create new wallet
    const wallet = await Wallet.create({
      name: name.trim(),
      icon: icon.trim(),
      backgroundColor: backgroundColor.trim(),
      balance: 0,
      userId: user.userId,
      createdBy: user.userId,
    });

    const walletData = {
      _id: (wallet as any)._id.toString(),
      name: (wallet as any).name,
      icon: (wallet as any).icon,
      backgroundColor: (wallet as any).backgroundColor,
      balance: (wallet as any).balance,
      userId: (wallet as any).userId.toString(),
      createdBy: (wallet as any).createdBy.toString(),
      userRole: 'owner' as const,
      createdAt: (wallet as any).createdAt.toISOString(),
      updatedAt: (wallet as any).updatedAt.toISOString(),
    };

    return NextResponse.json(
      createSuccessResponse(walletData, 'Wallet created successfully'),
      { status: 201 }
    );

  } catch (error) {
    console.error('Create wallet error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
});