const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
    }
});

async function checkSchema() {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
        const tables = ['users', 'admins'];
        for (const table of tables) {
            console.log(`\nColumns for table: ${table}`);
            const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);

            if (result.rows.length === 0) {
                console.log('   (Table not found or has no columns)');
            } else {
                result.rows.forEach(row => {
                    console.log(`- ${row.column_name} (${row.data_type})`);
                });
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
