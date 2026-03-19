const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function generateGatePass() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET /api/visitors — list visitors for society
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, date } = req.query;
    let query = `
      SELECT v.*, u.name as resident_name, u.flat_number, u.block,
             a.name as approved_by_name
      FROM visitors v
      LEFT JOIN users u ON v.resident_id = u.id
      LEFT JOIN users a ON v.approved_by = a.id
      WHERE v.society_id = $1
    `;
    const params = [req.user.society_id];
    let idx = 2;

    if (req.user.role === 'resident') {
      query += ` AND v.resident_id = $${idx}`;
      params.push(req.user.id);
      idx++;
    }
    if (status) {
      query += ` AND v.status = $${idx}`;
      params.push(status);
      idx++;
    }
    if (type) {
      query += ` AND v.visitor_type = $${idx}`;
      params.push(type);
      idx++;
    }
    if (date) {
      query += ` AND DATE(v.created_at) = $${idx}`;
      params.push(date);
      idx++;
    }
    query += ' ORDER BY v.created_at DESC LIMIT 100';

    const { rows } = await pool.query(query, params);
    res.json({ visitors: rows });
  } catch (err) {
    console.error('List visitors error:', err);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

// POST /api/visitors — pre-approve a visitor
router.post('/', authenticate, async (req, res) => {
  try {
    const { visitor_name, visitor_phone, visitor_type, vehicle_number, purpose, expected_date } = req.body;
    if (!visitor_name) {
      return res.status(400).json({ error: 'Visitor name is required' });
    }

    const gatePass = generateGatePass();
    const { rows } = await pool.query(
      `INSERT INTO visitors (society_id, resident_id, visitor_name, visitor_phone, visitor_type, vehicle_number, purpose, status, gate_pass_code, is_preapproved, expected_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8, true, $9)
       RETURNING *`,
      [req.user.society_id, req.user.id, visitor_name, visitor_phone || null, visitor_type || 'guest', vehicle_number || null, purpose || null, gatePass, expected_date || null]
    );
    res.status(201).json({ visitor: rows[0] });
  } catch (err) {
    console.error('Create visitor error:', err);
    res.status(500).json({ error: 'Failed to create visitor entry' });
  }
});

// POST /api/visitors/walkin — security logs a walk-in visitor
router.post('/walkin', authenticate, authorize('security', 'admin'), async (req, res) => {
  try {
    const { visitor_name, visitor_phone, visitor_type, vehicle_number, purpose, resident_id } = req.body;
    if (!visitor_name || !resident_id) {
      return res.status(400).json({ error: 'Visitor name and resident are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO visitors (society_id, resident_id, visitor_name, visitor_phone, visitor_type, vehicle_number, purpose, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [req.user.society_id, resident_id, visitor_name, visitor_phone || null, visitor_type || 'guest', vehicle_number || null, purpose || null]
    );
    res.status(201).json({ visitor: rows[0] });
  } catch (err) {
    console.error('Walk-in visitor error:', err);
    res.status(500).json({ error: 'Failed to log walk-in visitor' });
  }
});

// PUT /api/visitors/:id/approve
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE visitors SET status = 'approved', approved_by = $1, gate_pass_code = $2, updated_at = NOW()
       WHERE id = $3 AND (resident_id = $4 OR $5 IN ('admin', 'security')) AND status = 'pending'
       RETURNING *`,
      [req.user.id, generateGatePass(), req.params.id, req.user.id, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Visitor not found or already processed' });
    res.json({ visitor: rows[0] });
  } catch (err) {
    console.error('Approve visitor error:', err);
    res.status(500).json({ error: 'Failed to approve visitor' });
  }
});

// PUT /api/visitors/:id/reject
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE visitors SET status = 'rejected', updated_at = NOW()
       WHERE id = $1 AND (resident_id = $2 OR $3 IN ('admin', 'security')) AND status = 'pending'
       RETURNING *`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Visitor not found or already processed' });
    res.json({ visitor: rows[0] });
  } catch (err) {
    console.error('Reject visitor error:', err);
    res.status(500).json({ error: 'Failed to reject visitor' });
  }
});

// PUT /api/visitors/:id/checkin — security checks in visitor
router.put('/:id/checkin', authenticate, authorize('security', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE visitors SET status = 'checked_in', check_in_time = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'approved'
       RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Visitor not found or not approved' });
    res.json({ visitor: rows[0] });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Failed to check in visitor' });
  }
});

// PUT /api/visitors/:id/checkout — security checks out visitor
router.put('/:id/checkout', authenticate, authorize('security', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE visitors SET status = 'checked_out', check_out_time = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'checked_in'
       RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Visitor not found or not checked in' });
    res.json({ visitor: rows[0] });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ error: 'Failed to check out visitor' });
  }
});

// GET /api/visitors/verify/:code — verify gate pass
router.get('/verify/:code', authenticate, authorize('security', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, u.name as resident_name, u.flat_number, u.block
       FROM visitors v LEFT JOIN users u ON v.resident_id = u.id
       WHERE v.gate_pass_code = $1 AND v.society_id = $2`,
      [req.params.code, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Invalid gate pass' });
    res.json({ visitor: rows[0] });
  } catch (err) {
    console.error('Verify gate pass error:', err);
    res.status(500).json({ error: 'Failed to verify gate pass' });
  }
});

module.exports = router;
