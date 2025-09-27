import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '../../../../lib/api-response';
import dbConnect from '../../../../lib/mongodb';
import { User } from '../../../../models/User';

export async function GET(_request: NextRequest) {
  try {
    await dbConnect();
    
    const authUser = await getAuthenticatedUser();
    
    if (!authUser) {
      return NextResponse.json(
        createErrorResponse('Not authenticated', 'Please log in to access this resource'),
        { status: 401 }
      );
    }

    // Fetch full user data from database
    const user = await User.findById(authUser.userId).select('-password').lean();
    
    if (!user) {
      // Clear authentication cookies if user no longer exists
      const response = NextResponse.json(
        createErrorResponse('User not found', 'User account no longer exists'),
        { status: 404 }
      );
      
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0), // Expire immediately
        path: '/',
      });
      
      return response;
    }

    const userData = user as any; // Type assertion to handle Mongoose lean() typing

    return NextResponse.json(
      createSuccessResponse({
        _id: userData._id.toString(),
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
      }, 'User information retrieved successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      createErrorResponse('Server error', 'An error occurred while retrieving user information'),
      { status: 500 }
    );
  }
}