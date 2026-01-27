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

const connectionString = process.env.DATABASE_URL;

console.log('--- Database Connection Test ---');
console.log('URL found:', connectionString ? 'Yes' : 'No');

if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not found in .env');
    process.exit(1);
}

if (connectionString.includes('.i.db.ondigitalocean.com')) {
    console.warn('⚠️  Detected INTERNAL DigitalOcean host (.i.). This usually fails outside of DO VPC.');
    console.warn('👉 Action: Change to the PUBLIC connection string in your .env file.');
}

const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000, // Shorter timeout for the test
    ssl: {
        rejectUnauthorized: false
    }
});

async function test() {
    console.log('Attempting to connect (5s timeout)...');
    const start = Date.now();
    try {
        const client = await pool.connect();
        const duration = Date.now() - start;
        console.log(`✅ Connected successfully in ${duration}ms!`);

        const res = await client.query('SELECT version(), now()');
        console.log('Database version:', res.rows[0].version.split(',')[0]);
        console.log('Current DB time:', res.rows[0].now);

        client.release();
        process.exit(0);
    } catch (err) {
        const duration = Date.now() - start;
        console.error(`❌ Connection failed after ${duration}ms`);
        console.error('Error:', err.message);

        if (err.message.includes('timeout')) {
            console.log('\n--- Troubleshooting ---');
            console.log('1. Are you using the PUBLIC connection string instead of internal?');
            console.log('2. Is your current IP added to the "Trusted Sources" in DigitalOcean?');
            console.log(`   (Your IP might have changed if you are on a VPN or different network)`);
        }
        process.exit(1);
    } finally {
        await pool.end();
    }
}

test();
