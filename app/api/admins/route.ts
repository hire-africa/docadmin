import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all admin users from admins table
    const adminsQuery = `
      SELECT 
        id,
        email,
        name,
        role,
        is_active
      FROM admins
      WHERE is_active = true
      ORDER BY name
    `;

    const result = await query(adminsQuery);
    
    console.log('Admins query result:', result.rows);

    const admins = result.rows.map(row => ({
      id: row.id.toString(),
      first_name: row.name.split(' ')[0],
      last_name: row.name.split(' ').slice(1).join(' '),
      email: row.email,
      full_name: row.name
    }));

    console.log('Returning admins from database:', admins);

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
