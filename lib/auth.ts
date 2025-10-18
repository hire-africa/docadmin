import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
  return bcrypt.compare(password, hash);
}

// Admin authentication using database
export async function validateAdminCredentials(email: string, password: string): Promise<{ valid: boolean; admin?: any }> {
  try {
    const { query } = await import('./database');
    
    const adminQuery = `
      SELECT id, email, password, name, role, is_active
      FROM admins
      WHERE email = $1 AND is_active = true
    `;
    
    const result = await query(adminQuery, [email]);
    
    if (result.rows.length === 0) {
      return { valid: false };
    }
    
    const admin = result.rows[0];
    
    // Compare password (assuming passwords are stored as plain text for now)
    // In production, you should hash passwords and use bcrypt.compare
    if (admin.password === password) {
      return { 
        valid: true, 
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      };
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
    const { query } = await import('./database');
    
    const adminQuery = `
      SELECT id FROM admins
      WHERE email = $1 AND is_active = true
    `;
    
    const result = await query(adminQuery, [email]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking admin email:', error);
    return false;
  }
}
