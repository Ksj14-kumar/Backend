const { cloudinary } = require("../Cloudnary/cloudnary");
const chatMessages = require('../db/ChatMessages');
const UserData = require("../db/UserData")
const Messages = require("../db/Message")
const Rooms = require("../db/Rooms");
const Message = require("../db/Message");


async function getUserDetails(id) {

    const value = await UserData.findOne({ googleId: id })
    return {
        url: value.url,
        name: value.fname + " " + value.lname
    }
}



exports.PostMessage = async (req, res) => {
    const { type, message, senderId, messageID, adminId, friend_id, base } = req.body
    try {
        let messageChange;
        console.log(req.body)

        // console.log()
        const msg = message.split("data:video/mp4;base64,")[1]

        // console.log(message)

        if (friend_id && adminId) {

            if (
                type === "image" || type === "video" || type === "text" || type === "GIF" || type === "audio"
            ) {
                if (type === "image" || type === "video" || type === "audio") {


                    const Url = await cloudinary.uploader.upload(base, {
                        folder: `${"62434a58ac9ad04e29be7e1b25"}/chatsImages`,
                        resource_type: "auto"
                    })

                    messageChange = Url.url






                }
                else if (type === "text" || type === "GIF") {
                    messageChange = message
                }

                const isExits = await Messages.findOne({
                    conversations: { $all: [req.body.adminId, req.body.friend_id] }


                })
                // const checkMessageExit=  isExits.messages.length>0&& isExits.messages.some((item)=>{
                //     return item.friendId===req.body.friend_id
                // })
                if (isExits !== null) {
                    Messages.findOneAndUpdate(
                        { conversations: { $all: [req.body.adminId, req.body.friend_id] } },
                        {
                            $push: {
                                messages: {
                                    // adminId: req.body.adminId,
                                    // friendId: req.body.friend_id,
                                    message: messageChange,
                                    time: req.body.time,
                                    senderId: req.body.adminId,
                                    type: req.body.type,
                                    messageID: req.body.messageID,
                                    read: req.body.seen

                                }
                            }
                        },
                        { new: true }, (err, result) => {
                            if (err) {
                                return res.status(500).json({ message: "Something error occured", messageId: messageID })
                            }
                            else {
                                return res.status(200).json({ message: "Successfully", result })
                            }
                        })



                }
                else {

                    const message = await Messages(
                        {
                            conversations: [req.body.adminId, req.body.friend_id],
                            messages: [{
                                // adminId: req.body.adminId,
                                // friendId: req.body.friend_id,
                                message: messageChange,
                                time: req.body.time,
                                senderId: req.body.adminId,
                                type: req.body.type,
                                messageID: req.body.messageID,
                                read: req.body.seen

                            }]
                        })




                    message.save((err, result) => {
                        if (err) {
                            // console.log(err)
                            return res.status(500).json({ message: "message not saved Error" + err, messageId: messageID })
                        }
                        else {
                            return res.status(200).json({ message: "Successfully", result })

                        }
                    })

                }
            }
            else {
                return res.status(500).json({ message: "error occured", messageId: messageID })
            }

        }
        else {
            return res.status(500).json({ message: "error occured" })
        }




    } catch (err) {
        return res.status(500).json({ message: "something error happened" + err, messageId: messageID })

    }
}


