import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '../../../../lib/api-response';
import dbConnect from '../../../../lib/mongodb';
import { User } from '../../../../models/User';
import { Wallet } from '../../../../models/Wallet';
import { WalletEntry } from '../../../../models/WalletEntry';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  avatar: z.string().max(4, 'Avatar must be a single emoji or character').optional(),
});

// Update profile
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        createErrorResponse('Not authenticated', 'Please log in to access this resource'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, avatar } = updateProfileSchema.parse(body);

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      authUser.userId,
      { 
        name, 
        avatar: avatar || '😀' 
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json(
        createErrorResponse('User not found', 'User account no longer exists'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        _id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      }, 'Profile updated successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse('Validation error', error.errors[0]?.message || 'Invalid input'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Server error', 'An error occurred while updating profile'),
      { status: 500 }
    );
  }
}

// Delete profile and all associated data
export async function DELETE(_request: NextRequest) {
  try {
    await dbConnect();
    
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        createErrorResponse('Not authenticated', 'Please log in to access this resource'),
        { status: 401 }
      );
    }

    // Start transaction-like deletion (MongoDB doesn't have true transactions in all setups)
    
    // Find all user's wallets
    const userWallets = await Wallet.find({ userId: authUser.userId });
    const walletIds = userWallets.map(wallet => wallet._id);

    // Delete all wallet entries for user's wallets
    if (walletIds.length > 0) {
      await WalletEntry.deleteMany({ walletId: { $in: walletIds } });
    }

    // Delete all user's wallets
    await Wallet.deleteMany({ userId: authUser.userId });

    // Delete user account
    const deletedUser = await User.findByIdAndDelete(authUser.userId);

    if (!deletedUser) {
      return NextResponse.json(
        createErrorResponse('User not found', 'User account no longer exists'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(
        null, 
        'Account and all associated data deleted successfully'
      ),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete profile error:', error);
    
    return NextResponse.json(
      createErrorResponse('Server error', 'An error occurred while deleting account'),
      { status: 500 }
    );
  }
}