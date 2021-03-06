
const router = require("express").Router()
const jwt = require("jsonwebtoken")
const KEY = process.env.SECRET_KEY
const DetectImage = require("../ImagesDetection/_detect")
const Noti = require('../db/Notification');
const fs = require("fs")
const multer = require('multer');
const Auth = require("../Auth/auth");
const path = require("path")
const { cloudinary } = require("../Cloudnary/cloudnary");
const GoogleDb = require("../db/googledb")
const Post = require("../db/UserData");
const Comments = require("../db/Comments");
const TextPost = require("../db/TextPost");
const Model = require("../public/Nsfw_Model/min_nsfwjs/model.json")
const onlineUsers = require("../db/OnlineUser")
const BlobController = require("../Controller/BlobRoute")


let Pusher = require('pusher');
const UserData = require("../db/UserData");
let pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTLS: true
});


// pusher.trigger("AddPost", "AddPostMessage", {
// });

// pusher.trigger("DeletePost", "PostDeleted", {
// });

// pusher.trigger("channel", "message", {
// });

// pusher.trigger("userDetails", "message1", {
// });

// pusher.trigger("updateComment", "updateCommentMessage", {
// });

const url = "https://cdni.pornpics.com/460/7/433/79976277/79976277_257_72b0.jpg"