exports.GetUserMessages = async (req, res) => {
    try {
        const { user1, user2 } = req.params
        // console.log(user1)
        // console.log(user2)
        const message = await Messages.findOne({ conversations: { $all: [req.params.user1, req.params.user2] } })

        // console.log({ message: message.messages })

        return res.status(200).json(message)

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
}


exports.getUserConversation = async (req, res) => {
    try {
        // console.log(req.params)
        const users = await Messages.find({ conversations: { $in: req.params.user } })

        return res.status(200).json(users)

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
}


exports.getUserDeatils = async (req, res) => {
    try {
        // console.log(req.params)

        const UserDetails = await UserData.findOne({ googleId: req.params.user })
        if (UserDetails) {
            const { fname, lname, url } = UserDetails
            return res.status(200).json({ fname, lname, url, id: req.params.user })
        }
        else {
            return res.status(404).json({ message: "Something error occured" })

        }

    }
    catch (err) {
        return res.status(500).json({ message: "Something error occured" })


    }
}


exports.SearchUser = async (req, res) => {
    try {
        // console.log(req.params)

        const { id } = req.body
        const { q } = req.query
        const { friends } = await UserData.findOne({ googleId: id })
        if (friends.length) {
            const search = (friends) => {
                return friends.filter(item => {
                    return item.name.toLowerCase().includes(q.toLowerCase())
                })
            }
            return res.status(200).json(search(friends))
        }
        else {
            return res.status(200).json([])
        }
    }
    catch (err) {
        return res.status(500).json({ message: err })
    }
}

exports.updateMessageStatus = async (req, res) => {
    try {
        const { friendId, currentUser, docId } = req.body
        console.log("update response from the user side")
        console.log(req.body)

        if (docId && friendId) {

            Messages.findOneAndUpdate(
                { _id: docId, "messages.senderId": friendId },
                { $set: { "messages.$[].read": true } },
                { returnOriginal: false },
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: "Something error occured" })
                    }
                    else {
                        // return res.status(200).json({ message: "Successfully", data: message })
                        return res.status(200).json({ message: "Successfully", result })
                    }
                }
            )
        }
        else {
            return res.status(404).json({ message: "Something error occur" })
        }

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })


    }
}

exports.unreadMessage = async (req, res) => {
    try {
        const { f1, currentUser } = req.params
        if (f1 && currentUser) {
            const message = await Messages.findOne({ conversations: { $all: [f1, currentUser] } })

            const filterMessage = await message.messages.length && message.messages.filter((item) => {
                return item.read === false && item.senderId !== currentUser
            })
            return res.status(200).json({ message: "successfull", data: filterMessage.length })



        }
        else {
            return res.status(500).json({ message: "something went wrong" })
        }

    }
    catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
}


exports.getAllUser = async (req, res) => {
    try {
        const _id = req._id
        const Users = await UserData.find()
        if (Users.length) {
            return res.status(200).json(Users)
        }
        else {
            return res.status(200).json([])
        }

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })
    }
}


exports.createRoom = async (req, res) => {
    try {
        const { RoomCreatedBy, adminId, googleId } = req.body
        const _id = req._id
        // console.log({ adminId })
        const { fname, lname, url } = await UserData.findById({ _id: adminId })
        // console.log()
        // console.log(req.body)
        if (req.body) {
            const room = await Rooms({
                RoomId: req.body.RoomId,
                RoomName: req.body.RoomName,
                RoomType: req.body.RoomType,
                admin: [adminId],
                RoomDescription: "",
                RoomCreatedBy: req.body.RoomCreatedBy,
                RoomImage: "",
                RoomCreatedDate: new Date(),
                RoomModifiedBy: "",
                RoomModifiedDate: "",
                RoomStatus: true,
                RoomMembers: [{
                    _id: adminId,
                    name: fname + "" + lname,
                    url,
                    admin: true,
                    googleId: googleId


                }],
                RoomMessages: [],
                RoomLastMessage: "",






            })
            room.save(async (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Something error occured" })
                }
                else {

                    const AllRooms = await Rooms.find({ "RoomMembers._id": { $elemMatch: { adminId } } })
                    console.log({ AllRooms })
                    return res.status(200).json({ message: "Successfully", AllRooms })
                }
            })

        }

    } catch (err) {
        return res.status(500).json({ message: "Something error occuredd" })
    }
}


exports.getAllRooms = async (req, res) => {
    try {
        const _id = req._id
        // console.log({ _id })
        const { roomadmin } = req.headers
        // console.log(req.headers)
        // console.log(req.body)
        const AllRooms = await Rooms.find({ "RoomMembers._id": roomadmin })
        if (AllRooms.length) {
            // console.log({ AllRooms })
            return res.status(200).json(AllRooms)
        }
        else {
            return res.status(200).json([])
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })
    }
}

