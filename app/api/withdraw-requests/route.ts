import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get withdrawal requests with doctor information
    const withdrawRequestsQuery = `
      SELECT 
        wr.id,
        wr.doctor_id,
        wr.amount,
        wr.currency,
        wr.payment_method,
        wr.payment_details,
        wr.status,
        wr.created_at,
        wr.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number
      FROM withdrawal_requests wr
      LEFT JOIN users u ON wr.doctor_id = u.id
      ORDER BY wr.created_at DESC
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
