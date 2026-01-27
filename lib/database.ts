import { Pool } from 'pg';

console.log('🔌 Initializing Database Pool...');
const connectionString = process.env.DATABASE_URL;

// Build configuration from individual variables or fallback to connection string
const dbConfig: any = {
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
};

if (process.env.DB_HOST) {
  console.log('🔗 Using individual database variables');
  dbConfig.host = process.env.DB_HOST;
  dbConfig.port = parseInt(process.env.DB_PORT || '5432', 10);
  dbConfig.user = process.env.DB_USER;
  dbConfig.password = process.env.DB_PASSWORD;
  dbConfig.database = process.env.DB_NAME;

  if (dbConfig.host.includes('.i.db.ondigitalocean.com')) {
    console.warn('⚠️  WARNING: Using INTERNAL database host (.i.). This will only work from within DigitalOcean VPC.');
    console.warn('👉 If you are developing locally, please use the PUBLIC connection string from DigitalOcean.');
  }
} else if (connectionString) {
  console.log('🔗 Using DATABASE_URL connection string');
  dbConfig.connectionString = connectionString;
  if (connectionString.includes('.i.db.ondigitalocean.com')) {
    console.warn('⚠️  WARNING: Using INTERNAL database host (.i.). This will only work from within DigitalOcean VPC.');
    console.warn('👉 If you are developing locally, please use the PUBLIC connection string from DigitalOcean.');
  }
} else {
  console.error('❌ No database configuration found (DB_HOST or DATABASE_URL)');
}

const pool = new Pool(dbConfig);

export default pool;

// Database query helper
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    console.log('Executing query:', text);
    console.log('With params:', params);
    const result = await client.query(text, params);
    console.log('Query result:', result.rows.length, 'rows');
    return result;
  } catch (error: any) {
    if (error.message.includes('timeout')) {
      console.error('❌ DATABASE CONNECTION TIMEOUT');
      console.error('Check if your IP is added to the "Trusted Sources" in DigitalOcean.');
      console.error('Also verify you are using the PUBLIC connection string, not the internal one.');
    }
    console.error('Database query error:', error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
