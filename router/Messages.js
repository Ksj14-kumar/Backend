const router = require("express").Router()
const chatMessages = require('../db/ChatMessages');
const UserData = require("../db/UserData")

router.post("/", async (req, res) => {
    try {

        const message = await new chatMessages(req.body)

        await message.save()
        return res.status(200).json({ message: message })

    } catch (err) {
        return res.status(500).json({ message: "Successfull save" })

    }
})



router.get("/:conversationId", async (req, res) => {
    try {
        const message = await chatMessages.find({ conversationId: req.params.conversationId })
        console.log(req.params.conversationId)
        return res.status(200).json({ data: message })

    } catch (err) {
        return res.status(500).json({ message: "Sometyhing error occured" })

    }
})




module.exports = router