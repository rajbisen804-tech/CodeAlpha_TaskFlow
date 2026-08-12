let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log(`🔌 Client connected: ${socket.id}`);

    // Join user's personal channel for notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        // console.log(`User ${userId} joined room user_${userId}`);
      }
    });

    // Join specific project channel for real-time Kanban & task updates
    socket.on('join_project', (projectId) => {
      if (projectId) {
        socket.join(`project_${projectId}`);
        // console.log(`Socket ${socket.id} joined project_${projectId}`);
      }
    });

    // Leave project channel
    socket.on('leave_project', (projectId) => {
      if (projectId) {
        socket.leave(`project_${projectId}`);
        // console.log(`Socket ${socket.id} left project_${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      // console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!ioInstance) {
    // Return dummy no-op if not initialized in testing
    return {
      to: () => ({
        emit: () => {}
      }),
      emit: () => {}
    };
  }
  return ioInstance;
}

function emitToProject(projectId, event, payload) {
  try {
    const io = getIO();
    io.to(`project_${projectId}`).emit(event, payload);
  } catch (err) {
    console.error('Socket emitToProject error:', err);
  }
}

function emitToUser(userId, event, payload) {
  try {
    const io = getIO();
    io.to(`user_${userId}`).emit(event, payload);
  } catch (err) {
    console.error('Socket emitToUser error:', err);
  }
}

function emitNotification(userId, notification) {
  emitToUser(userId, 'notification_created', notification);
}

module.exports = {
  initSocket,
  getIO,
  emitToProject,
  emitToUser,
  emitNotification
};
