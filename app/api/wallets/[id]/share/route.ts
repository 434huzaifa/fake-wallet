import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import { User } from '../../../../../models/User';
import { Wallet } from '../../../../../models/Wallet';
import { WalletAccess } from '../../../../../models/WalletAccess';
import { WalletInvitation } from '../../../../../models/WalletInvitation';
import { getAuthenticatedUser } from '../../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../../lib/api-response';
import { z } from 'zod';

const shareWalletSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['viewer', 'partner'], {
    message: 'Role must be either viewer or partner'
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

    const walletId = params.id;
    const body = await request.json();

    // Validate input
    const validation = shareWalletSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', validation.error.issues[0].message),
        { status: 400 }
      );
    }

    const { email, role } = validation.data;

    // Verify wallet exists and user is the owner
    const wallet = await Wallet.findOne({
      _id: walletId,
      createdBy: user.userId
    });

    if (!wallet) {
      return NextResponse.json(
        createErrorResponse('Wallet not found', 'The requested wallet does not exist or you do not have permission to share it'),
        { status: 404 }
      );
    }

    // Find the user to share with
    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      return NextResponse.json(
        createErrorResponse('User not found', 'No user found with the provided email address'),
        { status: 404 }
      );
    }

    // Check if user is trying to share with themselves
    if (targetUser._id.toString() === user.userId) {
      return NextResponse.json(
        createErrorResponse('Invalid operation', 'You cannot share a wallet with yourself'),
        { status: 400 }
      );
    }

    // Check if access already exists
    const existingAccess = await WalletAccess.findOne({
      walletId: walletId,
      userId: targetUser._id.toString()
    });

    if (existingAccess) {
      return NextResponse.json(
        createErrorResponse('Access already exists', 'This user already has access to this wallet'),
        { status: 409 }
      );
    }

    // Check if invitation already exists
    const existingInvitation = await WalletInvitation.findOne({
      walletId: walletId,
      invitedUserId: targetUser._id.toString(),
      status: 'pending'
    });

    if (existingInvitation) {
      return NextResponse.json(
        createErrorResponse('Invitation already sent', 'An invitation to this wallet has already been sent to this user'),
        { status: 409 }
      );
    }

    // Get the inviting user's details
    const invitingUser = await User.findById(user.userId);
    if (!invitingUser) {
      return NextResponse.json(
        createErrorResponse('User not found', 'Inviting user not found'),
        { status: 404 }
      );
    }

    // Create wallet invitation record
    const walletInvitation = await WalletInvitation.create({
      walletId: walletId,
      invitedUserId: targetUser._id.toString(),
      invitedByUserId: user.userId,
      role: role,
      status: 'pending',
      invitedUserEmail: targetUser.email,
      invitedUserName: targetUser.name,
      invitedByUserName: invitingUser.name,
      walletName: wallet.name,
      walletIcon: wallet.icon || '💰'
    });

    const invitationData = {
      _id: (walletInvitation as any)._id.toString(),
      walletId: walletId,
      invitedUserId: targetUser._id.toString(),
      invitedByUserId: user.userId,
      role: role,
      status: 'pending',
      invitedUserEmail: targetUser.email,
      invitedUserName: targetUser.name,
      invitedByUserName: invitingUser.name,
      walletName: wallet.name,
      walletIcon: wallet.icon || '💰',
      createdAt: (walletInvitation as any).createdAt.toISOString(),
      updatedAt: (walletInvitation as any).updatedAt.toISOString(),
    };

    return NextResponse.json(
      createSuccessResponse(
        invitationData,
        `Invitation sent successfully to ${targetUser.name} (${targetUser.email}) for ${role} access`
      ),
      { status: 201 }
    );

  } catch (error) {
    console.error('Share wallet error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}