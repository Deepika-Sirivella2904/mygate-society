const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, flat_number, block, society_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (society_id, name, email, password, phone, role, flat_number, block)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, society_id, name, email, role, flat_number, block, phone, created_at`,
      [society_id || null, name, email, hashedPassword, phone || null, role || 'resident', flat_number || null, block || null]
    );

    const user = rows[0];
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query(
      'SELECT id, society_id, name, email, password, role, flat_number, block, phone, is_active FROM users WHERE email = $1',
      [email]
    );
    if (!rows[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!rows[0].is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = { ...rows[0] };
    delete user.password;
    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, flat_number, block } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone),
       flat_number = COALESCE($3, flat_number), block = COALESCE($4, block), updated_at = NOW()
       WHERE id = $5
       RETURNING id, society_id, name, email, role, flat_number, block, phone`,
      [name, phone, flat_number, block, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;
