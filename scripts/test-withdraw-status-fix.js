const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env
try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1].trim()] = match[2].trim().replace(/^["'](.*)["']$/, '$1');
            }
        });
    }
} catch (e) { }

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runTest() {
    const client = await pool.connect();
    try {
        console.log('--- Testing Withdrawal Status Fix Logic ---');

        // 1. Get an existing withdrawal request
        const wrRes = await client.query('SELECT id, status, paid_by FROM withdrawal_requests LIMIT 1');
        if (wrRes.rows.length === 0) {
            console.log('No withdrawal requests found to test.');
            return;
        }
        const wrId = wrRes.rows[0].id;
        console.log(`Testing with Withdrawal Request ID: ${wrId}`);

        // 2. act as if we received admin ID '1' (or whatever exists)
        const adminIdInput = 1;
        console.log(`Simulating input completed_by (admin table id): ${adminIdInput}`);

        // Logic from route.ts
        let adminUserId = null;

        // Check admin exists and get email
        const checkAdminQuery = `SELECT email FROM admins WHERE id = $1`;
        const checkAdminResult = await client.query(checkAdminQuery, [adminIdInput]);

        if (checkAdminResult.rows.length > 0) {
            const email = checkAdminResult.rows[0].email;
            console.log(`Found admin email: ${email}`);

            // Now find this email in the users table
            const userQuery = `SELECT id FROM users WHERE email = $1`;
            const userResult = await client.query(userQuery, [email]);

            if (userResult.rows.length > 0) {
                adminUserId = userResult.rows[0].id;
                console.log(`Resolved to Users Table ID: ${adminUserId}`);
            } else {
                console.log(`Admin with email ${email} not found in users table.`);
            }
        } else {
            console.log('Admin ID not found in admins table.');
        }

        if (adminUserId) {
            console.log(`Ready to update withdrawal_requests with paid_by = ${adminUserId}`);
            // Check if this ID actually exists in users table (it should)
            const verifyUser = await client.query('SELECT id FROM users WHERE id = $1', [adminUserId]);
            if (verifyUser.rows.length > 0) {
                console.log('✅ VALIDATION PASSED: The resolved ID exists in users table.');
            } else {
                console.log('❌ VALIDATION FAILED: The resolved ID does NOT exist in users table.');
            }
        } else {
            console.log('❌ Test Failed: Could not resolve to a valid user ID.');
        }

    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

runTest();
