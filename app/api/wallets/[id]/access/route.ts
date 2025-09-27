import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';

import { Wallet } from '../../../../../models/Wallet';
import { WalletAccess } from '../../../../../models/WalletAccess';
import { getAuthenticatedUser } from '../../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../../lib/api-response';

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

    // Verify wallet exists and user is the owner
    const wallet = await Wallet.findOne({
      _id: walletId,
      createdBy: user.userId
    });

    if (!wallet) {
      return NextResponse.json(
        createErrorResponse('Wallet not found', 'The requested wallet does not exist or you do not have permission to view its access list'),
        { status: 404 }
      );
    }

    // Get all wallet access records with user details
    const walletAccesses = await WalletAccess.aggregate([
      {
        $match: { walletId: walletId }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          walletId: 1,
          userId: 1,
          role: 1,
          grantedBy: 1,
          createdAt: 1,
          updatedAt: 1,
          'user.name': 1,
          'user.email': 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Format the response
    const accessData = walletAccesses.map((access: any) => ({
      _id: access._id.toString(),
      walletId: access.walletId,
      userId: access.userId,
      role: access.role,
      grantedBy: access.grantedBy,
      userName: access.user.name,
      userEmail: access.user.email,
      createdAt: access.createdAt.toISOString(),
      updatedAt: access.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      createSuccessResponse(accessData, 'Wallet access list retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Fetch wallet access error:', error);
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
    const { searchParams } = new URL(request.url);
    const accessUserId = searchParams.get('userId');

    if (!accessUserId) {
      return NextResponse.json(
        createErrorResponse('Missing parameter', 'User ID is required to revoke access'),
        { status: 400 }
      );
    }

    // Verify wallet exists and user is the owner
    const wallet = await Wallet.findOne({
      _id: walletId,
      createdBy: user.userId
    });

    if (!wallet) {
      return NextResponse.json(
        createErrorResponse('Wallet not found', 'The requested wallet does not exist or you do not have permission to manage its access'),
        { status: 404 }
      );
    }

    // Find and delete the access record
    const deletedAccess = await WalletAccess.findOneAndDelete({
      walletId: walletId,
      userId: accessUserId
    });

    if (!deletedAccess) {
      return NextResponse.json(
        createErrorResponse('Access not found', 'The specified user does not have access to this wallet'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(null, 'Wallet access revoked successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Revoke wallet access error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}