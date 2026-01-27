const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

try {
    const envConfig = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.log('Could not load .env file', e.message);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkSchema() {
    console.log('Connecting to database...');
    console.log('DB URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');
    const client = await pool.connect();
    try {
        // 1. List all tables
        console.log('\n--- EXISTING TABLES ---');
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        const allTables = tablesRes.rows.map(r => r.table_name);
        allTables.forEach(t => console.log(`- ${t}`));

        // 2. Check specific tables details
        const targetTables = ['doctor_wallets', 'wallet_transactions', 'withdrawal_requests', 'admins', 'users'];

        for (const table of targetTables) {
            if (!allTables.includes(table)) {
                console.log(`\n❌ Table '${table}' does NOT exist.`);
                continue;
            }

            console.log(`\n--- COLUMNS FOR ${table} ---`);
            const result = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);

            result.rows.forEach(row => {
                console.log(`- ${row.column_name} (${row.data_type})`);
            });

            // 2.5 Check foreign keys
            console.log(`\n--- FOREIGN KEYS FOR ${table} ---`);
            const fkResult = await client.query(`
                SELECT
                    tc.constraint_name, 
                    kcu.column_name, 
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name 
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
            `, [table]);

            fkResult.rows.forEach(row => {
                console.log(`- ${row.column_name} -> ${row.foreign_table_name}(${row.foreign_column_name}) [${row.constraint_name}]`);
            });

            // 3. Peek at data
            try {
                const countRes = await client.query(`SELECT COUNT(*) as c FROM "${table}"`);
                console.log(`  > Row count: ${countRes.rows[0].c}`);
            } catch (e) {
                console.log(`  > Could not count rows: ${e.message}`);
            }
        }

    } catch (err) {
        console.error('❌ Error checking schema:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema().catch(err => {
    console.error('💥 Script failed:', err);
    process.exit(1);
});
