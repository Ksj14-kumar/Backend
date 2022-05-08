

const History = require("../db/History")
const UserData = require("../db/UserData")



exports.history = async (req, res) => {
    try {
        const { adminId, usernameId, name, receiverUrl } = req.body
        const _id = req._id

        console.log(req.body)

        if (!adminId || !usernameId) {
            return
        }
        const userDetails = await UserData.findOne({ googleId: usernameId })

        const isAlreadyExit = await History.findOne({ adminId: adminId })
        console.log({ isAlreadyExit })


        // UserData.findOneAndUpdate
        if (isAlreadyExit) {
            const isAlreadyExit = await History.findOne({ adminId: _id })
            const checkHistoryAlreadyExit = isAlreadyExit?.history.some((item) => item.searchUserId === usernameId)

            if (!checkHistoryAlreadyExit) {
                await History.findOneAndUpdate({
                    adminId: adminId,
                },
                    {
                        $push: {

                            history: {
                                searchUserId: usernameId,
                                name: userDetails?.fname + " " + userDetails?.lname,
                                url: userDetails?.url

                                // name,
                                // receiverUrl
                            }
                        }
                    }

                )
            }


        }
        else {
            const isAlreadyExit = await History.findOne({ adminId: adminId })
            const checkHistoryAlreadyExit = isAlreadyExit?.history.some((item) => item.searchUserId === usernameId)
            console.log({ checkHistoryAlreadyExit })
            if (!checkHistoryAlreadyExit) {

                const saveUser = await History({
                    adminId: adminId,
                    history: {
                        searchUserId: usernameId,
                        name: userDetails?.fname + " " + userDetails?.lname,
                        url: userDetails?.url
                    }
                })
                await saveUser.save()
            }



        }


        return res.status(200).json({ message: "hisotry save successfull" })

    } catch (err) {
        return res.status(500).json({ message: "Something error ocuured" + err })

    }
}

exports.historyfetch = async (req, res) => {
    try {
        const _id = req._id
        const history = await History.findOne({ adminId: _id })
        return res.status(200).json({ data: history })

    } catch (err) {
        return res.status(200).json({ message: "Something error occured" + err })

    }
}


exports.deletehistory = async (req, res) => {
    try {
        const { searchUserId } = req.body
        const _id = req._id
        const findUserHistorydata = await History.findOne({ adminId: _id })
        const bool = findUserHistorydata?.history.some(item => item.searchUserId === searchUserId)

        if (bool) {
            await History.findOneAndUpdate({
                adminId: _id

            }, {
                $pull: {
                    history: { searchUserId: searchUserId }
                }
            })
            return res.status(200).json({ message: "successfull delete" })
        }


    } catch (err) {
        return res.status(500).json({ message: "error" })

    }
}


exports.loadFriends = async (req, res) => {
    try {
        const _id = req._id
        const id = req.params.id
        //load all the friends except user friends
        const allFriends = await UserData.find({ googleId: { $ne: id } })
        const loadAdminFriends = await UserData.findOne({ googleId: id })
        const adminFriends = loadAdminFriends.friends


        // console.log({ allFriends })
        const filterData = allFriends.filter((item) => {


            return adminFriends.some((i) => {
                console.log({ i })
                return i.currentUser !== item.googleId && i.anotherUserId !== item.googleId
            })

            // // return adminFriends.some(i=>{return i.currentUser || i.anotherUserId})

            // // console.log({ adminFriends })
            // const userDetails = adminFriends.length > 0 && adminFriends.filter((i) => {

            //     return (i.currentUser || i.anotherUserId)
            // })



            // // console.log({ userDetails })

            // const value = item.googleId !== _id && userDetails.anotherUserId !== item.googleId && userDetails.currentUser !== item.googleId
            // console.log({ value })
            // return value
        })

        console.log({ filterData })

        return res.status(200).json({ data: filterData })

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })

    }
}