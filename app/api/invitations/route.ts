import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import { WalletInvitation } from '../../../models/WalletInvitation';
import { getAuthenticatedUser } from '../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../lib/api-response';

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
    const status = searchParams.get('status') || 'pending';

    // Validate status parameter
    if (!['pending', 'accepted', 'declined', 'all'].includes(status)) {
      return NextResponse.json(
        createErrorResponse('Invalid status', 'Status must be pending, accepted, declined, or all'),
        { status: 400 }
      );
    }

    // Build query based on status
    const query: any = { invitedUserId: user.userId };
    if (status !== 'all') {
      query.status = status;
    }

    // Get invitations for the user
    const invitations = await WalletInvitation.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Format the response
    const invitationsData = invitations.map((invitation: any) => ({
      _id: invitation._id.toString(),
      walletId: invitation.walletId,
      invitedUserId: invitation.invitedUserId,
      invitedByUserId: invitation.invitedByUserId,
      role: invitation.role,
      status: invitation.status,
      invitedUserEmail: invitation.invitedUserEmail,
      invitedUserName: invitation.invitedUserName,
      invitedByUserName: invitation.invitedByUserName,
      walletName: invitation.walletName,
      walletIcon: invitation.walletIcon,
      createdAt: invitation.createdAt.toISOString(),
      updatedAt: invitation.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      createSuccessResponse(invitationsData, 'Invitations retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Fetch invitations error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}