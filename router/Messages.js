const router = require("express").Router()

const Auth = require("../Auth/auth")
const chatMessageRouterController = require("../Controller/Message")

router.post("/v1/messages/send", chatMessageRouterController.PostMessage)

//get user convertion message
router.get("/v1/messages/get/:user1/:user2", chatMessageRouterController.GetUserMessages)


//get user which convertion to user

router.get("/v1/messages/getAllConversation/:user", chatMessageRouterController.getUserConversation)


//get user details from server
router.get("/v1/users/:user", chatMessageRouterController.getUserDeatils)

//search user 
router.post("/v1/users/search/q", chatMessageRouterController.SearchUser)
router.post("/v1/update/message/seen/status", chatMessageRouterController.updateMessageStatus)
router.get("/v1/message/unread/:f1/:currentUser", chatMessageRouterController.unreadMessage)
router.get("/v1/all/user", Auth.AuthToken, chatMessageRouterController.getAllUser)
router.post("/v1/room/create", Auth.AuthToken, chatMessageRouterController.createRoom)
router.get("/v1/rooms/getAllRooms", Auth.AuthToken, chatMessageRouterController.getAllRooms)
router.get("/v1/messages/get/:roomID", Auth.AuthToken, chatMessageRouterController.getRoomMessages)
router.post("/v1/group/image", Auth.AuthToken, chatMessageRouterController.groupImage)
router.get("/v1/search/query/q", Auth.AuthToken, chatMessageRouterController.searchfriends)
router.post("/v1/group/add/friend/:userId", Auth.AuthToken, chatMessageRouterController.addFriendsInGroup)
router.post("/v1/group/friends/", Auth.AuthToken, chatMessageRouterController.getfriends)
router.delete("/v1/delete/user/group", Auth.AuthToken, chatMessageRouterController.deleteUser)
router.put("/v1/group/makeAdmin/:userId", Auth.AuthToken, chatMessageRouterController.makeAdmin)
router.post("/v1/group/message/save", Auth.AuthToken, chatMessageRouterController.saveGroupMessage)
router.get("/v1/rooms/check", Auth.AuthToken, chatMessageRouterController.roomExits)
router.get("/v1/group/messages/get/:groupId", Auth.AuthToken, chatMessageRouterController.getGroupMessages)


module.exports = router