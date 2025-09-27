import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../lib/mongodb';
import { User } from '../../../../models/User';
import { verifyPassword } from '../../../../lib/password';
import { signJWT } from '../../../../lib/jwt';
import { loginSchema } from '../../../../lib/validations';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          validationResult.error.issues[0].message,
          'Validation failed'
        ),
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Invalid email or password', 'Authentication failed'),
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        createErrorResponse('Invalid email or password', 'Authentication failed'),
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signJWT({
      userId: user._id.toString(),
      email: user.email,
    });

    // Set HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    // Return user data (without password)
    const userData = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };

    return NextResponse.json(
      createSuccessResponse(
        { user: userData, token },
        'Login successful'
      ),
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}