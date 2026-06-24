import { io, Socket } from 'socket.io-client';

// Connect directly to the backend port (3001) instead of using the Vite proxy
// This avoids "WebSocket connection failed" errors common in development
const SOCKET_URL = 'http://localhost:3001';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
  auth: (cb) => {
    cb({ token: localStorage.getItem('token') });
  }
});
