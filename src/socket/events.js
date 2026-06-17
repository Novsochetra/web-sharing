const { loadData } = require('../utils/files');

function register(io) {
  io.on('connection', (socket) => {
    socket.emit('items-updated', loadData().items);
    socket.broadcast.emit('user-connected');

    socket.on('disconnect', () => {
      socket.broadcast.emit('user-disconnected');
    });
  });
}

module.exports = { register };
