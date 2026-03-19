const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Database schema created successfully');

    // Seed demo data
    const societyId = '11111111-1111-1111-1111-111111111111';
    const adminId = '22222222-2222-2222-2222-222222222222';
    const residentId = '33333333-3333-3333-3333-333333333333';
    const securityId = '44444444-4444-4444-4444-444444444444';

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Society
    await client.query(`
      INSERT INTO societies (id, name, address, city, state, pincode, total_units)
      VALUES ($1, 'Green Valley Apartments', '123 MG Road, Hitech City', 'Hyderabad', 'Telangana', '500081', 200)
      ON CONFLICT (id) DO NOTHING
    `, [societyId]);

    // Admin
    await client.query(`
      INSERT INTO users (id, society_id, name, email, password, phone, role, flat_number, block)
      VALUES ($1, $2, 'Deepika Admin', 'admin@greenvalley.com', $3, '9876543210', 'admin', 'A-101', 'A')
      ON CONFLICT (email) DO NOTHING
    `, [adminId, societyId, hashedPassword]);

    // Resident
    await client.query(`
      INSERT INTO users (id, society_id, name, email, password, phone, role, flat_number, block)
      VALUES ($1, $2, 'Rahul Sharma', 'rahul@greenvalley.com', $3, '9876543211', 'resident', 'B-205', 'B')
      ON CONFLICT (email) DO NOTHING
    `, [residentId, societyId, hashedPassword]);

    // Security
    await client.query(`
      INSERT INTO users (id, society_id, name, email, password, phone, role)
      VALUES ($1, $2, 'Ramesh Guard', 'security@greenvalley.com', $3, '9876543212', 'security')
      ON CONFLICT (email) DO NOTHING
    `, [securityId, societyId, hashedPassword]);

    // Amenities
    const amenities = [
      ['Clubhouse', 'Multi-purpose hall for events and gatherings', 'Block A Ground Floor', 50, true, '08:00', '22:00', 500],
      ['Swimming Pool', 'Olympic-size swimming pool', 'Near Block C', 30, true, '06:00', '20:00', 200],
      ['Gym', 'Fully equipped fitness center', 'Block A First Floor', 20, false, '05:00', '23:00', 0],
      ['Tennis Court', 'Professional tennis court', 'Sports Complex', 4, true, '06:00', '21:00', 300],
      ['Community Hall', 'Large hall for community events', 'Main Gate Area', 200, true, '09:00', '23:00', 2000],
    ];
    for (const [name, desc, loc, cap, req, open, close, charge] of amenities) {
      await client.query(`
        INSERT INTO amenities (society_id, name, description, location, capacity, booking_required, open_time, close_time, charge_per_hour)
        SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
        WHERE NOT EXISTS (SELECT 1 FROM amenities WHERE society_id = $1 AND name = $2)
      `, [societyId, name, desc, loc, cap, req, open, close, charge]);
    }

    // Emergency Contacts
    const contacts = [
      ['Hyderabad Police', '100', 'police'],
      ['Fire Department', '101', 'fire'],
      ['Ambulance', '108', 'ambulance'],
      ['Apollo Hospital', '04023607777', 'hospital'],
      ['Society Office', '04023456789', 'society_office'],
    ];
    for (const [name, phone, type] of contacts) {
      await client.query(`
        INSERT INTO emergency_contacts (society_id, name, phone, service_type)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (SELECT 1 FROM emergency_contacts WHERE society_id = $1 AND name = $2)
      `, [societyId, name, phone, type]);
    }

    // Sample Notice
    await client.query(`
      INSERT INTO notices (society_id, author_id, title, content, category, priority, is_pinned)
      SELECT $1, $2, 'Welcome to Green Valley Apartments', 'Welcome to our society management platform. Use this app to manage visitors, book amenities, raise complaints, and stay updated with society news.', 'general', 'important', true
      WHERE NOT EXISTS (SELECT 1 FROM notices WHERE society_id = $1 AND title = 'Welcome to Green Valley Apartments')
    `, [societyId, adminId]);

    console.log('✅ Demo data seeded successfully');
    console.log('\n📋 Demo Login Credentials:');
    console.log('  Admin:    admin@greenvalley.com / password123');
    console.log('  Resident: rahul@greenvalley.com / password123');
    console.log('  Security: security@greenvalley.com / password123');

  } catch (err) {
    console.error('❌ Database init failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initDB();
