// Chạy lệnh: node server.js để phát Server LAN nội bộ qua địa chỉ IP Wi-Fi (VD: http://192.168.1.15:3000)
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('join-room', (roomCode) => {
      socket.join(roomCode);
      socket.to(roomCode).emit('player-joined', { id: socket.id });
    });
    socket.on('game-packet', ({ roomCode, packet }) => {
      socket.to(roomCode).emit('game-packet', packet);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`> CyberCaro 3D LAN Server ready on http://0.0.0.0:${PORT}`);
  });
});
