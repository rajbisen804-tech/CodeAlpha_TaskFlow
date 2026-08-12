const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const db = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.IO configuration with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Initialize socket rooms and events
initSocket(io);

// Initialize DB and launch server
async function startServer() {
  try {
    await db.initDb();

    server.listen(PORT, () => {
      console.log('==================================================');
      console.log(`⚡ TaskFlow Pro Backend Server running on port ${PORT}`);
      console.log(`📡 WebSocket Gateway ready for live synchronization`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log('==================================================');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server, io };
