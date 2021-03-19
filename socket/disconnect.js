
module.exports = socketUpdate = (socket) => socket.on('disconnecting', (reason) => {

    global.socketUsers = global.socketUsers.filter(e => e.socketId != socket.id)
    console.log('\x1b[31m', 'disconnected =>', socket.id, reason, '\x1b[0m')



});