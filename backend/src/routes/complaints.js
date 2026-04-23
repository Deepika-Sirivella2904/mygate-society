const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/complaints
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    let query = `
      SELECT c.*, u.name as resident_name, u.flat_number, u.block,
             a.name as assigned_to_name
      FROM complaints c
      LEFT JOIN users u ON c.resident_id = u.id
      LEFT JOIN users a ON c.assigned_to = a.id
      WHERE c.society_id = $1
    `;
    const params = [req.user.society_id];
    let idx = 2;

    if (req.user.role === 'resident') {
      query += ` AND c.resident_id = $${idx}`;
      params.push(req.user.id);
      idx++;
    }
    if (status) { query += ` AND c.status = $${idx}`; params.push(status); idx++; }
    if (category) { query += ` AND c.category = $${idx}`; params.push(category); idx++; }
    if (priority) { query += ` AND c.priority = $${idx}`; params.push(priority); idx++; }
    query += ' ORDER BY c.created_at DESC LIMIT 100';

    const { rows } = await pool.query(query, params);
    res.json({ complaints: rows });
  } catch (err) {
    console.error('List complaints error:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// POST /api/complaints
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO complaints (society_id, resident_id, title, description, category, priority)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.society_id, req.user.id, title, description, category, priority || 'medium']
    );
    res.status(201).json({ complaint: rows[0] });
  } catch (err) {
    console.error('Create complaint error:', err);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// GET /api/complaints/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, u.name as resident_name, u.flat_number, u.block, a.name as assigned_to_name
       FROM complaints c LEFT JOIN users u ON c.resident_id = u.id LEFT JOIN users a ON c.assigned_to = a.id
       WHERE c.id = $1 AND c.society_id = $2`,
      [req.params.id, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Complaint not found' });
    res.json({ complaint: rows[0] });
  } catch (err) {
    console.error('Get complaint error:', err);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// PUT /api/complaints/:id — update status/assignment (admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, assigned_to, resolution_notes, priority } = req.body;
    let resolvedAt = null;
    if (status === 'resolved' || status === 'closed') resolvedAt = new Date();

    const { rows } = await pool.query(
      `UPDATE complaints SET status = COALESCE($1, status), assigned_to = COALESCE($2, assigned_to),
       resolution_notes = COALESCE($3, resolution_notes), priority = COALESCE($4, priority),
       resolved_at = COALESCE($5, resolved_at), updated_at = NOW()
       WHERE id = $6 AND society_id = $7 RETURNING *`,
      [status, assigned_to, resolution_notes, priority, resolvedAt, req.params.id, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Complaint not found' });
    res.json({ complaint: rows[0] });
  } catch (err) {
    console.error('Update complaint error:', err);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// DELETE /api/complaints/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM complaints WHERE id = $1 AND (resident_id = $2 OR $3 = 'admin') AND society_id = $4 RETURNING id`,
      [req.params.id, req.user.id, req.user.role, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Complaint not found' });
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    console.error('Delete complaint error:', err);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

// GET /api/complaints/stats/summary — admin dashboard stats
router.get('/stats/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) as count FROM complaints WHERE society_id = $1 GROUP BY status`,
      [req.user.society_id]
    );
    const stats = { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 };
    rows.forEach(r => { stats[r.status] = parseInt(r.count); stats.total += parseInt(r.count); });
    res.json({ stats });
  } catch (err) {
    console.error('Complaint stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
