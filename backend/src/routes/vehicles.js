const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/vehicles
router.get('/', authenticate, async (req, res) => {
  try {
    let query = `
      SELECT v.*, u.name as owner_name, u.flat_number, u.block
      FROM vehicles v LEFT JOIN users u ON v.resident_id = u.id
      WHERE v.society_id = $1 AND v.is_active = true
    `;
    const params = [req.user.society_id];
    if (req.user.role === 'resident') {
      query += ' AND v.resident_id = $2';
      params.push(req.user.id);
    }
    query += ' ORDER BY v.vehicle_number';
    const { rows } = await pool.query(query, params);
    res.json({ vehicles: rows });
  } catch (err) {
    console.error('List vehicles error:', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// POST /api/vehicles
router.post('/', authenticate, async (req, res) => {
  try {
    const { vehicle_number, vehicle_type, make, model, color, parking_slot } = req.body;
    if (!vehicle_number || !vehicle_type) {
      return res.status(400).json({ error: 'Vehicle number and type are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO vehicles (resident_id, society_id, vehicle_number, vehicle_type, make, model, color, parking_slot)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, req.user.society_id, vehicle_number, vehicle_type, make || null, model || null, color || null, parking_slot || null]
    );
    res.status(201).json({ vehicle: rows[0] });
  } catch (err) {
    console.error('Create vehicle error:', err);
    res.status(500).json({ error: 'Failed to register vehicle' });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { vehicle_number, vehicle_type, make, model, color, parking_slot } = req.body;
    const { rows } = await pool.query(
      `UPDATE vehicles SET vehicle_number=COALESCE($1,vehicle_number), vehicle_type=COALESCE($2,vehicle_type),
       make=COALESCE($3,make), model=COALESCE($4,model), color=COALESCE($5,color), parking_slot=COALESCE($6,parking_slot)
       WHERE id=$7 AND resident_id=$8 RETURNING *`,
      [vehicle_number, vehicle_type, make, model, color, parking_slot, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle: rows[0] });
  } catch (err) {
    console.error('Update vehicle error:', err);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE vehicles SET is_active = false WHERE id=$1 AND (resident_id=$2 OR $3='admin') RETURNING id`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle removed' });
  } catch (err) {
    console.error('Delete vehicle error:', err);
    res.status(500).json({ error: 'Failed to remove vehicle' });
  }
});

module.exports = router;
