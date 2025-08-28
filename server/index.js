const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const socketIo = require('socket.io');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123!';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// JWT middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('JWT required'));
  try {
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error('invalid JWT'));
  }
});

io.on('connection', (socket) => {
  socket.on('signal', ({ to, data }) => {
    io.to(to).emit('signal', { from: socket.id, data });
  });

  socket.emit('id', socket.id);

  socket.on('disconnect', () => { /* cleanup */ });
});

server.listen(3001, () => console.log('Signaling server running on port 3001'));
