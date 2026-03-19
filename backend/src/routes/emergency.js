const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/emergency
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM emergency_contacts WHERE society_id = $1 AND is_active = true ORDER BY service_type, name',
      [req.user.society_id]
    );
    res.json({ contacts: rows });
  } catch (err) {
    console.error('List emergency contacts error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// POST /api/emergency — admin only
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, phone, service_type, address } = req.body;
    if (!name || !phone || !service_type) {
      return res.status(400).json({ error: 'Name, phone, and service type are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO emergency_contacts (society_id, name, phone, service_type, address)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.society_id, name, phone, service_type, address || null]
    );
    res.status(201).json({ contact: rows[0] });
  } catch (err) {
    console.error('Create emergency contact error:', err);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// PUT /api/emergency/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, phone, service_type, address, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE emergency_contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone),
       service_type=COALESCE($3,service_type), address=COALESCE($4,address), is_active=COALESCE($5,is_active)
       WHERE id=$6 AND society_id=$7 RETURNING *`,
      [name, phone, service_type, address, is_active, req.params.id, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact: rows[0] });
  } catch (err) {
    console.error('Update emergency contact error:', err);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/emergency/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM emergency_contacts WHERE id=$1 AND society_id=$2 RETURNING id',
      [req.params.id, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    console.error('Delete emergency contact error:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;
