import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import { Tag } from '../../../models/Tag';
import { getAuthenticatedUser } from '../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../../../lib/api-response';

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

    // Fetch all tags
    const tags = await Tag.find({}).sort({ title: 1 }).lean();

    // Convert to plain objects with string IDs
    const tagsData = tags.map((tag: any) => ({
      _id: tag._id.toString(),
      title: tag.title,
      emoji: tag.emoji,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      createSuccessResponse(tagsData, 'Tags retrieved successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Fetch tags error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}