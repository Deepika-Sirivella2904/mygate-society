const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/staff
router.get('/', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM staff WHERE society_id = $1';
    const params = [req.user.society_id];
    if (type) { query += ' AND staff_type = $2'; params.push(type); }
    query += ' ORDER BY name';
    const { rows } = await pool.query(query, params);
    res.json({ staff: rows });
  } catch (err) {
    console.error('List staff error:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// POST /api/staff — admin registers new staff
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, phone, staff_type, is_verified } = req.body;
    if (!name || !staff_type) return res.status(400).json({ error: 'Name and type required' });
    const { rows } = await pool.query(
      `INSERT INTO staff (society_id, name, phone, staff_type, is_verified) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.society_id, name, phone || null, staff_type, is_verified || false]
    );
    res.status(201).json({ staff: rows[0] });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

// PUT /api/staff/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, phone, staff_type, is_verified, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE staff SET name=COALESCE($1,name), phone=COALESCE($2,phone), staff_type=COALESCE($3,staff_type),
       is_verified=COALESCE($4,is_verified), is_active=COALESCE($5,is_active)
       WHERE id=$6 AND society_id=$7 RETURNING *`,
      [name, phone, staff_type, is_verified, is_active, req.params.id, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Staff not found' });
    res.json({ staff: rows[0] });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// POST /api/staff/:id/assign — assign staff to resident
router.post('/:id/assign', authenticate, async (req, res) => {
  try {
    const { schedule, entry_time, exit_time } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO staff_residents (staff_id, resident_id, schedule, entry_time, exit_time)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (staff_id, resident_id) DO UPDATE SET schedule=COALESCE($3,staff_residents.schedule),
       entry_time=COALESCE($4,staff_residents.entry_time), exit_time=COALESCE($5,staff_residents.exit_time), is_active=true
       RETURNING *`,
      [req.params.id, req.user.id, schedule || null, entry_time || null, exit_time || null]
    );
    res.status(201).json({ assignment: rows[0] });
  } catch (err) {
    console.error('Assign staff error:', err);
    res.status(500).json({ error: 'Failed to assign staff' });
  }
});

// GET /api/staff/my-staff — get staff assigned to current resident
router.get('/my-staff', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, sr.schedule, sr.entry_time, sr.exit_time
       FROM staff_residents sr JOIN staff s ON sr.staff_id = s.id
       WHERE sr.resident_id = $1 AND sr.is_active = true AND s.is_active = true ORDER BY s.name`,
      [req.user.id]
    );
    res.json({ staff: rows });
  } catch (err) {
    console.error('My staff error:', err);
    res.status(500).json({ error: 'Failed to fetch your staff' });
  }
});

// POST /api/staff/:id/attendance — mark attendance (security/admin)
router.post('/:id/attendance', authenticate, authorize('security', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO staff_attendance (staff_id, society_id, marked_by) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.society_id, req.user.id]
    );
    res.status(201).json({ attendance: rows[0] });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// PUT /api/staff/attendance/:id/checkout
router.put('/attendance/:id/checkout', authenticate, authorize('security', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE staff_attendance SET check_out = NOW() WHERE id = $1 AND check_out IS NULL RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ attendance: rows[0] });
  } catch (err) {
    console.error('Checkout attendance error:', err);
    res.status(500).json({ error: 'Failed to checkout' });
  }
});

// GET /api/staff/:id/attendance — get attendance history
router.get('/:id/attendance', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sa.*, u.name as marked_by_name FROM staff_attendance sa
       LEFT JOIN users u ON sa.marked_by = u.id
       WHERE sa.staff_id = $1 AND sa.society_id = $2 ORDER BY sa.check_in DESC LIMIT 30`,
      [req.params.id, req.user.society_id]
    );
    res.json({ attendance: rows });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

module.exports = router;
