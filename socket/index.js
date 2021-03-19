
const SocketInit = (server) => {

    const io = require('socket.io')(server);
    global.SOCKET_STATE = io;
    io.on('connection', socket => {
        require('./connection')(socket);
        require('./disconnect')(socket);

        // socket.on('disconnecting', (reason) => {
        //     console.log('disconnect')
        // });


        // SOCKET EVENTS END




    });
}
module.exports = SocketInit;