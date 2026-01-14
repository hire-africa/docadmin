import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch admins from database
    const adminResult = await query(
      'SELECT id, name, email FROM admins WHERE is_active = true ORDER BY name'
    );

    const admins = adminResult.rows.map(admin => ({
      id: admin.id.toString(),
      first_name: admin.name.split(' ')[0],
      last_name: admin.name.split(' ').slice(1).join(' '),
      email: admin.email,
      full_name: admin.name
    }));

    console.log('Returning admins from database for dropdown:', admins);

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
