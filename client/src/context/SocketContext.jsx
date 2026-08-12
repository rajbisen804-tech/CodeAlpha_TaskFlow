import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const newToast = { id, type: 'info', duration: 4000, ...toast };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Connect to Socket.IO backend
      const socket = io('/', {
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        // Join personal user room
        socket.emit('join_user', user.id);
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

      // Global live push notifications for this user
      socket.on('notification_created', (notification) => {
        addToast({
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
        });
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
    }
  }, [isAuthenticated, user?.id, addToast]);

  const joinProject = useCallback((projectId) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('join_project', projectId);
    }
  }, []);

  const leaveProject = useCallback((projectId) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('leave_project', projectId);
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        joinProject,
        leaveProject,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
