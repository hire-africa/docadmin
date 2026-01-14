import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
}

export function generateToken(user: AdminUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AdminUser | null {
  try {
    console.log('🔐 Verifying token...');
    console.log('Token length:', token.length);
    console.log('JWT Secret loaded:', !!JWT_SECRET);
    console.log('JWT Secret length:', JWT_SECRET?.length || 0);

    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    console.log('✅ Token verified successfully for:', decoded.email);
    return decoded;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    console.log('❌ Token verification failed:', errorMessage);
    console.log('Error type:', errorName);
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}


// Admin authentication using database
export async function validateAdminCredentials(email: string, password: string): Promise<{ valid: boolean; admin?: any }> {
  try {
    // First check in admins table
    const adminResult = await query(
      'SELECT email, password, name as first_name, role FROM admins WHERE email = $1 AND is_active = true',
      [email]
    );

    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      const isValid = await comparePassword(password, admin.password);

      if (isValid) {
        return {
          valid: true,
          admin: {
            ...admin,
            name: admin.first_name, // Keep compatibility with existing code
            // Don't return password
          }
        };
      }
    }
    return { valid: false };
  } catch (error) {
    console.error('Error validating admin credentials:', error);
    return { valid: false };
  }
}

// Check if email is used for admin account
export async function isAdminEmail(email: string): Promise<boolean> {
  try {
    const adminResult = await query(
      'SELECT id FROM admins WHERE email = $1',
      [email]
    );

    if (adminResult.rows.length > 0) return true;

    const userResult = await query(
      'SELECT id FROM users WHERE email = $1 AND user_type = \'admin\'',
      [email]
    );

    return userResult.rows.length > 0;
  } catch (error) {
    console.error('Error checking admin email:', error);
    return false;
  }
}
