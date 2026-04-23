const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/notices
router.get('/', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT n.*, u.name as author_name, u.role as author_role
      FROM notices n LEFT JOIN users u ON n.author_id = u.id
      WHERE n.society_id = $1 AND (n.expires_at IS NULL OR n.expires_at > NOW())
    `;
    const params = [req.user.society_id];
    if (category) {
      query += ' AND n.category = $2';
      params.push(category);
    }
    query += ' ORDER BY n.is_pinned DESC, n.created_at DESC LIMIT 50';

    const { rows } = await pool.query(query, params);
    res.json({ notices: rows });
  } catch (err) {
    console.error('List notices error:', err);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

// POST /api/notices — admin only
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, content, category, priority, is_pinned, expires_at } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO notices (society_id, author_id, title, content, category, priority, is_pinned, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.society_id, req.user.id, title, content, category || 'general', priority || 'normal', is_pinned || false, expires_at || null]
    );
    res.status(201).json({ notice: rows[0] });
  } catch (err) {
    console.error('Create notice error:', err);
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

// PUT /api/notices/:id — admin only
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, content, category, priority, is_pinned, expires_at } = req.body;
    const { rows } = await pool.query(
      `UPDATE notices SET title = COALESCE($1, title), content = COALESCE($2, content),
       category = COALESCE($3, category), priority = COALESCE($4, priority),
       is_pinned = COALESCE($5, is_pinned), expires_at = COALESCE($6, expires_at), updated_at = NOW()
       WHERE id = $7 AND society_id = $8 RETURNING *`,
      [title, content, category, priority, is_pinned, expires_at, req.params.id, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Notice not found' });
    res.json({ notice: rows[0] });
  } catch (err) {
    console.error('Update notice error:', err);
    res.status(500).json({ error: 'Failed to update notice' });
  }
});

// DELETE /api/notices/:id — admin only
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM notices WHERE id = $1 AND society_id = $2 RETURNING id',
      [req.params.id, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Notice not found' });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    console.error('Delete notice error:', err);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

module.exports = router;
