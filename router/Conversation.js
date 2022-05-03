const Conversation = require("../db/Conversation")

const router = require("express").Router()



//add the chat into db
router.post("/", async (req, res) => {
    try {
        const conversation = await Conversation({
            members: [req.body.senderId, req.body.receiverId]
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


module.exports = router