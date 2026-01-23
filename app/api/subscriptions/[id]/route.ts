import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { 
      text_sessions_remaining, 
      voice_calls_remaining, 
      video_calls_remaining, 
      appointments_remaining 
    } = body;

    // Build update fields
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (text_sessions_remaining !== undefined) {
      paramCount++;
      updateFields.push(`text_sessions_remaining = $${paramCount}`);
      updateValues.push(text_sessions_remaining);
    }

    if (voice_calls_remaining !== undefined) {
      paramCount++;
      updateFields.push(`voice_calls_remaining = $${paramCount}`);
      updateValues.push(voice_calls_remaining);
    }

    if (video_calls_remaining !== undefined) {
      paramCount++;
      updateFields.push(`video_calls_remaining = $${paramCount}`);
      updateValues.push(video_calls_remaining);
    }

    if (appointments_remaining !== undefined) {
      paramCount++;
      updateFields.push(`appointments_remaining = $${paramCount}`);
      updateValues.push(appointments_remaining);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400 }
      );
    }

    // Validate that all values are numbers
    const allValues = [
      text_sessions_remaining,
      voice_calls_remaining,
      video_calls_remaining,
      appointments_remaining
    ].filter(v => v !== undefined);

    if (allValues.some(v => typeof v !== 'number' || v < 0 || !Number.isInteger(v))) {
      return NextResponse.json(
        { message: 'All remaining counts must be non-negative integers' },
        { status: 400 }
      );
    }

    paramCount++;
    updateValues.push(id);

    const updateQuery = `
      UPDATE subscriptions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, 
        text_sessions_remaining, 
        voice_calls_remaining, 
        video_calls_remaining, 
        appointments_remaining,
        plan_name
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription: result.rows[0],
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
