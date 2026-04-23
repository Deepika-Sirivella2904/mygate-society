/**
 * MyGate Society Management — API Test Suite
 * Tests all API endpoints without requiring a database connection.
 * Uses HTTP requests to test the running server.
 */

const http = require('http');

const BASE = process.env.TEST_URL || 'http://localhost:5000';
let passed = 0;
let failed = 0;
let token = '';
let adminToken = '';
let residentToken = '';

function request(method, path, body = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🏠 MyGate Society Management — Test Suite\n');
  console.log('='.repeat(50));

  // ── Health Check ──
  console.log('\n📋 Health Check');
  try {
    const res = await request('GET', '/api/health');
    assert(res.status === 200, 'Health endpoint returns 200');
    assert(res.data.status === 'ok', 'Status is "ok"');
    assert(typeof res.data.uptime === 'number', 'Uptime is a number');
  } catch (e) {
    assert(false, 'Health endpoint reachable');
    console.log('  ⚠️  Server may not be running. Start with: npm start');
    process.exit(1);
  }

  // ── Auth: Login ──
  console.log('\n📋 Authentication');
  {
    const res = await request('POST', '/api/auth/login', { email: 'admin@greenvalley.com', password: 'password123' });
    assert(res.status === 200, 'Admin login succeeds');
    assert(res.data.token, 'Returns JWT token');
    assert(res.data.user.role === 'admin', 'User role is admin');
    adminToken = res.data.token;
  }
  {
    const res = await request('POST', '/api/auth/login', { email: 'rahul@greenvalley.com', password: 'password123' });
    assert(res.status === 200, 'Resident login succeeds');
    assert(res.data.user.role === 'resident', 'User role is resident');
    residentToken = res.data.token;
  }
  {
    const res = await request('POST', '/api/auth/login', { email: 'security@greenvalley.com', password: 'password123' });
    assert(res.status === 200, 'Security login succeeds');
    assert(res.data.user.role === 'security', 'User role is security');
  }
  {
    const res = await request('POST', '/api/auth/login', { email: 'wrong@email.com', password: 'wrong' });
    assert(res.status === 401, 'Invalid credentials returns 401');
  }
  {
    const res = await request('POST', '/api/auth/login', {});
    assert(res.status === 400, 'Missing fields returns 400');
  }

  // ── Auth: Profile ──
  console.log('\n📋 Profile');
  {
    const res = await request('GET', '/api/auth/me', null, adminToken);
    assert(res.status === 200, 'GET /me returns user');
    assert(res.data.user.email === 'admin@greenvalley.com', 'Correct user returned');
  }
  {
    const res = await request('GET', '/api/auth/me');
    assert(res.status === 401, 'No token returns 401');
  }

  // ── Society ──
  console.log('\n📋 Society');
  {
    const res = await request('GET', '/api/society', null, adminToken);
    assert(res.status === 200, 'Get society info');
    assert(res.data.society.name === 'Green Valley Apartments', 'Society name correct');
  }
  {
    const res = await request('GET', '/api/society/residents', null, adminToken);
    assert(res.status === 200, 'List residents');
    assert(Array.isArray(res.data.residents), 'Returns array');
    assert(res.data.residents.length >= 3, 'Has seeded users');
  }
  {
    const res = await request('GET', '/api/society/dashboard', null, adminToken);
    assert(res.status === 200, 'Dashboard data loads');
    assert(res.data.dashboard.users, 'Has user stats');
  }

  // ── Visitors ──
  console.log('\n📋 Visitors');
  let visitorId;
  {
    const res = await request('POST', '/api/visitors', {
      visitor_name: 'Test Visitor', visitor_phone: '9999999999', visitor_type: 'guest', purpose: 'Testing'
    }, residentToken);
    assert(res.status === 201, 'Create visitor');
    assert(res.data.visitor.gate_pass_code, 'Gate pass generated');
    assert(res.data.visitor.is_preapproved === true, 'Pre-approved');
    visitorId = res.data.visitor.id;
  }
  {
    const res = await request('GET', '/api/visitors', null, residentToken);
    assert(res.status === 200, 'List visitors');
    assert(Array.isArray(res.data.visitors), 'Returns array');
  }
  {
    const res = await request('GET', '/api/visitors?status=approved', null, residentToken);
    assert(res.status === 200, 'Filter by status');
  }
  {
    const res = await request('POST', '/api/visitors', { visitor_name: '' }, residentToken);
    assert(res.status === 400, 'Empty name returns 400');
  }

  // ── Amenities ──
  console.log('\n📋 Amenities');
  let amenityId;
  {
    const res = await request('GET', '/api/amenities', null, residentToken);
    assert(res.status === 200, 'List amenities');
    assert(res.data.amenities.length >= 5, 'Has seeded amenities');
    amenityId = res.data.amenities[0].id;
  }
  {
    const res = await request('POST', '/api/amenities', { name: 'Test Court' }, adminToken);
    assert(res.status === 201, 'Admin creates amenity');
  }
  {
    const res = await request('POST', '/api/amenities', { name: 'Fail' }, residentToken);
    assert(res.status === 403, 'Resident cannot create amenity');
  }
  {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const res = await request('POST', `/api/amenities/${amenityId}/book`, {
      booking_date: tomorrow, start_time: '10:00', end_time: '11:00'
    }, residentToken);
    assert(res.status === 201, 'Book amenity');
  }

  // ── Complaints ──
  console.log('\n📋 Complaints');
  let complaintId;
  {
    const res = await request('POST', '/api/complaints', {
      title: 'Test Complaint', description: 'Water leak in bathroom', category: 'plumbing', priority: 'high'
    }, residentToken);
    assert(res.status === 201, 'Create complaint');
    complaintId = res.data.complaint.id;
  }
  {
    const res = await request('GET', '/api/complaints', null, residentToken);
    assert(res.status === 200, 'List complaints');
    assert(Array.isArray(res.data.complaints), 'Returns array');
  }
  {
    const res = await request('PUT', `/api/complaints/${complaintId}`, { status: 'in_progress' }, adminToken);
    assert(res.status === 200, 'Admin updates status');
    assert(res.data.complaint.status === 'in_progress', 'Status updated');
  }
  {
    const res = await request('PUT', `/api/complaints/${complaintId}`, { status: 'resolved', resolution_notes: 'Fixed the leak' }, adminToken);
    assert(res.status === 200, 'Resolve complaint');
  }

  // ── Notices ──
  console.log('\n📋 Notices');
  let noticeId;
  {
    const res = await request('POST', '/api/notices', {
      title: 'Test Notice', content: 'This is a test notice', category: 'general'
    }, adminToken);
    assert(res.status === 201, 'Admin creates notice');
    noticeId = res.data.notice.id;
  }
  {
    const res = await request('GET', '/api/notices', null, residentToken);
    assert(res.status === 200, 'List notices');
    assert(res.data.notices.length >= 1, 'Has notices');
  }
  {
    const res = await request('POST', '/api/notices', { title: 'Fail', content: 'Fail' }, residentToken);
    assert(res.status === 403, 'Resident cannot post notice');
  }
  {
    const res = await request('DELETE', `/api/notices/${noticeId}`, null, adminToken);
    assert(res.status === 200, 'Admin deletes notice');
  }

  // ── Staff ──
  console.log('\n📋 Staff');
  let staffId;
  {
    const res = await request('POST', '/api/staff', { name: 'Test Maid', phone: '8888888888', staff_type: 'maid' }, adminToken);
    assert(res.status === 201, 'Admin registers staff');
    staffId = res.data.staff.id;
  }
  {
    const res = await request('GET', '/api/staff', null, residentToken);
    assert(res.status === 200, 'List staff');
    assert(res.data.staff.length >= 1, 'Has staff');
  }
  {
    const res = await request('POST', `/api/staff/${staffId}/assign`, {}, residentToken);
    assert(res.status === 201, 'Resident assigns staff');
  }

  // ── Bills ──
  console.log('\n📋 Bills');
  {
    const residentList = await request('GET', '/api/society/residents', null, adminToken);
    const residentUser = residentList.data.residents.find(r => r.role === 'resident');
    const res = await request('POST', '/api/bills', {
      resident_id: residentUser.id, title: 'Monthly Maintenance', amount: 5000, bill_type: 'maintenance',
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    }, adminToken);
    assert(res.status === 201, 'Admin creates bill');
  }
  {
    const res = await request('GET', '/api/bills', null, residentToken);
    assert(res.status === 200, 'Resident views bills');
    assert(Array.isArray(res.data.bills), 'Returns array');
  }

  // ── Emergency Contacts ──
  console.log('\n📋 Emergency Contacts');
  let contactId;
  {
    const res = await request('POST', '/api/emergency', {
      name: 'Test Hospital', phone: '112', service_type: 'hospital'
    }, adminToken);
    assert(res.status === 201, 'Admin adds emergency contact');
    contactId = res.data.contact.id;
  }
  {
    const res = await request('GET', '/api/emergency', null, residentToken);
    assert(res.status === 200, 'List emergency contacts');
    assert(res.data.contacts.length >= 5, 'Has seeded contacts');
  }
  {
    const res = await request('DELETE', `/api/emergency/${contactId}`, null, adminToken);
    assert(res.status === 200, 'Admin deletes contact');
  }

  // ── Vehicles ──
  console.log('\n📋 Vehicles');
  let vehicleId;
  {
    const res = await request('POST', '/api/vehicles', {
      vehicle_number: 'TS09AB1234', vehicle_type: 'car', make: 'Hyundai', model: 'Creta'
    }, residentToken);
    assert(res.status === 201, 'Register vehicle');
    vehicleId = res.data.vehicle.id;
  }
  {
    const res = await request('GET', '/api/vehicles', null, residentToken);
    assert(res.status === 200, 'List vehicles');
    assert(res.data.vehicles.length >= 1, 'Has vehicles');
  }
  {
    const res = await request('DELETE', `/api/vehicles/${vehicleId}`, null, residentToken);
    assert(res.status === 200, 'Remove vehicle');
  }

  // ── Notifications ──
  console.log('\n📋 Notifications');
  {
    const res = await request('GET', '/api/notifications', null, residentToken);
    assert(res.status === 200, 'List notifications');
  }
  {
    const res = await request('GET', '/api/notifications/unread-count', null, residentToken);
    assert(res.status === 200, 'Unread count');
    assert(typeof res.data.count === 'number', 'Count is number');
  }
  {
    const res = await request('PUT', '/api/notifications/read-all', null, residentToken);
    assert(res.status === 200, 'Mark all read');
  }

  // ── Authorization ──
  console.log('\n📋 Authorization / Security');
  {
    const res = await request('GET', '/api/society/dashboard', null, residentToken);
    assert(res.status === 403, 'Resident cannot access admin dashboard');
  }
  {
    const res = await request('POST', '/api/staff', { name: 'X', staff_type: 'maid' }, residentToken);
    assert(res.status === 403, 'Resident cannot register staff');
  }
  {
    const res = await request('POST', '/api/bills', { title: 'X', amount: 1, bill_type: 'other', due_date: '2026-12-31', resident_id: 'fake' }, residentToken);
    assert(res.status === 403, 'Resident cannot create bills');
  }

  // ── Summary ──
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(failed === 0 ? '✅ All tests passed!' : `❌ ${failed} test(s) failed`);
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
