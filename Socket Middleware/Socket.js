
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
const removeUser = async (socketId) => {
    return onlineUser.filter((item) => {
        return item.socketId !== socketId
    })

}

const getUser = (username) => {
    return onlineUser.find((item) => {
        return item.username === username
    })
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


                        console.log({ onlineUser })
                        //check user is exit in friends list of admin
                        const adminInfo = await UserData.findOne({ googleId: _id })


                        const friends = adminInfo.friends !== undefined && adminInfo.friends
                        const value = await getDifference(friends, onlineUser)


                        socket.emit("online", { data: onlineUser })



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


function getDifference(array1, array2) {
    return array1.filter(object1 => {
        return !array2.some(object2 => {
            return (object1.anotherUserId === object2.adminId) || (object1.currentUser === object2.adminId);
        });
    });
}


