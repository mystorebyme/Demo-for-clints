const { Server } = require('socket.io');
const env = require('../config/env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.FRONTEND_ORIGIN } });
  io.on('connection', (socket) => {
    socket.on('join', (orderId) => {
      if (typeof orderId === 'string' && /^ORD[A-Z0-9]{10,40}$/.test(orderId)) {
        socket.join(orderId);
      }
    });
  });
  return io;
}

function emitToOrder(orderId, event, payload) {
  if (io) io.to(orderId).emit(event, payload);
}

module.exports = { initSocket, emitToOrder };
