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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';

    const offset = (page - 1) * limit;

    // Build WHERE clauses for each table type
    // Note: For UNION ALL, we need to handle parameters carefully
    // Since each UNION part can reuse the same parameter, we'll use the same param number
    let params = [];
    let paramCount = 0;

    // Build search condition - will be reused in all UNION parts
    let searchCondition = '';
    if (search) {
      paramCount++;
      searchCondition = `(
        d.first_name ILIKE $${paramCount} OR d.last_name ILIKE $${paramCount} OR d.email ILIKE $${paramCount} OR
        p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR p.email ILIKE $${paramCount}
      )`;
      // Add search param once - it will be reused in all UNION parts
      params.push(`%${search}%`);
    }

    // Build WHERE clause for appointments
    let appointmentConditions = [];
    if (searchCondition) appointmentConditions.push(searchCondition);
    if (status !== 'all') {
      appointmentConditions.push(`a.status = '${status}'`);
    }
    if (type !== 'all') {
      appointmentConditions.push(`a.appointment_type = '${type}'`);
    }
    const appointmentWhere = appointmentConditions.length > 0 ? `WHERE ${appointmentConditions.join(' AND ')}` : '';

    // Build WHERE clause for text_sessions
    let textSessionConditions = [];
    if (searchCondition) textSessionConditions.push(searchCondition);
    if (status !== 'all') {
      textSessionConditions.push(`ts.status = '${status}'`);
    }
    if (type !== 'all' && type === 'text') {
      // text_sessions are always type 'text', so only include if filtering for 'text'
      // No additional condition needed
    } else if (type !== 'all' && type !== 'text') {
      // If filtering for a type other than 'text', exclude text_sessions
      textSessionConditions.push('1 = 0'); // Always false condition
    }
    const textSessionWhere = textSessionConditions.length > 0 ? `WHERE ${textSessionConditions.join(' AND ')}` : '';

    // Build WHERE clause for call_sessions
    let callSessionConditions = [];
    if (searchCondition) callSessionConditions.push(searchCondition);
    if (status !== 'all') {
      callSessionConditions.push(`cs.status = '${status}'`);
    }
    if (type !== 'all') {
      // Map appointment types to call types
      if (type === 'voice' || type === 'video' || type === 'call') {
        callSessionConditions.push(`cs.call_type = '${type}'`);
      } else {
        // If filtering for 'text', exclude call_sessions
        callSessionConditions.push('1 = 0'); // Always false condition
      }
    }
    const callSessionWhere = callSessionConditions.length > 0 ? `WHERE ${callSessionConditions.join(' AND ')}` : '';

    // Get total count from all sources
    const countQuery = `
      SELECT COUNT(*) as count FROM (
        SELECT a.id::integer
        FROM appointments a
        JOIN users d ON a.doctor_id = d.id
        JOIN users p ON a.patient_id = p.id
        ${appointmentWhere}
        
        UNION ALL
        
        SELECT ts.id::integer
        FROM text_sessions ts
        JOIN users d ON ts.doctor_id = d.id
        JOIN users p ON ts.patient_id = p.id
        ${textSessionWhere}
        
        UNION ALL
        
        SELECT cs.id::integer
        FROM call_sessions cs
        JOIN users d ON cs.doctor_id = d.id
        JOIN users p ON cs.patient_id = p.id
        ${callSessionWhere}
      ) as combined
    `;
    console.log('Count query:', countQuery);
    console.log('Count params:', params);
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);
    console.log('Total count:', totalCount);

    // Get appointments with session data
    // Note: All columns in UNION must have matching types, so we cast them explicitly
    paramCount++;
    const appointmentsQuery = `
      SELECT 
        a.id::integer, a.doctor_id::integer, a.patient_id::integer, 
        COALESCE(a.appointment_type::text, '') as appointment_type, 
        COALESCE(a.status::text, '') as status,
        a.appointment_date::text as scheduled_date, 
        a.appointment_time::text as scheduled_time, 
        COALESCE(a.duration_minutes::integer, NULL) as duration, 
        COALESCE(a.reason::text, '') as notes, 
        a.created_at::timestamp,
        d.first_name::text as doctor_first_name, 
        d.last_name::text as doctor_last_name, 
        d.email::text as doctor_email,
        p.first_name::text as patient_first_name, 
        p.last_name::text as patient_last_name, 
        p.email::text as patient_email,
        'appointment'::text as source_type,
        NULL::integer as session_id,
        NULL::text as session_status,
        a.actual_start_time::timestamp as session_started_at,
        a.actual_end_time::timestamp as session_ended_at,
        NULL::integer as call_duration,
        COALESCE(a.sessions_deducted::integer, NULL) as sessions_used
      FROM appointments a
      JOIN users d ON a.doctor_id = d.id
      JOIN users p ON a.patient_id = p.id
      ${appointmentWhere}
      
      UNION ALL
      
      SELECT 
        ts.id::integer, ts.doctor_id::integer, ts.patient_id::integer, 
        'text'::text as appointment_type, 
        COALESCE(ts.status::text, '') as status, 
        NULL::text as scheduled_date, 
        NULL::text as scheduled_time, 
        NULL::integer as duration, 
        COALESCE(ts.description::text, '') as notes, 
        ts.created_at::timestamp,
        d.first_name::text as doctor_first_name, 
        d.last_name::text as doctor_last_name, 
        d.email::text as doctor_email,
        p.first_name::text as patient_first_name, 
        p.last_name::text as patient_last_name, 
        p.email::text as patient_email,
        'text_session'::text as source_type,
        ts.id::integer as session_id,
        COALESCE(ts.status::text, '') as session_status,
        ts.started_at::timestamp as session_started_at,
        ts.ended_at::timestamp as session_ended_at,
        NULL::integer as call_duration,
        COALESCE(ts.sessions_used::integer, NULL) as sessions_used
      FROM text_sessions ts
      JOIN users d ON ts.doctor_id = d.id
      JOIN users p ON ts.patient_id = p.id
      ${textSessionWhere}
      
      UNION ALL
      
      SELECT 
        cs.id::integer, cs.doctor_id::integer, cs.patient_id::integer, 
        COALESCE(cs.call_type::text, '') as appointment_type, 
        COALESCE(cs.status::text, '') as status, 
        NULL::text as scheduled_date, 
        NULL::text as scheduled_time, 
        COALESCE(cs.call_duration::integer, NULL) as duration, 
        COALESCE(cs.reason::text, '') as notes, 
        cs.created_at::timestamp,
        d.first_name::text as doctor_first_name, 
        d.last_name::text as doctor_last_name, 
        d.email::text as doctor_email,
        p.first_name::text as patient_first_name, 
        p.last_name::text as patient_last_name, 
        p.email::text as patient_email,
        'call_session'::text as source_type,
        cs.id::integer as session_id,
        COALESCE(cs.status::text, '') as session_status,
        cs.started_at::timestamp as session_started_at,
        cs.ended_at::timestamp as session_ended_at,
        COALESCE(cs.call_duration::integer, NULL) as call_duration,
        COALESCE(cs.sessions_used::integer, NULL) as sessions_used
      FROM call_sessions cs
      JOIN users d ON cs.doctor_id = d.id
      JOIN users p ON cs.patient_id = p.id
      ${callSessionWhere}
      
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    console.log('Appointments query:', appointmentsQuery);
    console.log('Appointments params:', params);
    const appointmentsResult = await query(appointmentsQuery, params);
    console.log('Appointments result count:', appointmentsResult.rows.length);

    // Format the response
    const appointments = appointmentsResult.rows.map(row => ({
      id: row.id,
      doctor_id: row.doctor_id,
      patient_id: row.patient_id,
      appointment_type: row.appointment_type,
      status: row.status,
      scheduled_date: row.scheduled_date,
      scheduled_time: row.scheduled_time,
      duration: row.duration,
      notes: row.notes,
      created_at: row.created_at,
      source_type: row.source_type,
      session_id: row.session_id,
      session_status: row.session_status,
      session_started_at: row.session_started_at,
      session_ended_at: row.session_ended_at,
      call_duration: row.call_duration,
      sessions_used: row.sessions_used,
      doctor: {
        first_name: row.doctor_first_name,
        last_name: row.doctor_last_name,
        email: row.doctor_email,
      },
      patient: {
        first_name: row.patient_first_name,
        last_name: row.patient_last_name,
        email: row.patient_email,
      },
    }));

    return NextResponse.json({
      appointments,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error: any) {
    console.error('Appointments fetch error:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
