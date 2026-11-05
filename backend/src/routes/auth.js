import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const generateAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, department_id: user.department_id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'citizen' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Only admins can create admin accounts via API
    const safeRole = ['citizen', 'department'].includes(role) ? role : 'citizen';

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone || null, password_hash, safeRole]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshHash]
    );

    setRefreshCookie(res, refreshToken);

    res.status(201).json({ user, accessToken });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      `SELECT id, name, email, phone, role, department_id, password_hash
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshHash]
    );

    setRefreshCookie(res, refreshToken);

    const { password_hash: _, ...safeUser } = user;
    res.json({ user: safeUser, accessToken });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── POST /api/auth/refresh ──────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const result = await query(
      `SELECT rt.user_id, u.role, u.department_id, u.name, u.email
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = result.rows[0];
    const newAccessToken = generateAccessToken({ id: user.user_id, ...user });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('[Auth] Refresh error:', err.message);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// ─── POST /api/auth/logout ───────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[Auth] Logout error:', err.message);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
              d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
