import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get withdrawal requests from doctor_withdraws table
    const withdrawRequestsQuery = `
      SELECT 
        dw.id,
        dw.doctor_id,
        dw.amount,
        dw.currency,
        dw.payment_method,
        dw.payment_details,
        dw.status,
        dw.created_at,
        dw.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number
      FROM doctor_withdraws dw
      LEFT JOIN users u ON dw.doctor_id = u.id
      ORDER BY dw.created_at DESC
    `;

    const result = await query(withdrawRequestsQuery);

    const withdrawRequests = result.rows.map(row => ({
      id: row.id,
      doctor_id: row.doctor_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      payment_method: row.payment_method,
      payment_details: row.payment_details,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      doctor: {
        first_name: row.first_name || 'Unknown',
        last_name: row.last_name || 'Doctor',
        email: row.email || 'No email',
        phone_number: row.phone_number
      }
    }));

    return NextResponse.json({
      withdrawRequests,
      totalCount: withdrawRequests.length
    });
  } catch (error) {
    console.error('Withdraw requests fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
