import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import { WalletInvitation } from '../../../../models/WalletInvitation';
import { WalletAccess } from '../../../../models/WalletAccess';
import { getAuthenticatedUser } from '../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../lib/api-response';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const respondInvitationSchema = z.object({
  action: z.enum(['accept', 'decline'], {
    message: 'Action must be either accept or decline'
  })
});

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

    const invitationId = params.id;
    const body = await request.json();

    // Validate input
    const validation = respondInvitationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', validation.error.issues[0].message),
        { status: 400 }
      );
    }

    const { action } = validation.data;

    // Find the invitation
    const invitation = await WalletInvitation.findOne({
      _id: invitationId,
      invitedUserId: user.userId,
      status: 'pending'
    });

    if (!invitation) {
      return NextResponse.json(
        createErrorResponse('Invitation not found', 'The requested invitation does not exist or has already been responded to'),
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // Create wallet access record
      const walletAccess = await WalletAccess.create({
        walletId: invitation.walletId,
        userId: user.userId,
        role: invitation.role,
        grantedBy: invitation.invitedByUserId
      });

      // Update invitation status
      invitation.status = 'accepted';
      await invitation.save();

      const accessData = {
        _id: (walletAccess as any)._id.toString(),
        walletId: invitation.walletId,
        userId: user.userId,
        role: invitation.role,
        grantedBy: invitation.invitedByUserId,
        createdAt: (walletAccess as any).createdAt.toISOString(),
        updatedAt: (walletAccess as any).updatedAt.toISOString(),
      };

      return NextResponse.json(
        createSuccessResponse(
          { invitation: invitation.toObject(), access: accessData },
          `Invitation accepted! You now have ${invitation.role} access to ${invitation.walletName}`
        ),
        { status: 200 }
      );
    } else {
      // Decline invitation
      invitation.status = 'declined';
      await invitation.save();

      return NextResponse.json(
        createSuccessResponse(
          invitation.toObject(),
          `Invitation to ${invitation.walletName} has been declined`
        ),
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Respond to invitation error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}