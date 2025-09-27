import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../lib/mongodb';
import { User } from '../../../../models/User';
import { hashPassword } from '../../../../lib/password';
import { signJWT } from '../../../../lib/jwt';
import { registerSchema } from '../../../../lib/validations';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../../lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          validationResult.error.issues[0].message,
          'Validation failed'
        ),
        { status: 400 }
      );
    }

    // Validate input
    const { name, email, password, avatar } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        createErrorResponse('User with this email already exists', 'Registration failed'),
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: avatar || '😀', // Default avatar if not provided
    });

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
        'Registration successful'
      ),
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}