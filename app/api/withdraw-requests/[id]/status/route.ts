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
    const { status } = await request.json();

    if (!status || !['completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status. Must be "completed" or "failed"' },
        { status: 400 }
      );
    }

    // First, get the withdrawal request details
    const getRequestQuery = `
      SELECT 
        wr.*,
        u.first_name,
        u.last_name,
        u.email
      FROM withdrawal_requests wr
      LEFT JOIN users u ON wr.doctor_id = u.id
      WHERE wr.id = $1
    `;

    const requestResult = await query(getRequestQuery, [id]);
    
    if (requestResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    const withdrawalRequest = requestResult.rows[0];

    // Update the withdrawal request status
    const updateRequestQuery = `
      UPDATE withdrawal_requests 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    await query(updateRequestQuery, [status, id]);

    // If status is completed, we need to update the doctor's wallet
    if (status === 'completed') {
      // First, check if the doctor has a wallet
      const walletQuery = `
        SELECT id, balance FROM doctor_wallets 
        WHERE doctor_id = $1
      `;
      
      const walletResult = await query(walletQuery, [withdrawalRequest.doctor_id]);
      
      if (walletResult.rows.length === 0) {
        // Create a new wallet for the doctor if it doesn't exist
        const createWalletQuery = `
          INSERT INTO doctor_wallets (doctor_id, balance, created_at, updated_at)
          VALUES ($1, 0, NOW(), NOW())
          RETURNING id
        `;
        await query(createWalletQuery, [withdrawalRequest.doctor_id]);
      }

      // Update the doctor's wallet balance (subtract the withdrawal amount)
      const updateWalletQuery = `
        UPDATE doctor_wallets 
        SET balance = balance - $1, updated_at = NOW()
        WHERE doctor_id = $2
      `;
      
      await query(updateWalletQuery, [withdrawalRequest.amount, withdrawalRequest.doctor_id]);

      // Add a transaction record to the wallet transactions
      const addTransactionQuery = `
        INSERT INTO wallet_transactions (
          wallet_id, 
          type, 
          amount, 
          description, 
          status, 
          created_at, 
          updated_at
        )
        SELECT 
          dw.id,
          'debit',
          $1,
          'Withdrawal processed - ' || $2,
          'completed',
          NOW(),
          NOW()
        FROM doctor_wallets dw
        WHERE dw.doctor_id = $3
      `;
      
      await query(addTransactionQuery, [
        withdrawalRequest.amount,
        withdrawalRequest.payment_method === 'bank_transfer' ? 'Bank Transfer' : 
        withdrawalRequest.payment_method === 'mobile_money' ? 'Mobile Money' : 'Mzunguko',
        withdrawalRequest.doctor_id
      ]);
    }

    return NextResponse.json({
      message: `Withdrawal request ${status} successfully`,
      status: status
    });
  } catch (error) {
    console.error('Withdrawal request status update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
