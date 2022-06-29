
const jwt = require('jsonwebtoken');
const KEY = process.env.SECRET_KEY
const GoogleDB = require("../db/googledb");
const UserData = require("../db/UserData")
const express = require('express');
const router = express.Router();
const onlineUsers = require("../db/OnlineUser");
const TextPost = require("../db/TextPost")
const { cloudinary } = require("../Cloudnary/cloudnary");



let onlineUser = []
let AddUser = (username, socketId, adminId, profilePic, mongoId) => {
    !onlineUser.some((item) => { item.username === username }) && onlineUser.push({ username, socketId, adminId, profilePic, mongoId })
}
const removeUser = async (socketId) => {
    const value = onlineUser.filter((item) => {
        return item.socketId !== socketId
    })
    return value
}

const removeUserById = (id) => {
    const value = onlineUser.filter((item) => {
        return item.adminId !== id
    })
    return value
}

const getUser = (username) => {
    return onlineUser.find((item) => {
        return item.username === username
    })
}

const getUserById = (adminId) => {
    return onlineUser.find((item) => {
        return item.adminId === adminId
    })
}


let UserDetails;
module.exports = (io, req, res) => {

    io.on('connection', (socket) => {

        // const Token = socket.handshake.auth.token
        // if (Token) {

        console.log("someoe is connected")

        //now get the query hanshshaking query
        // console.log(socket.handshake.query)
        // console.log(socket.handshake.headers)
        // console.log(socket.handshake.custome_header)
        // console.log(socket.handshake.auth)


        socket.on('login', async (data) => {
            if (data) {
                const { _id } = await jwt.verify(data, KEY)
                UserDetails = await UserData.findOne({ googleId: _id })
                if (UserDetails) {

                    await AddUser(UserDetails.fname + " " + UserDetails.lname, socket.id, _id, UserDetails.url, UserDetails._id.valueOf())
                    io.emit("onlineUsers", onlineUser)
                }
            }
        })
        socket.on("likeCount", (data) => {
            // console.
            io.emit("getLikeCount", data)
        })

        socket.on("commentLength", (data) => {
            io.emit("getCommentLength", data)

        })
        socket.on("sendComment", (data) => {
            console.log({ data })
            io.emit("getComments", data)
        })
        socket.on('sendMessage', async (message) => {
            const getUser = await getUserById(message.receiverId)
            io.to(getUser?.socketId).emit("getMessage", {

                senderId: message.senderId,
                message: message.message,
                time: message.time,
                type: message.type,
                messageID: message.MessageId

            })

        })
        socket.on('sendGroupMessage', async (message) => {
            const getUser = await getUserById(message.receiverId)
            io.to(getUser?.socketId).emit("getGroupMessage", {
                name: message.name,

                userId: message.userId,
                message: message.message,
                time: message.time,
                type: message.type,
                messageId: message.messageId,
                roomId: message.roomId,
                url: message.url

            })

        })

        socket.on("typing", (m) => {
            // console.log("satrt typing")
            // console.log(m)
            const getUser = getUserById(m.id)
            io.to(getUser?.socketId).emit("display", m)

        })
        // socket.on("callUser",({userToCall, signalData, from,name})=>{
        //     console.log({userToCall, signalData, from,name})
        //     io.to(userToCall).emit("callUser",{
        //         signal:signalData,
        //         from,name
        //     })
        // })
        socket.on("callUser", async (data) => {
            const findUser = await getUserById(data.anotherUserId)
            io.to(findUser?.socketId).emit("sendRing", data)
        })
        socket.on("answerCall", (data) => {
            io.to(data.to).emit("callAccepted", data.signal)
        })

        //now get the post 
        socket.on("Send_Posts", (data) => {
            // console.log("posts")
            console.log(data)
            socket.emit("get_posts", data)
        })
        socket.on("logout", async (id) => {
            const value = await removeUser(id)
            // console.log({ value })
            io.emit("onlineUsers", value)
        })
        socket.on("disconnect", async (data) => {
            console.log("disconnected")
            socket.broadcast.emit("callended")
            const value = await removeUser(data)
            // console.log({ value })
            io.emit("onlineUsers", value)
        })
        // }
    })



}


function getDifference(array1, array2) {
    return array1.filter(object1 => {
        return !array2.some(object2 => {
            return (object1.anotherUserId === object2.adminId) || (object1.currentUser === object2.adminId);
        });
    });
}
