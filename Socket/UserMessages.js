let onlineMessageUsers = []

exports.AddNewMessageUser = (socketId,userId) => {
    !onlineMessageUsers.some(user => user.userId === userId) && onlineMessageUsers.push({ userId, socketId })
}

exports.RemoveMessageUser = (socketId) => {
    onlineMessageUsers.filter(item => item.socketId !== socketId)

}

exports.Array = onlineMessageUsers