exports.getRoomMessages = async (req, res) => {
    try {
        const _id = req._id
        // console.log({ _id })
        const { roomID } = req.params
        const AllRooms = await Rooms.findOne({ RoomId: roomID })
        if (AllRooms) {
            return res.status(200).json(AllRooms)
        }
        else {
            return res.status(200).json([])
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })
    }
}

exports.groupImage = async (req, res) => {
    try {
        const _id = req._id
        // console.log({ _id })
        const { base, roomId, FileType } = req.body
        if (FileType === "image/jpeg" || FileType === "image/png" || FileType === "image/jpg") {

            if (base) {
                const checkRoom = await Rooms.findOne({ _id: roomId })
                // console.log(checkRoom)
                if (checkRoom) {
                    const room = await Rooms.findOneAndUpdate({ _id: roomId }, { $set: { RoomImage: base } }, { new: true })
                    return res.status(200).json({ message: "Successfully", room: room.RoomImage })
                }
            }
        }
        else {
            return res.status(400).json({ message: "Select a Image with PNG, JPEG, JPG extension" })
        }

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })
    }
}

exports.searchfriends = async (req, res) => {
    try {
        const _id = req._id
        // console.log({ _id })
        const { q } = req.query
        // console.log(_id)

        const userData = await UserData.findOne({ googleId: _id })
        // console.log(userData.friends)
        const Search = (data) => {
            return data.filter((item) => {
                // console.log(item)
                return item.name.toLowerCase().includes(q.toLowerCase())

            })
        }

        return res.status(200).json(Search(userData.friends))
    } catch (error) {
        return res.status(500).json({ message: "Something error occured" })

    }
}

exports.addFriendsInGroup = async (req, res) => {
    try {
        const _id = req._id
        // console.log({ _id })
        const { userId } = req.params
        const { roomId } = req.body
        // console.log(req.body, userId)
        if (roomId && userId) {
            const { _id, fname, lname, url } = await UserData.findOne({ googleId: userId })
            const { admin } = await Rooms.findOne({ _id: roomId })

            //now check user id exit inn admin array
            const isAdmin = await admin.some(v => v === _id)
            // console.log(isAdmin)
            const checkRoom = await Rooms.findOne({ _id: roomId })
            // console.log(checkRoom)
            if (checkRoom) {
                const room = await Rooms.findOneAndUpdate({ _id: roomId }, {
                    $push: {
                        RoomMembers: {
                            _id: _id.toString(),
                            name: fname + "" + lname,
                            url,
                            admin: isAdmin,
                            googleId: userId
                        }
                    }
                }, { new: true })
                return res.status(200).json({ message: "Successfully", room })
            }
        }
        // const AllRooms = await Rooms.findOne({ RoomId: roomID })
        // if (AllRooms) {
        //     return res.status(200).json(AllRooms)
        // }
        // else {
        //     return res.status(200).json([])
        // }
        // return res.end()
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })
    }

}

exports.getfriends = async (req, res) => {
    try {

        const { Id_to_fetch, roomId } = req.body
        console.log(req.body)
        const user = await UserData.findOne({ _id: Id_to_fetch });
        const fetchRoom = await Rooms.findOne({ _id: roomId })
        if (user && fetchRoom) {
            console.log("hit")
            const friends = await Promise.all(
                user.friends.map((friendId) => {
                    return UserData.findOne({ googleId: friendId._id })
                })
            );

            let friendList = [];
            friends.map((friend) => {
                // console.log(friend)

                friendList.push({ _id: friend.googleId, name: friend.fname + " " + friend.lname, url: friend.url, id: friend._id.valueOf() });
            });


            console.log("hello")
            const notUserExitInRoomMembers = friendList.filter(item => {
                // console.log({ item })
                if (fetchRoom.RoomMembers.length > 0) {
                    return !fetchRoom.RoomMembers.find(value => {
                        // console.log({ value })
                        return value._id.valueOf() === item.id
                    })
                }
                else {
                    return item
                }
            })
            // console.log("filter")
            // console.log(notUserExitInRoomMembers)
            // :notUserExitInRoomMembers
            return res.status(200).json({ friendList: notUserExitInRoomMembers })

        }
        else {
            return res.status(200).json({ message: "please provide value" })
        }

    } catch (err) {
        return res.status(500).json(err);
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const _id = req._id
        const { userId, roomId } = req.body
        // console.log(req.body)
        const FetchUSerDetails = await Rooms.findOneAndUpdate({ _id: roomId }, { $pull: { RoomMembers: { _id: userId } } }
            , { new: true })
        await Rooms.findOneAndUpdate({ _id: roomId }, { $pull: { admin: userId } })
        // console.log({ FetchUSerDetails })
        if (FetchUSerDetails) {
            return res.status(200).json({ message: "Successfully", FetchUSerDetails })
        }

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" });

    }

}

