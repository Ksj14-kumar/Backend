

const History = require("../db/History")
const UserData = require("../db/UserData")



exports.history = async (req, res) => {
    try {
        const { adminId, usernameId, name, receiverUrl } = req.body
        const _id = req._id

        if (!adminId || !usernameId) {
            return
        }
        const userDetails = await UserData.findOne({ googleId: usernameId })

        const isAlreadyExit = await History.findOne({ adminId: adminId })
        console.log({ isAlreadyExit })

        // UserData.findOneAndUpdate
        if (isAlreadyExit) {
            const saveHistory = await History.findOneAndUpdate({
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
        else {
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


        return res.status(200).json({ message: "hisotry save successfull" })

    } catch (err) {
        return res.status(500).json({ message: "Something error ocuured" })

    }
}

exports.historyfetch = async (req, res) => {
    try {
        const _id = req._id
        const history = await History.findOne({ adminId: _id })
        return res.status(200).json({ data: history })

    } catch (err) {
        return res.status(200).json({ message: "Something error occured" })

    }
}


exports.deletehistory = async (req, res) => {
    try {
        const { searchUserId } = req.body
        const _id = req._id
        const findUserHistorydata = await History.findOne({ adminId: _id })
        const bool = findUserHistorydata?.history.some(item => item.searchUserId === searchUserId)

        if (bool) {
            await History.findOneAndDelete({
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
