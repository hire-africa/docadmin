import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const planId = parseInt(id, 10);
    if (isNaN(planId)) {
      return NextResponse.json(
        { message: 'Invalid plan ID' },
        { status: 400 }
      );
    }
    const {
      name,
      description,
      price,
      currency,
      duration,
      text_sessions,
      voice_calls,
      video_calls,
      features,
      status,
    } = await request.json();

    if (!name || !price) {
      return NextResponse.json(
        { message: 'Name and price are required' },
        { status: 400 }
      );
    }

    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    if (typeof priceNum !== 'number' || isNaN(priceNum)) {
      return NextResponse.json(
        { message: 'Price must be a valid number' },
        { status: 400 }
      );
    }

    const allowedCurrencies = ['USD', 'MWK'];
    const normalizedCurrency = (currency || 'USD').toUpperCase();
    if (!allowedCurrencies.includes(normalizedCurrency)) {
      return NextResponse.json(
        { message: 'Currency must be USD or MWK' },
        { status: 400 }
      );
    }

    // Ensure status is an integer
    const statusInt = parseInt(status?.toString() || '1', 10);

    // Ensure features is a JSON string if the DB expects JSON, or keep as array if driver handles it. 
    // Best practice for pg with jsonb: pass the object/array directly, but if it fails, stringifying helps debugging.
    // We'll try passing it directly but ensure it's an array.
    const featuresArray = Array.isArray(features) ? features : [];

    try {
      const result = await query(`
        UPDATE plans 
        SET name = $1, price = $2, currency = $3, duration = $4, 
            text_sessions = $5, voice_calls = $6, video_calls = $7, features = $8, status = $9
        WHERE id = $10
        RETURNING *
      `, [
        name,
        priceNum,
        normalizedCurrency,
        duration || 30,
        text_sessions || 0,
        voice_calls || 0,
        video_calls || 0,
        JSON.stringify(featuresArray), // Explicitly stringify to ensure JSON column compatibility
        statusInt,
        planId,
      ]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { message: 'Plan not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Plan updated successfully',
        plan: result.rows[0],
      });
    } catch (dbError: any) {
      console.error('Database error during plan update:', dbError);
      return NextResponse.json(
        { message: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Plan update error:', error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const planId = parseInt(id, 10);
    if (isNaN(planId)) {
      return NextResponse.json(
        { message: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Check if plan has active subscriptions
    const subscriptionsResult = await query(
      'SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = $1 AND is_active = true',
      [planId]
    );

    const activeSubscriptions = parseInt(subscriptionsResult.rows[0].count);
    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { message: 'Cannot delete plan with active subscriptions' },
        { status: 400 }
      );
    }

    const result = await query('DELETE FROM plans WHERE id = $1 RETURNING id', [planId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    console.error('Plan deletion error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}






