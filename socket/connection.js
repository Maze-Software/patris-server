const jwt = require('jsonwebtoken');
const config = require('../config.json');


async function MaxConnectionHandler(socket, user, socketId) {
    global.socketUsers.push({ socketId: socketId, adminEmail: user.email, userId: user.userId });
    let currentConnection = global.socketUsers.filter(e => e.userId == user.userId).length
    if (currentConnection > config.maxClient && user.email != "test@test.com") {
        socket.emit("maxConnectionExceed", { message: true })
        socket.disconnect();
        global.socketUsers = global.socketUsers.filter(e => e.socketId != socket.id)
    }

}



module.exports = socketUpdate = (socket) => {
    if (socket.handshake.query.token) {
        const token = socket.handshake.query.token.replace(/['"]+/g, '');
        const user = jwt.verify(token, config.privateKey);
        if (user.type == 'user') {
            MaxConnectionHandler(socket, user, socket.id)
            // logic here

        }
        console.log('\x1b[32m', 'user connected =>', socket.id, '\x1b[0m')
    }
    else {
        console.log("1", socket.handshake.query.token)

    }
    //            global.SOCKET_STATE = socket

}

