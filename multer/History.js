
const router = require("express").Router()
const history = require("../db/History");
const Auth = require("../Auth/auth")
const userHistory = require("../Controller/UserHistory")




router.post("/user/history", Auth.AuthToken, userHistory.history)
router.get("/user/history/fetch", Auth.AuthToken, userHistory.historyfetch)
router.delete("/delete/history", Auth.AuthToken, userHistory.deletehistory)
router.get("/load/friends/", Auth.AuthToken, userHistory.loadFriends)


module.exports = router


