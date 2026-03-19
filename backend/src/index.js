const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'] }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/society', require('./routes/society'));

// Serve static frontend in production
const staticDir = path.join(__dirname, '../static');
const fs = require('fs');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(staticDir, 'index.html'));
    }
  });
}

// Socket.IO — Real-time notifications
const pool = require('./db/pool');

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('join-society', ({ userId, societyId }) => {
    socket.join(`society:${societyId}`);
    socket.join(`user:${userId}`);
    socket.userId = userId;
    socket.societyId = societyId;
  });

  // Visitor notification
  socket.on('visitor-alert', async (data) => {
    const { societyId, residentId, visitorName, type } = data;
    io.to(`user:${residentId}`).emit('visitor-notification', {
      visitorName,
      type,
      timestamp: Date.now(),
    });
    // Store notification in DB
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, society_id, title, message, type)
         VALUES ($1, $2, $3, $4, 'visitor')`,
        [residentId, societyId, `Visitor: ${visitorName}`, `${visitorName} (${type}) is at the gate`]
      );
    } catch (e) { console.error('Notification store error:', e.message); }
  });

  // Emergency broadcast
  socket.on('emergency-broadcast', (data) => {
    if (socket.societyId) {
      io.to(`society:${socket.societyId}`).emit('emergency-alert', {
        ...data,
        timestamp: Date.now(),
      });
    }
  });

  // Notice broadcast
  socket.on('new-notice', (data) => {
    if (socket.societyId) {
      io.to(`society:${socket.societyId}`).emit('notice-published', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🏠 MyGate Society Management Server`);
  console.log(`   API:    http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Env:    ${process.env.NODE_ENV || 'development'}\n`);
});
