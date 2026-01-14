import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '6months';

    // Calculate date range
    let monthsBack = 6;
    switch (range) {
      case '1month': monthsBack = 1; break;
      case '3months': monthsBack = 3; break;
      case '6months': monthsBack = 6; break;
      case '1year': monthsBack = 12; break;
    }

    // Initialize result objects (fallback to empty/zeros)
    let userGrowth: any[] = [];
    let revenueData: any[] = [];
    let appointmentStats: any[] = [];
    let paymentMethods: any[] = [];
    let monthlyStats = {
      totalUsers: 0,
      newUsers: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      totalAppointments: 0,
      completedAppointments: 0
    };

    // 1. User Growth
    try {
      const userGrowthResult = await query(`
        SELECT 
          TO_CHAR(created_at, 'Mon YYYY') as month,
          COUNT(*) as total_users,
          COUNT(CASE WHEN user_type = 'doctor' THEN 1 END) as doctors,
          COUNT(CASE WHEN user_type = 'patient' THEN 1 END) as patients
        FROM users 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${monthsBack} months'
        GROUP BY TO_CHAR(created_at, 'Mon YYYY'), EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
        ORDER BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
      `);

      userGrowth = userGrowthResult.rows.map(row => ({
        month: row.month,
        users: parseInt(row.total_users),
        doctors: parseInt(row.doctors),
        patients: parseInt(row.patients),
      }));
    } catch (e) {
      console.error('Error fetching user growth:', e);
    }

    // 2. Revenue Data
    try {
      // Try to determine if plan_price needs casting or if it exists
      // We'll use a safer query that handles potential type mismatch
      const revenueResult = await query(`
        SELECT 
          TO_CHAR(created_at, 'Mon YYYY') as month,
          COALESCE(SUM(plan_price), 0) as revenue,
          COUNT(*) as subscriptions
        FROM subscriptions 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${monthsBack} months'
        AND is_active = true
        GROUP BY TO_CHAR(created_at, 'Mon YYYY'), EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
        ORDER BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
      `);

      revenueData = revenueResult.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue),
        subscriptions: parseInt(row.subscriptions),
      }));
    } catch (e) {
      console.error('Error fetching revenue data (attempt 1):', e);
      // Fallback: try casting if direct sum failed
      try {
        const revenueResultFallback = await query(`
          SELECT 
            TO_CHAR(created_at, 'Mon YYYY') as month,
            COALESCE(SUM(CAST(plan_price AS NUMERIC)), 0) as revenue,
            COUNT(*) as subscriptions
          FROM subscriptions 
          WHERE created_at >= CURRENT_DATE - INTERVAL '${monthsBack} months'
          AND is_active = true
          GROUP BY TO_CHAR(created_at, 'Mon YYYY'), EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
          ORDER BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
        `);
        revenueData = revenueResultFallback.rows.map(row => ({
          month: row.month,
          revenue: parseFloat(row.revenue),
          subscriptions: parseInt(row.subscriptions),
        }));
      } catch (e2) {
        console.error('Error fetching revenue data (attempt 2):', e2);
      }
    }

    // 3. Appointment Stats
    try {
      const appointmentStatsResult = await query(`
        SELECT 
          COALESCE(appointment_type, 'Unknown') as type,
          COUNT(*) as count
        FROM appointments 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${monthsBack} months'
        GROUP BY appointment_type
        ORDER BY count DESC
      `);

      appointmentStats = appointmentStatsResult.rows.map(row => ({
        type: row.type,
        count: parseInt(row.count),
      }));
    } catch (e) {
      console.error('Error fetching appointment stats:', e);
    }

    // 4. Payment Methods
    try {
      const paymentMethodsResult = await query(`
        SELECT 
          COALESCE(payment_method, 'Unknown') as method,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as amount
        FROM payment_transactions 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${monthsBack} months'
        GROUP BY payment_method
        ORDER BY count DESC
      `);

      paymentMethods = paymentMethodsResult.rows.map(row => ({
        method: row.method,
        count: parseInt(row.count),
        amount: parseFloat(row.amount),
      }));
    } catch (e) {
      console.error('Error fetching payment methods:', e);
    }

    // 5. Monthly Stats - execute sequentially to identify failing parts
    try {
      const qTotalUsers = await query(`SELECT COUNT(*) as c FROM users`);
      monthlyStats.totalUsers = parseInt(qTotalUsers.rows[0].c);

      const qNewUsers = await query(`SELECT COUNT(*) as c FROM users WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`);
      monthlyStats.newUsers = parseInt(qNewUsers.rows[0].c);

      // Try revenue stats with safe fallback
      try {
        const qTotalRev = await query(`SELECT COALESCE(SUM(plan_price), 0) as s FROM subscriptions WHERE is_active = true`);
        monthlyStats.totalRevenue = parseFloat(qTotalRev.rows[0].s);

        const qMonthlyRev = await query(`SELECT COALESCE(SUM(plan_price), 0) as s FROM subscriptions WHERE is_active = true AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`);
        monthlyStats.monthlyRevenue = parseFloat(qMonthlyRev.rows[0].s);
      } catch (revErr) {
        console.error('Revenue stats error, trying fallback:', revErr);
        const qTotalRev = await query(`SELECT COALESCE(SUM(CAST(plan_price AS NUMERIC)), 0) as s FROM subscriptions WHERE is_active = true`);
        monthlyStats.totalRevenue = parseFloat(qTotalRev.rows[0].s);

        const qMonthlyRev = await query(`SELECT COALESCE(SUM(CAST(plan_price AS NUMERIC)), 0) as s FROM subscriptions WHERE is_active = true AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`);
        monthlyStats.monthlyRevenue = parseFloat(qMonthlyRev.rows[0].s);
      }

      const qAppointments = await query(`SELECT COUNT(*) as c FROM appointments`);
      monthlyStats.totalAppointments = parseInt(qAppointments.rows[0].c);

      const qCompletedAppts = await query(`SELECT COUNT(*) as c FROM appointments WHERE status = 'completed'`);
      monthlyStats.completedAppointments = parseInt(qCompletedAppts.rows[0].c);

    } catch (e) {
      console.error('Error fetching monthly stats:', e);
    }

    return NextResponse.json({
      userGrowth,
      revenueData,
      appointmentStats,
      paymentMethods,
      monthlyStats,
    });
  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
