
const jwt = require('jsonwebtoken');
const KEY = process.env.SECRET_KEY
const GoogleDB = require("../db/googledb");
const Post = require("../db/UserData")
const express = require('express');
const router = express.Router();
const onlineUsers = require("../db/OnlineUser");
const TextPost = require("../db/TextPost")
const { cloudinary } = require("../Cloudnary/cloudnary");
const UserData = require('../db/UserData');

let onlineUser = []

let AddUser = (username, socketId, adminId, profilePic) => {
    !onlineUser.some((item) => { item.username === username }) && onlineUser.push({ username, socketId, adminId, profilePic })
}

let AddNewUserIntoDb = async (username, socketId, adminId, profilePic) => {
    const isExit = await onlineUsers.findOne({ socketId: socketId })

    if (isExit) {
        return
    }
    else {
        const newUser = new onlineUsers({
            name: username,
            socketId: socketId,
            adminId: adminId,
            profilePic: profilePic,

            time: new Date(Date.now())
        })
        await newUser.save()
    }
}


const removeUser = async (socketId) => {
    return onlineUser.filter((item) => {
        return item.socketId !== socketId
    })

}

let RemoveUserFromDbAfterDisconnect = async (socketId) => {
    await onlineUsers.findOneAndRemove({ socketId: socketId })

}


const getUser = (username) => {
    return onlineUser.find((item) => {
        return item.username === username
    })
}


const getUserFromDb = (username) => {
    return onlineUsers.findOne({ name: username })
}


module.exports = (io, req, res) => {

    function Load(req, res) {
        io.on("connection", async (socket) => {


            socket.on("newUser", async (data) => {

                console.log("someone is conencted")
                if (data) {

                    // // add new user jo like krta hai
                    const { _id } = await jwt.verify(data, KEY)
                    if (await Post.findOne({ googleId: _id }) !== null) {
                        const { fname, lname, url } = await Post.findOne({ googleId: _id })
                        AddUser(fname + " " + lname, socket.id, _id, url)

                        // AddNewUserIntoDb(fname + " " + lname, socket.id, _id, "")
                        console.log({ onlineUser })

                        socket.on("like", async (data) => {
                            console.log({ data })

                            const { likedBy, post_id, likeTo, type, bg, profile } = data
                            const likeToValue = await Post.findOne({ googleId: likeTo })
                            const { fname, lname } = likeToValue
                            const sender = await Post.findOne({ googleId: likedBy })
                            const receiver = await getUser(fname + " " + lname)
                            console.log({ onlineUser })

                            if (type === false) {
                                io.to(receiver?.socketId).emit("getNotification", {
                                    name: sender?.fname + " " + sender?.lname,
                                    postImageURL: bg,
                                    url: sender?.url,
                                    post_Id: post_id,
                                    likedBy,
                                    type: type
                                })
                            }
                        })
                        // socket.broadcast.to(socket.id).emit("he1", { name: socket.id })

                        socket.on("disconnect", async () => {
                            await removeUser(socket.id)
                            console.log("someone is disconnected")

                        })


                        // console.log("connected from index.js")

                    }



                }



                //ENABLE THE REALTIME FRIENDS REQUEST

                //send the friend request
                // socket.on("sendFriendRequest", async (data) => {
                //     const { senderName, recieverName, userId, currentUser, anotherUserId, message, senderUrl, receiverUrl } = data
                //     console.log({ data })

                //     if (currentUser === anotherUserId) {
                //         return
                //     }


                //     const isAlreadyExit = await UserData.findOne({ googleId: currentUser })
                //     console.log({ isAlreadyExit })
                //     if (isAlreadyExit.senderrequest.some((item) => item.anotherUserId === anotherUserId) === false) {

                //         const receiverUpdate = await UserData.findOneAndUpdate({ googleId: anotherUserId }, { $push: { receiverrequest: { name: senderName, currentUser: currentUser, message: message, url: senderUrl } } }, { new: true })

                //         const senderUpdate = await UserData.findOneAndUpdate({ googleId: currentUser }, { $push: { senderrequest: { name: recieverName, anotherUserId: anotherUserId, message: message, url: receiverUrl } } }, { new: true })
                //         console.log({ senderUpdate })
                //         console.log({ receiverUpdate })
                //         io.to(socket.id).emit("getNotification", {
                //             name: senderName,
                //             postImageURL: senderUrl,
                //             url: receiverUrl,
                //             type: "friendRequest"
                //         })

                //     }
                //     else {
                //         console.log("already exit")
                //     }

                //     socket.on("getReply", (message) => {
                //         console.log(message)

                //     })




                //     socket.emit("isAccepted", {
                //         message: "okay accepted"
                //     })
                // })



                socket.on("cancleRequest", async (data) => {
                    console.log({ data })
                    const { senderName, recieverName, userId, currentUser, anotherUserId, message, senderUrl, receiverUrl } = data

                    const senderUpdate = await UserData.findOneAndUpdate({ googleId: currentUser }, { $pull: { senderrequest: { anotherUserId: anotherUserId } } }, { new: true })
                    const recieverUpdate = await UserData.findOneAndUpdate({ googleId: anotherUserId }, { $pull: { receiverrequest: { currentUser: currentUser } } }, { new: true })
                    console.log({ senderUpdate })
                    console.log({ recieverUpdate })
                    socket.emit("cancle", {
                        message: "cancle request"
                    })

                })
            }
            )
        })
        console.log(onlineUser)

    }
    Load()

}