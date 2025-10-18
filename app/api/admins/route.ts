import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all admin users
    const adminsQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        email
      FROM users
      WHERE user_type = 'admin' OR role = 'admin'
      ORDER BY first_name, last_name
    `;

    const result = await query(adminsQuery);

    const admins = result.rows.map(row => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      full_name: `${row.first_name} ${row.last_name}`
    }));

    return NextResponse.json({
      admins,
      totalCount: admins.length
    });
  } catch (error) {
    console.error('Admins fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
