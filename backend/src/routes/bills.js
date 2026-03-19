const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/bills
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = `
      SELECT b.*, u.name as resident_name, u.flat_number, u.block
      FROM bills b LEFT JOIN users u ON b.resident_id = u.id
      WHERE b.society_id = $1
    `;
    const params = [req.user.society_id];
    let idx = 2;

    if (req.user.role === 'resident') {
      query += ` AND b.resident_id = $${idx}`;
      params.push(req.user.id);
      idx++;
    }
    if (status) { query += ` AND b.status = $${idx}`; params.push(status); idx++; }
    if (type) { query += ` AND b.bill_type = $${idx}`; params.push(type); idx++; }
    query += ' ORDER BY b.due_date DESC LIMIT 100';

    const { rows } = await pool.query(query, params);
    res.json({ bills: rows });
  } catch (err) {
    console.error('List bills error:', err);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// POST /api/bills — admin creates bill
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { resident_id, title, description, amount, bill_type, due_date } = req.body;
    if (!resident_id || !title || !amount || !bill_type || !due_date) {
      return res.status(400).json({ error: 'Resident, title, amount, type, and due date are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO bills (society_id, resident_id, title, description, amount, bill_type, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.society_id, resident_id, title, description || null, amount, bill_type, due_date]
    );
    res.status(201).json({ bill: rows[0] });
  } catch (err) {
    console.error('Create bill error:', err);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// POST /api/bills/bulk — admin creates bills for all residents
router.post('/bulk', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, description, amount, bill_type, due_date } = req.body;
    if (!title || !amount || !bill_type || !due_date) {
      return res.status(400).json({ error: 'Title, amount, type, and due date are required' });
    }

    const residents = await pool.query(
      "SELECT id FROM users WHERE society_id = $1 AND role = 'resident' AND is_active = true",
      [req.user.society_id]
    );

    let created = 0;
    for (const r of residents.rows) {
      await pool.query(
        `INSERT INTO bills (society_id, resident_id, title, description, amount, bill_type, due_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [req.user.society_id, r.id, title, description || null, amount, bill_type, due_date]
      );
      created++;
    }
    res.status(201).json({ message: `${created} bills created`, count: created });
  } catch (err) {
    console.error('Bulk bill error:', err);
    res.status(500).json({ error: 'Failed to create bulk bills' });
  }
});

// PUT /api/bills/:id/pay — resident pays bill
router.put('/:id/pay', authenticate, async (req, res) => {
  try {
    const { payment_method, transaction_id } = req.body;
    const { rows } = await pool.query(
      `UPDATE bills SET status = 'paid', paid_at = NOW(), payment_method = $1, transaction_id = $2, updated_at = NOW()
       WHERE id = $3 AND resident_id = $4 AND status IN ('pending', 'overdue')
       RETURNING *`,
      [payment_method || 'online', transaction_id || null, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Bill not found or already paid' });
    res.json({ bill: rows[0] });
  } catch (err) {
    console.error('Pay bill error:', err);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// PUT /api/bills/:id/waive — admin waives bill
router.put('/:id/waive', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE bills SET status = 'waived', updated_at = NOW()
       WHERE id = $1 AND society_id = $2 AND status IN ('pending', 'overdue')
       RETURNING *`,
      [req.params.id, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Bill not found' });
    res.json({ bill: rows[0] });
  } catch (err) {
    console.error('Waive bill error:', err);
    res.status(500).json({ error: 'Failed to waive bill' });
  }
});

// GET /api/bills/stats/summary
router.get('/stats/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) as count, SUM(amount) as total_amount
       FROM bills WHERE society_id = $1 GROUP BY status`,
      [req.user.society_id]
    );
    const stats = { pending: { count: 0, amount: 0 }, paid: { count: 0, amount: 0 }, overdue: { count: 0, amount: 0 }, waived: { count: 0, amount: 0 } };
    rows.forEach(r => {
      stats[r.status] = { count: parseInt(r.count), amount: parseFloat(r.total_amount || 0) };
    });
    res.json({ stats });
  } catch (err) {
    console.error('Bill stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
