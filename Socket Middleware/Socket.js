
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


        socket.on('login', async (data) => {
            if (data) {
                const { _id } = await jwt.verify(data, KEY)
                UserDetails = await UserData.findOne({ googleId: _id })
                if (UserDetails) {

                    await AddUser(UserDetails.fname + " " + UserDetails.lname, socket.id, _id, UserDetails.url, UserDetails._id.valueOf())
                    //now get already exit user and remove this
                    const isAlreadyExits = onlineUser.some((item) => item.mongoId === UserDetails._id.valueOf())
                    if (isAlreadyExits) {
                        //remove all ready exits user and enter new with new socket.id
                        const filterUsers = onlineUser.filter((value) => value.mongoId !== UserDetails._id.valueOf())
                        onlineUser.length = 0
                        onlineUser.push(...filterUsers, { name: UserDetails.fname + " " + UserDetails.lname, socketId: socket.id, adminId: _id, url: UserDetails.url, mongoId: UserDetails._id.valueOf() })

                    }
                    else {
                        onlineUser.push({ name: UserDetails.fname + " " + UserDetails.lname, socketId: socket.id, adminId: _id, url: UserDetails.url, mongoId: UserDetails._id.valueOf() })

                    }
                    io.emit("onlineUsers", onlineUser)
                    console.log({ onlineUser })
                }
            }
        })


        socket.on("likeCount", (data) => {
            io.emit("getLikeCount", data)
        })

        socket.on("commentLength", (data) => {
            io.emit("getCommentLength", data)
        })
        socket.on("sendComment", (data) => {
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


            const { url, fname, lname } = await UserData.findOne({ googleId: message.senderId })
            const getUser12 = await getUserById(message.receiverId)
            io.to(getUser12?.socketId).emit("getMessageNotification", {
                name: fname + " " + lname,
                url: url,
                read: false,
                anotherUserId: message.senderId,
                type: "chat"
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
            socket.emit("get_posts", data)
        })

        socket.on("sendNotificationAllType", async (data) => {
            const { comment, commentBy, replyParentId } = data
            const { userId, image } = await TextPost.findOne({ post_id: comment.post_id })
            const getUser = getUserById(userId)
            if (commentBy && comment) {
                const commentByUser = await UserData.findOne({ googleId: commentBy })
                const { userId, image } = await TextPost.findOne({ post_id: comment.post_id })
                const { fname, lname, url } = await UserData.findOne({ googleId: userId })
                if (replyParentId === "") {
                    //someone comment on you post
                    const sendNotificationAll = {
                        name: comment.username,
                        UserProfile: commentByUser.url,
                        postId: comment.post_id,
                        postImagePath: image,
                        post_url: "/user/single/post?post=" + comment.post_id + `&&auther=${fname + " " + lname}`,
                        docIdCommentByUserId: commentByUser._id,
                        type: "comment",
                        commentParentId: comment.parentId,
                        commentId: comment.uuid,
                        time: comment.createdAt,
                        body: comment.body,
                        read: false,
                        notification_id: Math.random().toString(36).substring(2, 20) + Math.random().toString(36).substring(2, 20)
                    }
                    io.to(getUser?.socketId).emit("getNotificationAllType", sendNotificationAll)
                }
                else {
                    //someone reply on your post
                    if (replyParentId !== commentBy) {
                        const sendNotificationData = {
                            name: comment.username,
                            UserProfile: commentByUser.url,
                            postId: comment.post_id,
                            postImagePath: image,
                            post_url: "/user/single/post?post=" + comment.post_id + `&&auther=${fname + " " + lname}`,
                            docIdCommentByUserId: commentByUser._id,
                            type: "reply",
                            commentParentId: comment.parentId,
                            commentId: comment.uuid,
                            time: comment.createdAt,
                            body: comment.body,
                            read: false,
                            notification_id: Math.random().toString(36).substring(2, 20) + Math.random().toString(36).substring(2, 20)
                        }
                        io.to(getUser?.socketId).emit("getNotificationAllType", sendNotificationData)
                    }
                }
            }
        })

        //get the friend rquest from user
        socket.on("sendFriendRequest", async (data) => {
            //friends request notification main proble yh hai ki jab user send krega tou notification chlaa jayega but cancle krega tou jise bheja hai use ptaa chl jyega ki esne mujhe friends request bheji thi

            // const { url } = await UserData.findOne({ googleId: data.currentUser })
            // const getUser = await getUserById(data.anotherUserId)
            // io.to(getUser?.socketId).emit("getFriendRequest", { name: data.senderName, url: url, _id: data.currentUser })
        })
        //checl user online or not
        socket.on("isUserOnline", async (data) => {
            const { friendId, currentUser } = data
            if (currentUser && friendId) {
                const getUser = await getUserById(friendId)
                const currentUserId = await getUserById(currentUser)

                io.to(currentUserId?.socketId).emit("isOnline", {
                    friendId,
                    status: getUser ? true : false
                })

            }
        })
        socket.on("deleteMessage", async (data) => {
            const getUser = await getUserById(data.friendId)
            io.to(getUser?.socketId).emit("deleteMessage", data)
        })

        socket.on("logout", async (id) => {
            const value = await removeUser(id)
            io.emit("onlineUsers", value)
        })
        socket.on("disconnect", async (data) => {
            console.log("disconnected")
            socket.broadcast.emit("callended")
            const value = await removeUser(data)
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
