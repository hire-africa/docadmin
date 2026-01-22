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
    const { status, source_type } = await request.json();

    if (!status) {
      return NextResponse.json(
        { message: 'Status is required' },
        { status: 400 }
      );
    }

    if (!source_type) {
      return NextResponse.json(
        { message: 'Source type is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'active', 'ended'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    let result;
    let tableName;
    let returnFields;

    // Update the appropriate table based on source_type
    if (source_type === 'appointment') {
      tableName = 'appointments';
      returnFields = 'id, status, appointment_type';
      result = await query(
        `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING ${returnFields}`,
        [status, id]
      );
    } else if (source_type === 'text_session') {
      tableName = 'text_sessions';
      returnFields = 'id, status';
      result = await query(
        `UPDATE text_sessions SET status = $1 WHERE id = $2 RETURNING ${returnFields}`,
        [status, id]
      );
    } else if (source_type === 'call_session') {
      tableName = 'call_sessions';
      returnFields = 'id, status, call_type';
      result = await query(
        `UPDATE call_sessions SET status = $1 WHERE id = $2 RETURNING ${returnFields}`,
        [status, id]
      );
    } else {
      return NextResponse.json(
        { message: 'Invalid source type' },
        { status: 400 }
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: `${tableName === 'appointments' ? 'Appointment' : tableName === 'text_sessions' ? 'Text session' : 'Call session'} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `${tableName === 'appointments' ? 'Appointment' : tableName === 'text_sessions' ? 'Text session' : 'Call session'} status updated successfully`,
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error('Appointment status update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}






