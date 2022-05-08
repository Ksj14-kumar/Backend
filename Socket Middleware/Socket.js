
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


let AddUser = (username, socketId, adminId, profilePic) => {
    !onlineUser.some((item) => { item.username === username }) && onlineUser.push({ username, socketId, adminId, profilePic })
}
const removeUser = async (socketId) => {
    return onlineUser.filter((item) => {
        return item.socketId !== socketId
    })

}

const removeUserById = (id) => {
    return onlineUser.filter((item) => {
        return item.adminId !== id
    })
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



module.exports = (io, req, res) => {

    function Load(req, res) {
        io.on("connection", async (socket) => {


            socket.on("newUser", async (data) => {


                if (data) {

                    // // add new user jo like krta hai
                    const { _id } = await jwt.verify(data, KEY)
                    if (await UserData.findOne({ googleId: _id }) !== null) {
                        const { fname, lname, url, googleId } = await UserData.findOne({ googleId: _id })

                        const getUser = await getUserById(googleId)
                        if (getUser) {
                            io.emit("online", { data: onlineUser })
                            socket.emit("userExist", {
                                msg: "user already exist"
                            })
                        }
                        else {


                            AddUser(fname + " " + lname, socket.id, googleId, url)
                            io.emit("online", { data: onlineUser })
                            // console.log({ onlineUser })
                            //check user is exit in friends list of admin
                            const adminInfo = await UserData.findOne({ googleId: _id })


                            const friends = adminInfo.friends !== undefined && adminInfo.friends
                            const value = await getDifference(friends, onlineUser)





                            socket.on("like", async (data) => {
                                // console.log({ data })

                                const { likedBy, post_id, likeTo, type, bg, profile } = data
                                const likeToValue = await UserData.findOne({ googleId: likeTo })
                                const { fname, lname } = likeToValue
                                const sender = await UserData.findOne({ googleId: likedBy })
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
                        }
                        // socket.broadcast.to(socket.id).emit("he1", { name: socket.id })
                        // console.log("connected from index.js")
                    }





                    socket.on("cancleRequest", async (data) => {
                        // console.log({ data })
                        const { senderName, recieverName, userId, currentUser, anotherUserId, message, senderUrl, receiverUrl } = data

                        const senderUpdate = await UserData.findOneAndUpdate({ googleId: currentUser }, { $pull: { senderrequest: { anotherUserId: anotherUserId } } }, { new: true })
                        const recieverUpdate = await UserData.findOneAndUpdate({ googleId: anotherUserId }, { $pull: { receiverrequest: { currentUser: currentUser } } }, { new: true })
                        // console.log({ senderUpdate })
                        // console.log({ recieverUpdate })
                        socket.emit("cancle", {
                            message: "cancle request"
                        })

                    })

                }

                socket.on("logout", async (data) => {
                    console.log("disconnect connection")
                    console.log({ data })
                    try {
                        // removeUser(socket.id)
                        if (data) {
                            const VerifyToken = await jwt.verify(data.uuid, KEY)
                            const { _id } = VerifyToken
                            await removeUserById(_id)
                            io.emit("online", { data: onlineUser })
                            
                        }
                        io.emit("online", { data: onlineUser })

                    } catch (err) {
                        console.log(err)

                    }
                })

                socket.on("disconnect", async (data) => {
                    // const VerifyToken = await jwt.verify(data.uuid, KEY)
                    // console.log({ VerifyToken })
                    // const { _id } = VerifyToken
                    // removeUserById(_id)
                    removeUser(socket.id)
                    io.emit("online", { data: onlineUser })
                    // console.log("someone is disconnected")


                })
            }
            )
        })
        // console.log(onlineUser)

    }
    Load()

}


function getDifference(array1, array2) {
    return array1.filter(object1 => {
        return !array2.some(object2 => {
            return (object1.anotherUserId === object2.adminId) || (object1.currentUser === object2.adminId);
        });
    });
}


