
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

router.post("/user/blob/image/9fHtqOJumtxOzmTfLMFT/ETXsG3rHrnx2irUZmefU/njVzxxrEx84ZrUiERB0t/fxXRdJLMKIkzxucTbovy/sO9rLr3E0EuDpjYcawQD/", Auth.AuthToken, BlobController.profileImagePost
)



// =====================================get the profile images===========

router.get("/profile/image/e9thhvkKqJpnTlYo1sQl/QVbghZqhoSr2Rt5qvNYJ/iKj3RoJojFWmcDo4wTlm/9Olk5vTenhdkjHrdYEWl/", Auth.AuthToken, BlobController.getProfileImage)

router.post("/strategy/images/", Auth.AuthToken, BlobController.getStrategyImages)




// ============================================delete the assests =========

//delete profile image
router.delete("/delete/assest/", Auth.AuthToken, BlobController.DeleteAssestsProfileImage)




//save usr information

router.put("/user/i/b/y9y5y0q3eztm3ibcd8z0/bum6ozd9m1sw4w9fbxea/amqvdkbe49sn4u3cvsvt/e5ce6ba3miamapdl7wyv/", Auth.AuthToken, BlobController.saveUserInformation)


router.get("/user/083525p7ljhwmxifts31/l66cbrsuytmj1wujuauz/nqoye5ozdqj89b4s4qoq/ua1iztaxjo4bbmzvd391/3mzqeygnoszlknp90h51/t28uf00khscofxgjwj20/", Auth.AuthToken, BlobController.getUserInformation)





//-----------------------------------BACKGROUND IMAGES --------------------------

router.post("/user/blob/image/bg/S6MjFqeb8HdJRGjkUs9W/QUCzIb1mKtMevddN24yB/YWYhtXwEEtUlHu0Nkhmq/eAQCSzpYo28SJxXCMV4d/yR3VTmMynJw6N3xlS530/WpsJsZKo4hGf18jaWmZL/", Auth.AuthToken, BlobController.backgroundImagePost)

router.get("/bg/image/mwQgga2z5KfChXjuF1s0/r6dg0LqqWmCG4W5UQOTa/ftFhzft7YNwT6jb9EVoX/ogvnbpOcPnjgMatu3mtb/JSC2PQZQVlK19QXDbSl1/", Auth.AuthToken, BlobController.getBackgroundImage)



router.delete("/delete/assest/bg/", Auth.AuthToken, BlobController.DeleteAssestsBackgroundImage)


//=======================USER COMMENTS===============

router.get("/root/load/all/comments/:post_id/:userId/:value", Auth.AuthToken, BlobController.loadComments)




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

router.get("/load/all/post/:value", Auth.AuthToken, BlobController.loadAllUserPost)


//delete the user post

router.delete("/delete/user/post/local/delete", Auth.AuthToken, BlobController.deleteUserPostByMongoDB)


//take all the number of comment for current use

router.get("/all/comment/user/", Auth.AuthToken, BlobController.getAllCommentNumber)


// ============================================//LIKE AND UNLIKE COUNT////////////////////////////////////////////////////////

router.put("/user/like/:post_id", async (req, res) => {
    try {

        let onlineUser = []
        const { post_id } = req.params
        const { likeTo, likedBy } = req.body
        // console.log(req.body)
        // // console.log({ id })]
        // console.log(post_id)
        // console.log(likeTo)
        // console.log(likedBy)

        const socket = req.app.get("socket")
        const online = req.app.get("array")

        // console.log({ online })
        // console.log({ socket })








        //add new user which not exit in database

        //fetch from mongo db
        // const AddNewUser = async (username, socketId) => {
        //     const newUSer = await onlineUsers.findOne({
        //         name: { $eq: username }
        //     })
        //     if (!newUSer) {
        //         const newUser = new onlineUsers({
        //             name: username,
        //             adminId: likedBy,
        //             socketId,
        //             time: new Date(Date.now()),
        //         })
        //         await newUser.save()

        //     }
        // }

        //remove user after disconenct or not exits



        // const RemoveNewUser = async (socketId) => {
        //     const RemoveNewUser = await onlineUsers.findOneAndDelete({
        //         socketId: { $eq: socketId }


        //     })
        //     return RemoveNewUser
        // }



        //get username whose online


        // const getNewUser = async (username) => {
        //     const newUser = await onlineUsers.findOne({ name: username })

        //     return newUser
        // }








        //connect to the scockte.io
        // req.io.on('connection', (socket) => {
        //     console.log('a user connected');
        //     console.log(socket.id)
        //     //take event from client

        //     //add new user jo like krta hai
        //     // socket.on("newUser", async (data) => {
        //     //     const { likedBy, post_id, likeTo } = data
        //     //     const { fname, lname } = await Post.findOne({ googleId: likedBy })
        //     //     AddNewUser(fname + " " + lname, socket.id)
        //     //     console.log({ data })
        //     // })

        //     //send notification to the user who like the post
        //     socket.on("like", async (data) => {
        //         console.log({ data })
        //         console.log("data is")
        //         const { likedBy, post_id, likeTo } = data
        //         const { fname, lname } = await Post.findOne({ googleId: likedBy })
        //         const likedByUser = await Post.findOne({ googleId: likeTo })
        //         const { socketId } = await getNewUser(fname + " " + lname)
        //         console.log({ socketId })

        //         // socket.emit("he1", { name: socketId })

        //         // socket.to(socketId).emit("he", { likedBy, post_id, likeTo })

        //         socket.broadcast.to(socketId).emit("getNoti", { fname: likedByUser.fname, lname: likedByUser.lname, post_id, likeTo })




        //     })
        //     socket.on('disconnect', () => {
        //         //remove user when disconenct the window
        //         RemoveNewUser(socket.id)
        //         console.log('user disconnected');
        //     });
        // })





        //get the post by post_id
        const FindPostById = await TextPost.findOne({ post_id })



        //check user id is already exit in post like array or not
        if (!FindPostById.liked.includes(likedBy)) {




            TextPost.findOneAndUpdate({ post_id }, {
                $push: {
                    liked: likedBy
                },


            }, { new: true }, async (err, data) => {
                console.log({ data })
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
                            console.log(err)
                        }
                        else {
                            console.log("noti saved")
                            //find all notification regarding to specific post
                            const allNoti = await Noti.find({ post_id })


                            pusher.trigger("LikePost", "LikePostMessage", { url, name: fname + " " + lname, allNoti, }, req.body.socketId)
                        }
                    })



                }
                else {
                    //if user ne apni profile picture upload nhi ki ho tb
                    const { fname, lname } = await Post.findOne({ googleId: likedBy })
                    pusher.trigger("LikePost", "LikePostMessage", { url, name: fname + "" + lname }, req.body.socketId)


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
                    pusher.trigger("LikePost", "LikePostMessage", { url, name: fname + " " + lname, allNoti }, req.body.socketId)


                }
                else {
                    const allNoti = await Noti.find({})
                    pusher.trigger("LikePost", "LikePostMessage", { url, name: fname + "" + lname, allNoti }, req.body.socketId)




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


//change visibilty of any post
router.put("/visibility/user/post/local/:post_id", Auth.AuthToken, BlobController.privacy)



//update the privay of any post
router.put("/api/setPrivacy/:post_id", Auth.AuthToken, BlobController.setPrivacy)
module.exports = router;