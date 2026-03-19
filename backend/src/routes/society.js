const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/society — get current user's society info
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM societies WHERE id = $1', [req.user.society_id]);
    if (!rows[0]) return res.status(404).json({ error: 'Society not found' });
    res.json({ society: rows[0] });
  } catch (err) {
    console.error('Get society error:', err);
    res.status(500).json({ error: 'Failed to fetch society' });
  }
});

// PUT /api/society — update society (admin only)
router.put('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, address, city, state, pincode, total_units } = req.body;
    const { rows } = await pool.query(
      `UPDATE societies SET name=COALESCE($1,name), address=COALESCE($2,address), city=COALESCE($3,city),
       state=COALESCE($4,state), pincode=COALESCE($5,pincode), total_units=COALESCE($6,total_units), updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, address, city, state, pincode, total_units, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Society not found' });
    res.json({ society: rows[0] });
  } catch (err) {
    console.error('Update society error:', err);
    res.status(500).json({ error: 'Failed to update society' });
  }
});

// GET /api/society/residents — list all residents (admin/security)
router.get('/residents', authenticate, authorize('admin', 'security'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, flat_number, block, is_active, created_at
       FROM users WHERE society_id = $1 ORDER BY block, flat_number`,
      [req.user.society_id]
    );
    res.json({ residents: rows });
  } catch (err) {
    console.error('List residents error:', err);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

// GET /api/society/dashboard — admin dashboard summary
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const sid = req.user.society_id;
    const [users, visitors, complaints, bills, notices] = await Promise.all([
      pool.query("SELECT role, COUNT(*) as count FROM users WHERE society_id=$1 AND is_active=true GROUP BY role", [sid]),
      pool.query("SELECT status, COUNT(*) as count FROM visitors WHERE society_id=$1 AND DATE(created_at)=CURRENT_DATE GROUP BY status", [sid]),
      pool.query("SELECT status, COUNT(*) as count FROM complaints WHERE society_id=$1 GROUP BY status", [sid]),
      pool.query("SELECT status, COUNT(*) as count, SUM(amount) as total FROM bills WHERE society_id=$1 GROUP BY status", [sid]),
      pool.query("SELECT COUNT(*) as count FROM notices WHERE society_id=$1", [sid]),
    ]);

    const toObj = (rows, valKey = 'count') => {
      const o = {};
      rows.forEach(r => { o[r.status || r.role] = valKey === 'both' ? { count: parseInt(r.count), total: parseFloat(r.total || 0) } : parseInt(r[valKey]); });
      return o;
    };

    res.json({
      dashboard: {
        users: toObj(users.rows),
        visitors_today: toObj(visitors.rows),
        complaints: toObj(complaints.rows),
        bills: toObj(bills.rows, 'both'),
        total_notices: parseInt(notices.rows[0].count),
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

module.exports = router;