const storage = multer.diskStorage({
    destination: function (req, file, cb) {


        cb(null, 'public/UserBlob/' + req.user._id)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage }).single("file")







// ==============================POST THE PROFILE IMAGE --==================
//if  user ki profile image ko alag palteform pr save krna hai tou simply frontend mai route path url set kr do aur koi modificationn ki need nhi hai

//save the profile image into cloudinary
router.post("/user/blob/image/9fHtqOJumtxOzmTfLMFT/ETXsG3rHrnx2irUZmefU/njVzxxrEx84ZrUiERB0t/fxXRdJLMKIkzxucTbovy/sO9rLr3E0EuDpjYcawQD/", Auth.AuthToken, BlobController.profileImagePost)

router.get("/profile/image/e9thhvkKqJpnTlYo1sQl/QVbghZqhoSr2Rt5qvNYJ/iKj3RoJojFWmcDo4wTlm/9Olk5vTenhdkjHrdYEWl/", Auth.AuthToken, BlobController.getProfileImage)

router.post("/strategy/images/", Auth.AuthToken, BlobController.getStrategyImages)

// ============================================delete the assests profile image from cloudinary =========
//delete profile image
router.delete("/delete/assest/", Auth.AuthToken, BlobController.DeleteAssestsProfileImage)



//now save the profile image into data base as base64 hash string
router.post("/api/v1/user/profile/image", Auth.AuthToken, BlobController.Base64ProfileImage)







//save usr information

router.put("/user/i/b/y9y5y0q3eztm3ibcd8z0/bum6ozd9m1sw4w9fbxea/amqvdkbe49sn4u3cvsvt/e5ce6ba3miamapdl7wyv/", Auth.AuthToken, BlobController.saveUserInformation)


router.get("/user/083525p7ljhwmxifts31/l66cbrsuytmj1wujuauz/nqoye5ozdqj89b4s4qoq/ua1iztaxjo4bbmzvd391/3mzqeygnoszlknp90h51/t28uf00khscofxgjwj20/", Auth.AuthToken, BlobController.getUserInformation)





//-----------------------------------BACKGROUND IMAGES from cloudinary --------------------------

router.post("/user/blob/image/bg/S6MjFqeb8HdJRGjkUs9W/QUCzIb1mKtMevddN24yB/YWYhtXwEEtUlHu0Nkhmq/eAQCSzpYo28SJxXCMV4d/yR3VTmMynJw6N3xlS530/WpsJsZKo4hGf18jaWmZL/", Auth.AuthToken, BlobController.backgroundImagePost)

router.get("/bg/image/mwQgga2z5KfChXjuF1s0/r6dg0LqqWmCG4W5UQOTa/ftFhzft7YNwT6jb9EVoX/ogvnbpOcPnjgMatu3mtb/JSC2PQZQVlK19QXDbSl1/", Auth.AuthToken, BlobController.getBackgroundImage)

router.delete("/delete/assest/bg/", Auth.AuthToken, BlobController.DeleteAssestsBackgroundImage)


//=======================USER COMMENTS===============

router.get("/root/load/all/comments/:post_id/:userId/", Auth.AuthToken, BlobController.loadComments)

router.post("/post/comment/save", Auth.AuthToken, BlobController.saveComment)


router.delete("/post/comment/delete/:commentId", Auth.AuthToken, BlobController.deleteComment)

router.put("/update/comment/:commentId", Auth.AuthToken, BlobController.updateComment)

//=======================USERS POST SAVE AND LOAD into cloudinary============

router.post("/users/post/:id", Auth.AuthToken, BlobController.saveUserPostIntoCloudinary)

router.get("/users/public/posts/:id", Auth.AuthToken, BlobController.getUserPublicPostintoCloudinary)



//DELETE THE POST BY SPECIf id
router.delete("/delete/user/post/:id", Auth.AuthToken, BlobController.deleteUserPostByCloudinary)


//==================================save user post into the mongodb  by local url=========================


router.post("/local/url/", Auth.AuthToken, BlobController.saveUserPostIntoMongoDB)
//Each post url for share the post or download the post
router.get("/user/post/:post_id", Auth.AuthToken, BlobController.GetPostFromMongoDb)




// ===================================SAVE all the user post into the mongodb  by local url=========================
//load the user post

router.get("/load/all/post/:value1/:value2", Auth.AuthToken, BlobController.loadAllUserPost)
//delete the user post
router.delete("/delete/user/post/local/delete", Auth.AuthToken, BlobController.deleteUserPostByMongoDB)
//take all the number of comment for current use


router.get("/all/comment/user/:id", Auth.AuthToken, BlobController.getAllCommentNumber)


// ============================================//LIKE AND UNLIKE COUNT////////////////////////////////////////////////////////

router.put("/user/like/:post_id", async (req, res) => {
    try {

        let onlineUser = []
        const { post_id } = req.params
        const { likeTo, likedBy } = req.body

        //get the post by post_id
        const FindPostById = await TextPost.findOne({ post_id })
        //check user id is already exit in post like array or not
        if (!FindPostById.liked.includes(likedBy)) {
            TextPost.findOneAndUpdate({ post_id }, {
                $push: {
                    liked: likedBy
                },
            }, { new: true }, async (err, data) => {
                // console.log({ data })
                // UserBlob/
                //fetch the user image which like post
                const result = await cloudinary.search.expression(
                    "folder:" + likedBy + "/profileImage",
                ).sort_by('created_at', 'desc').execute()
                //check  user profile image exit or not jo user like krta hai
                if (result.resources.length > 0) {
                    //profile image url le liya
                    const url = result.resources[0].url
                    //fetch userDetails jisne like ki hai post
                    const { fname, lname } = await Post.findOne({ googleId: likedBy })
                    const { image } = await TextPost.findOne({ post_id })

                    //jisne post like ki hai uski info ko save kr lete hai
                    const SaveNoti = await Noti({
                        name: fname + " " + lname,
                        url: url,
                        post_id: post_id,
                        likeTo,
                        likedBy,
                        postImageURL: image
                    })

                    SaveNoti.save(async (err) => {
                        if (err) {
                            console.log("noti not saved", err)
                            // console.log(err)
                        }
                        else {
                            // console.log("noti saved")
                            //find all notification regarding to specific post
                            const allNoti = await Noti.find({ post_id })
                            // pusher.trigger("LikePost", "LikePostMessage", { url, name: fname + " " + lname, allNoti, }, req.body.socketId)
                        }
                    })
                }
                else {
                    //if user ne apni profile picture upload nhi ki ho tb
                    const { fname, lname } = await Post.findOne({ googleId: likedBy })
                    // pusher.trigger("LikePost", "LikePostMessage", { url, name: fname + "" + lname }, req.body.socketId)
                }
            })
            return res.status(200).json({ message: "post liked" })
        }
        else {
            TextPost.findOneAndUpdate({ post_id }, {
                $pull: {
                    liked: likedBy
                }
            }, { new: true }, async (err, data) => {

                // console.log({ data })
                await Noti.findOneAndDelete({
                    post_id: post_id,

                })
                // UserBlob/
                //fetch userDetails
                const { fname, lname } = await Post.findOne({ googleId: likeTo })
                //fetch the user image which like post
                const result = await cloudinary.search.expression(
                    "folder:" + likeTo + "/profileImage",
                ).sort_by('created_at', 'desc').execute()
                if (result.resources.length > 0) {
                    const url = result.resources[0].url
                    const allNoti = await Noti.find({})
                    // pusher.trigger("LikePost", "LikePostMessage", { url, name: fname + " " + lname, allNoti }, req.body.socketId)
                }
                else {
                    const allNoti = await Noti.find({})
                    // pusher.trigger("LikePost", "LikePostMessage", { url, name: fname + "" + lname, allNoti }, req.body.socketId)
                }
            })
            return res.status(200).json({ message: "post unliked" })
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })

    }

})


