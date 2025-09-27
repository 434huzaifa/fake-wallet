import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSuccessResponse, handleApiError } from '../../../../lib/api-response';

export async function POST() {
  try {
    // Clear the auth cookie
    const cookieStore = cookies();
    cookieStore.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return NextResponse.json(
      createSuccessResponse(null, 'Logout successful'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}