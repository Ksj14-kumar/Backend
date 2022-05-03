// const socketUserMethods = require('./UserMessages');

const io = require('socket.io')(
    5355, {
    cors: {
        origin: 'http://localhost:3000'
    }
}

);


let onlineMessageUsers = []
AddNewMessageUser = (socketId, userId) => {
    !onlineMessageUsers.some(user => user.userId === userId) && onlineMessageUsers.push({ userId, socketId })
}

RemoveMessageUser = (socketId) => {
    onlineMessageUsers.filter(item => item.socketId !== socketId)

}


getUser = (userId) => {
    return onlineMessageUsers.find(user => user.userId === userId)
}



io.on('connection', (socket) => {




    console.log('a user connected');

    //realtime messages system

    //add user when user connect
    socket.on("addNewMessageUser", (data) => {
        // io.emit("message", { data: onlineMessageUsers })
        AddNewMessageUser(socket.id, data)

    })


    //send and get message
    socket.on("sendMessage", (data) => {
        console.log({ data })

        const user = getUser(data.receiverId)
        io.to(user?.socketId).emit("getMessage", {
            senderId: data.senderId,
            text: data.text
        })
    })

    socket.on('disconnect', () => {
        RemoveMessageUser(socket.id)
        // io.emit("message", { data: onlineMessageUsers })

        console.log('user disconnected');
    });
})



