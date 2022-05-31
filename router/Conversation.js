const Conversation = require("../db/Conversation")

const router = require("express").Router()



//add the chat into db
router.post("/v1", async (req, res) => {
    try {

        // console.log("conversation", req.body)
        const conversation = await Conversation({
            members: [req.body.adminId, req.body.friend_id]
        })

        await conversation.save()

        return res.status(200).json({ message: "Successfully" })

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
})


//get the chat
router.get("/:userId", async (req, res) => {
    try {

        const data = await Conversation.find({ members: { $in: req.params.userId } })

        return res.status(200).json({ data: data })

    } catch (err) {
        return res.status(500).json({ message: "Something error Occured" + err })

    }
})

//get con between two user
router.get("/:userId/:userId2", async (req, res) => {

    try {
        const data = await Conversation.findOne({ members: { $all: [req.params.userId, req.params.userId2] } })
        // console.log({ data })

        return res.status(200).json({ data: data })



    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })


    }

})


module.exports = router