import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all admin users - try different approaches
    const adminsQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        user_type,
        role
      FROM users
      WHERE user_type = 'admin' OR role = 'admin' OR user_type = 'Admin' OR role = 'Admin'
      ORDER BY first_name, last_name
    `;

    const result = await query(adminsQuery);
    
    console.log('Admins query result:', result.rows);

    // If no admins found, let's try to get all users to see what we have
    if (result.rows.length === 0) {
      const allUsersQuery = `
        SELECT 
          id,
          first_name,
          last_name,
          email,
          user_type,
          role
        FROM users
        ORDER BY first_name, last_name
        LIMIT 10
      `;
      
      const allUsersResult = await query(allUsersQuery);
      console.log('Sample users:', allUsersResult.rows);
      
      // For now, return all users as potential admins for testing
      const fallbackAdmins = allUsersResult.rows.map(row => ({
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        full_name: `${row.first_name} ${row.last_name}`
      }));
      
      return NextResponse.json({
        admins: fallbackAdmins,
        totalCount: fallbackAdmins.length,
        note: 'No admin users found, showing all users as fallback'
      });
    }

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
