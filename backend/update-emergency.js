const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'B9HRqAwZ',
  host: 'localhost',
  port: 5432,
  database: 'mygate_society'
});

async function updateEmergencyContacts() {
  const client = await pool.connect();
  try {
    await client.query('UPDATE emergency_contacts SET name = $1 WHERE name = $2', ['Police', 'Hyderabad Police']);
    console.log('Emergency contacts updated successfully');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
  }
  await pool.end();
}

updateEmergencyContacts();