router.get("/load/userliked/details/:id", Auth.AuthToken, BlobController.likedPost)


router.get("/search/", Auth.AuthToken, BlobController.search)


//load the all notification
router.get("/load/all/notification/:id", Auth.AuthToken, BlobController.loadAllNoti)
router.get("/load/all/notification/byId/:id", Auth.AuthToken, BlobController.loadAllNotification)


//change visibilty of any post
router.put("/visibility/user/post/local/:post_id", Auth.AuthToken, BlobController.privacy)



//update the privay of any post
router.put("/api/setPrivacy/:post_id", Auth.AuthToken, BlobController.setPrivacy)

//get search user information when user search the user in search bar
router.post("/finduserprofile/", Auth.AuthToken, BlobController.finduser)
router.post("/number/comment/length/", Auth.AuthToken, BlobController.commentLength)
router.post("/sendfriendrequest/", Auth.AuthToken, BlobController.friendrequest)
router.delete("/deletefriend/request", Auth.AuthToken, BlobController.deletefriendrequest)
router.post("/acceptfriend/request", Auth.AuthToken, BlobController.acceptfriendrequest)
router.post("/disconnect/friend", Auth.AuthToken, BlobController.disconnectfriend)
router.get("/friends/:userId", Auth.AuthToken, BlobController.getfriends);
router.get("/load/all/postlength", Auth.AuthToken, BlobController.postLength);
router.get("/api/posts/single/:auther/:post", Auth.AuthToken, BlobController.SinglePost);
router.get("/api/v1/user/react/:userId", Auth.AuthToken, BlobController.ReactUser);
router.post("/api/v1/bookmark/:userId", Auth.AuthToken, BlobController.Bookmark);
router.post("/api/v1/_user/single/post/", Auth.AuthToken, BlobController.GetPosts)

router.post("/api/v1/_user/single/post/:post_id/", Auth.AuthToken, BlobController.SinglePost)
router.get("/api/v1/_user/posts/", Auth.AuthToken, BlobController.ServerPost)
router.put("/api/v1/user/liked/post/:postId", Auth.AuthToken, BlobController.likeUserPost)
router.put("/api/v1/user/comment/post/:postId", Auth.AuthToken, BlobController.commentUserPost)
router.put("/api/v1/_user/notifications/all/type", Auth.AuthToken, BlobController.updateAllNotificationType)
router.put("/api/v1/_user/notifications/friends/type/:userId", Auth.AuthToken, BlobController.updateFriendNotificationType)


module.exports = router;