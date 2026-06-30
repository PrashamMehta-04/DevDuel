import { io, Socket } from 'socket.io-client';

// Connect to the current origin (handled by Vite proxy in dev, Nginx in prod)
const SOCKET_URL = '/';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
  auth: (cb) => {
    cb({ token: localStorage.getItem('token') });
  }
});