exports.makeAdmin = async (req, res) => {
    try {
        const _id = req._id
        const { userId } = req.params
        const { roomId } = req.body
        // { _id: roomId },
        const FetchUSerDetails = await Rooms.findOneAndUpdate({ _id: roomId }, { $push: { admin: userId } }, { new: true })
        if (FetchUSerDetails) {
            return res.status(200).json({ message: "Successfully", FetchUSerDetails })
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" });
    }
}

exports.saveGroupMessage = async (req, res) => {
    try {
        const _id = req._id
        const { roomId, message, name, userId, url, messageId } = req.body
        console.log(req.body)
        const FetchUSerDetails = await Rooms.findOneAndUpdate({ RoomId: roomId }, { $push: { RoomMessages: req.body } }, { new: true })
        // console.log({ FetchUSerDetails })
        if (FetchUSerDetails) {
            return res.status(200).json({ message: "Successfully", result: FetchUSerDetails })
        }
    } catch (err) {
        return res.status(500).json({ message: "Something eror occured" })
    }
}


exports.getGroupMessages = async (req, res) => {
    try {
        const _id = req._id
        const { groupId } = req.params
        // console.log(req.body)
        if (groupId) {
            const FetchUSerDetails = await Rooms.findOne({ RoomId: groupId })
            if (FetchUSerDetails) {
                return res.status(200).json({ message: "Successfully", result: FetchUSerDetails.RoomMessages })
            }
            else {
                return res.status(404).json({ message: "no group found" })
            }
        }
        else {
            return res.status(200).json({ message: "Something eror occured" })
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }

}



exports.roomExits = async (req, res) => {
    try {
        const _id = req._id
        const { roomid } = req.headers
        const FetchUSerDetails = await Rooms.findOne({ RoomId: roomid })
        if (FetchUSerDetails) {
            return res.status(200).json({ message: "Successfully" })
        }
        else {
            return res.status(404).json({ message: "Room not exits" })
        }

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
}


exports.unreadMessages = async (req, res) => {
    try {
        const { userId } = req.params
        const _id = req._id
        let array = []
        let empty;
        if (userId) {
            const UnreadMessages = await Messages.find({ conversations: { $in: _id } })
            const getUnreadMessageUserList = UnreadMessages.map((upper) => {
                if (upper.conversations.includes(_id) && upper.messages.length > 0) {
                    return {
                        conversations: upper.conversations,
                        messages: upper?.messages?.filter((inner) => {
                            return inner.senderId !== _id && !inner.read
                        })
                    }
                }
            })
            //now get the mem message lengthand userId
            console.log(getUnreadMessageUserList)
            getUnreadMessageUserList.forEach((value) => {
                if (value.messages.length > 0) {
                    const anotherUserId = value.conversations.find(id => id !== _id)
                    array.push(
                        {
                            anotherUserId: anotherUserId,
                            messageLength: value.messages.length,
                            time: value.messages[value.messages.length - 1].time,
                        }
                    )
                }
            })

            if (array.length > 0) {
                const value = array.map(async (item) => {
                    const { url, name } = await getUserDetails(item.anotherUserId)
                    return {
                        ...item,
                        url,
                        name,
                        type: "chat"
                    }
                })
                empty = await Promise.all(value)

            }
            else {
                empty = []

            }
            return res.status(200).json({ message: "Ok", UnreadMessages, array, empty, getUnreadMessageUserList })

        }
        else {
            return res.status(404).json({ message: "Something missing" })
        }
    } catch (err) {
        return res.status(500).json({ message: "Somethinbg error occure" + err })

    }
}