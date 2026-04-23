const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/amenities — list all amenities
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM amenities WHERE society_id = $1 AND is_active = true ORDER BY name',
      [req.user.society_id]
    );
    res.json({ amenities: rows });
  } catch (err) {
    console.error('List amenities error:', err);
    res.status(500).json({ error: 'Failed to fetch amenities' });
  }
});

// POST /api/amenities — create amenity (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, location, capacity, booking_required, open_time, close_time, charge_per_hour } = req.body;
    if (!name) return res.status(400).json({ error: 'Amenity name is required' });

    const { rows } = await pool.query(
      `INSERT INTO amenities (society_id, name, description, location, capacity, booking_required, open_time, close_time, charge_per_hour)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.society_id, name, description || null, location || null, capacity || null, booking_required !== false, open_time || '06:00', close_time || '22:00', charge_per_hour || 0]
    );
    res.status(201).json({ amenity: rows[0] });
  } catch (err) {
    console.error('Create amenity error:', err);
    res.status(500).json({ error: 'Failed to create amenity' });
  }
});

// PUT /api/amenities/:id — update amenity (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, location, capacity, booking_required, open_time, close_time, charge_per_hour, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE amenities SET name = COALESCE($1, name), description = COALESCE($2, description),
       location = COALESCE($3, location), capacity = COALESCE($4, capacity),
       booking_required = COALESCE($5, booking_required), open_time = COALESCE($6, open_time),
       close_time = COALESCE($7, close_time), charge_per_hour = COALESCE($8, charge_per_hour),
       is_active = COALESCE($9, is_active)
       WHERE id = $10 AND society_id = $11 RETURNING *`,
      [name, description, location, capacity, booking_required, open_time, close_time, charge_per_hour, is_active, req.params.id, req.user.society_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Amenity not found' });
    res.json({ amenity: rows[0] });
  } catch (err) {
    console.error('Update amenity error:', err);
    res.status(500).json({ error: 'Failed to update amenity' });
  }
});

// GET /api/amenities/:id/bookings — get bookings for an amenity
router.get('/:id/bookings', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT ab.*, u.name as resident_name, u.flat_number, u.block
      FROM amenity_bookings ab
      LEFT JOIN users u ON ab.resident_id = u.id
      WHERE ab.amenity_id = $1 AND ab.society_id = $2
    `;
    const params = [req.params.id, req.user.society_id];
    if (date) {
      query += ' AND ab.booking_date = $3';
      params.push(date);
    }
    query += ' ORDER BY ab.booking_date, ab.start_time';

    const { rows } = await pool.query(query, params);
    res.json({ bookings: rows });
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/amenities/:id/book — book an amenity
router.post('/:id/book', authenticate, async (req, res) => {
  try {
    const { booking_date, start_time, end_time, notes } = req.body;
    if (!booking_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Date, start time, and end time are required' });
    }

    // Check for conflicts
    const conflicts = await pool.query(
      `SELECT id FROM amenity_bookings
       WHERE amenity_id = $1 AND booking_date = $2 AND status = 'confirmed'
       AND ((start_time < $4 AND end_time > $3))`,
      [req.params.id, booking_date, start_time, end_time]
    );
    if (conflicts.rows.length > 0) {
      return res.status(409).json({ error: 'Time slot already booked' });
    }

    // Get amenity charge
    const amenity = await pool.query('SELECT charge_per_hour FROM amenities WHERE id = $1', [req.params.id]);
    const charge = amenity.rows[0]?.charge_per_hour || 0;

    const { rows } = await pool.query(
      `INSERT INTO amenity_bookings (amenity_id, resident_id, society_id, booking_date, start_time, end_time, total_charge, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.id, req.user.id, req.user.society_id, booking_date, start_time, end_time, charge, notes || null]
    );
    res.status(201).json({ booking: rows[0] });
  } catch (err) {
    console.error('Book amenity error:', err);
    res.status(500).json({ error: 'Failed to book amenity' });
  }
});

// PUT /api/amenities/bookings/:id/cancel — cancel a booking
router.put('/bookings/:id/cancel', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE amenity_bookings SET status = 'cancelled'
       WHERE id = $1 AND (resident_id = $2 OR $3 = 'admin') AND status = 'confirmed'
       RETURNING *`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Booking not found or already cancelled' });
    res.json({ booking: rows[0] });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// GET /api/amenities/my-bookings — get current user's bookings
router.get('/my-bookings', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ab.*, a.name as amenity_name, a.location
       FROM amenity_bookings ab
       LEFT JOIN amenities a ON ab.amenity_id = a.id
       WHERE ab.resident_id = $1 AND ab.society_id = $2
       ORDER BY ab.booking_date DESC, ab.start_time DESC LIMIT 50`,
      [req.user.id, req.user.society_id]
    );
    res.json({ bookings: rows });
  } catch (err) {
    console.error('My bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;
