
const router = require("express").Router()
const jwt = require("jsonwebtoken")
const KEY = process.env.SECRET_KEY
const DetectImage = require("../ImagesDetection/_detect")
const Noti = require('../db/Notification');
const fs = require("fs")
const multer = require('multer');
const { isAuth } = require("../Auth/auth");
const path = require("path")
const { cloudinary } = require("../Cloudnary/cloudnary");
const GoogleDb = require("../db/googledb")
const Post = require("../db/UserData");
const Comments = require("../db/Comments");
const TextPost = require("../db/TextPost");
const Model = require("../public/Nsfw_Model/min_nsfwjs/model.json")


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

router.post("/user/blob/image/9fHtqOJumtxOzmTfLMFT/ETXsG3rHrnx2irUZmefU/njVzxxrEx84ZrUiERB0t/fxXRdJLMKIkzxucTbovy/sO9rLr3E0EuDpjYcawQD/:id", async (req, res) => {
    try {
        // const { _id } = req.user
        const token = req.params.id
        const { data, url } = req.body
        console.log({ token })

        const { _id } = await jwt.verify(token, KEY)
        console.log(_id)
        //filter the local image url
        const filterUrl = url.split("blob")[1].slice(1)



        if (!data) {
            return res.status(400).json({ message: "please select Image" })
        }
        //now check the image is contain sexual content or not
        else {

            const uploadResponse = await cloudinary.uploader.upload(data, {
                folder: `${_id}/profileImage`,

                public_id: _id,
                resource_type: "image",
                timeout: 100000,
                overwrite: true,
                use_filename: true,
                unique_filename: false,
                chunk_size: 1000000,
                invalidate: true,
                phash: true
            })


            //pass the image url to Detecteing image
            const returnValue = await DetectImage(uploadResponse.url)
            const FilterData = returnValue.find((item) => {
                return (item.className === "Sexy" && item.probability >= 0.5) || (item.className === "Porn" && item.probability >= 0.5) || (item.className === "Hentai" && item.probability >= 0.50)
            })



            //if image is not  contain voilence stuff
            if (FilterData === undefined) {
                pusher.trigger("profileImage", "profileImageMessage", { uploadResponse: uploadResponse.url })

                return res.status(200).json({ message: "Uploaded Successfully", data: { url: uploadResponse.url, asset_id: uploadResponse.asset_id } })

            }
            //if image content voilnce stuff
            if (FilterData !== undefined) {

                if (FilterData.className === "Sexy" || FilterData.className === "Porn" || FilterData.className === "Hentai") {


                    //delete the image which is saved on cloudianry,
                    //disadvntage is that it is also remove previous image which is uploaded
                    //this is fixed in production envirnment, to create a url for image with heroku domain
                    await cloudinary.uploader.destroy(uploadResponse.public_id)
                    //show the message tro client

                    return res.status(403).json({ message: "This is not allowed contain, violence stuff" })
                }
            }
        }

    }
    catch (err) {
        return res.status(499).json({ message: "not uploaded please try again" + err })
    }
})



// =====================================get the profile images===========

router.get("/profile/image/e9thhvkKqJpnTlYo1sQl/QVbghZqhoSr2Rt5qvNYJ/iKj3RoJojFWmcDo4wTlm/9Olk5vTenhdkjHrdYEWl/:id", async (req, res) => {
    try {

        // const { _id } = req.user
        const token = req.params.id

        // console.log({ token })

        //verify token for current user
        const { _id } = await jwt.verify(token, KEY)

        // UserBlob/
        const result = await cloudinary.search.expression(
            "folder:" + _id + "/profileImage",

        )
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()

        // const publicIds = result.map(resource => resource.public_id)


        res.status(200).json({ url: result.resources[0].url, assest_id: result.resources[0].asset_id })



    } catch (err) {
        res.status(500).json({ message: "Something Error  Occured" })

    }
})

router.post("/strategy/images/", async (req, res) => {

    try {
        const { data } = req.body

        const uploadResponse = await cloudinary.uploader.upload(data, {
            folder: req.user._id,

            resource_type: "image",
            timeout: 100000,
        })
        res.status(200).json({ message: uploadResponse })



    }



    catch (err) {
        // console.log(err)
    }
})




// ============================================delete the assests =========

//delete profile image
router.delete("/delete/assest/:id", async (req, res) => {
    try {
        const { assest_id } = req.body
        console.log({ data: req.body })
        // const { public_id } = req.body
        console.log(req.body)
        const { id } = req.params


        // const uploadResponse =await  cloudinary.uploader.destroy(asset_id)

        const allUserIdAssests = await cloudinary.search.expression(
            "folder:" + id + "/profileImage",

        ).execute()


        const allUserIdAssestsIds = allUserIdAssests.resources.filter((item) => {
            return item.asset_id === assest_id
        })

        console.log("hello")
        console.log(allUserIdAssestsIds)

        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIds[0].public_id)
        return res.status(200).json({ message: "Delete Successfully" })





    } catch (err) {
        return res.status(500).json({ message: "Not delete!!!!" + err })


    }
})




//save usr information

router.post("/user/i/b/y9y5y0q3eztm3ibcd8z0/bum6ozd9m1sw4w9fbxea/amqvdkbe49sn4u3cvsvt/e5ce6ba3miamapdl7wyv/:id", async (req, res) => {
    try {

        // const { _id } = req.user
        const token = req.params.id
        const { username, fname, lname, gender, address, city, country, postalCode, college, stream, degree, position, aboutMe } = req.body


        const _id = await jwt.verify(token, KEY)

        if (!username || !fname || !lname || !gender || !address || !city || !country || !postalCode || !aboutMe || !college || !stream || !degree || !position) {
            res.status(401).json({ message: "Please fill all the fields" })
            return

        }
        else {

            const IsUserInfoAvaila = await new Post(
                {
                    username,
                    fname,
                    lname,
                    gender,
                    address,
                    city,
                    country,
                    postalCode,
                    aboutMe,
                    college, stream,
                    degree,
                    position,
                    googleId: _id
                })
            const userInfo = {
                username,
                fname,
                lname,
                gender,
                address,
                city,
                country,
                postalCode,
                aboutMe,
                college, stream,
                degree,
                position,
                googleId: _id
            }



            const checkUserAlreadyExit = await Post.findOneAndUpdate({ googleId: _id.valueOf() }, req.body)



            if (checkUserAlreadyExit) {


                return res.status(200).json({ message: "Successfull Update" })
            }
            else {


                IsUserInfoAvaila.save((err) => {
                    if (err) {
                        return res.status(500).json({ message: "Profile not created, try again" })
                    }
                    else {
                        return res.status(200).json({ message: "Profile Successfull Created" })
                    }
                })
            }
        }

        // res.status(200).json({ message: "Successfull send" })


    } catch (err) {
        return res.status(401).json({ message: "not created!!!!" })

    }

})


router.get("/user/083525p7ljhwmxifts31/l66cbrsuytmj1wujuauz/nqoye5ozdqj89b4s4qoq/ua1iztaxjo4bbmzvd391/3mzqeygnoszlknp90h51/t28uf00khscofxgjwj20/:id", async (req, res) => {
    try {



        // const _id = req.params.id

        const token = req.params.id

        //verify token for current user
        const { _id } = await jwt.verify(token, KEY)
        const userInformationLoadFromServer = await Post.findOne({ googleId: _id })




        res.status(200).json({ message: userInformationLoadFromServer })


    } catch (err) {
        res.status(500).json({ message: "error occured, check internet connection!!!" })

    }
})





//-----------------------------------BACKGROUND IMAGES --------------------------

router.post("/user/blob/image/bg/S6MjFqeb8HdJRGjkUs9W/QUCzIb1mKtMevddN24yB/YWYhtXwEEtUlHu0Nkhmq/eAQCSzpYo28SJxXCMV4d/yR3VTmMynJw6N3xlS530/WpsJsZKo4hGf18jaWmZL/:id", async (req, res) => {
    try {

        // const { _id } = req.user
        const { data } = req.body
        const token = req.params.id
        const { _id } = await jwt.verify(token, KEY)
        const id = _id
        const uploadResponse = await cloudinary.uploader.upload(data, {
            folder: `${id}/background`,
            public_id: id,
            resource_type: "image",
            timeout: 100000,
            // overwrite: true,
            // use_filename: true,
            // unique_filename: false,
            // chunk_size: 1000000,
            invalidate: true,
            phash: true
        })
        console.log({ uploadResponse })


        //pass the image url to Detecteing image
        const returnValue = await DetectImage(uploadResponse.url)
        const FilterData = returnValue.find((item) => {
            return (item.className === "Sexy" && item.probability >= 0.5) || (item.className === "Porn" && item.probability >= 0.5) || (item.className === "Hentai" && item.probability >= 0.50)
        })



        //if image is not  contain voilence stuff
        if (FilterData === undefined) {
            // pusher.trigger("profileImage", "profileImageMessage", { uploadResponse })

            return res.status(200).json({ message: "Uploaded Successfully", data: { url: uploadResponse.url, asset_id: uploadResponse.asset_id } })

        }
        //if image content voilnce stuff
        if (FilterData !== undefined) {

            if (FilterData.className === "Sexy" || FilterData.className === "Porn" || FilterData.className === "Hentai") {


                //delete the image which is saved on cloudianry,
                //disadvntage is that it is also remove previous image which is uploaded
                //this is fixed in production envirnment, to create a url for image with heroku domain
                await cloudinary.uploader.destroy(uploadResponse.public_id)
                //show the message tro client

                return res.status(403).json({ message: "This is not allowed contain, violence stuff" })
            }
        }


    } catch (err) {
        res.status(401).json({ message: "not uploaded please try again!!!" })

    }
})

router.get("/bg/image/mwQgga2z5KfChXjuF1s0/r6dg0LqqWmCG4W5UQOTa/ftFhzft7YNwT6jb9EVoX/ogvnbpOcPnjgMatu3mtb/JSC2PQZQVlK19QXDbSl1/:id", async (req, res) => {
    try {




        // const id = req.params.id
        // console.log({id})
        const token = req.params.id

        //verify token for current user
        const { _id } = await jwt.verify(token, KEY)


        const result = await cloudinary.search.expression(
            "folder:" + `${_id}/background`,
        )
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()






        return res.status(200).json({ url: result.resources[0].url, assest_id: result.resources[0].asset_id })

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
})



router.delete("/delete/assest/bg/:id", async (req, res) => {
    try {

        const { uploadImageDataFromBackground } = req.body
        // const { public_id } = req.body
        console.log(uploadImageDataFromBackground)

        // const uploadResponse =await  cloudinary.uploader.destroy(asset_id)
        const id = req.params.id

        const allUserIdAssestsForBg = await cloudinary.search.expression(
            "folder:" + `${id}/background`,

        ).execute()


        const allUserIdAssestsIdsDeletForBackground = allUserIdAssestsForBg.resources.filter((item) => {
            return item.asset_id === uploadImageDataFromBackground.assest_id
        })
        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIdsDeletForBackground[0].public_id)
        return res.status(200).json({ message: "Delete Successfully", data: allUserIdAssestsIdsDeletForBackground })





    } catch (err) {
        return res.status(401).json({ message: "not deleted!!!" + err })

    }
})


//=======================USER COMMENTS===============

router.get("/root/load/all/comments/:commentId/:userId", async (req, res) => {
    try {
        // const { _id } = req.user
        // console.log(req.params)
        const { commentId, userId } = req.params
        console.log({ commentId, userId })
        const AllUsersComments = await Comments.find({
            $and: [{ post_id: commentId }, {
                userId
                    : userId
            }]
        })

        // console.log("all comment after new post upload")
        // console.log(AllUsersComments)

        if (AllUsersComments.length === 0) {
            return res.status(200).json({ message: "All comments", data: [] })

        }
        else {
            return res.status(200).json({ message: "All comments", data: AllUsersComments })


        }




    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
})




router.post("/post/comment/save", async (req, res) => {
    try {

        const userId = req.params.commentId

        const UserComments = await new Comments(req.body)

        UserComments.save((err) => {
            if (err) {
                return res.status(500).json({ message: "Something error occured" })
            }
            return res.status(200).json({ message: "Comments added successfully", data: req.body })
        })



    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })


    }
})






router.delete("/post/comment/delete/:id", async (req, res) => {
    try {
        const { id } = req.params
        const deleteComment = await Comments.findOneAndDelete({ uuid: id })
        if (deleteComment) {
            const GetAllComments = await Comments.find({})
            const filterNonDeleteData = GetAllComments.filter((item) => {
                return item.uuid !== id
            })

            return res.status(200).json({ message: "Comment deleted successfully", data: filterNonDeleteData })
        }
        // return res.status(200).json({message:"delete comment successfully",data:deleteComment})
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })
    }
})



router.put("/update/comment/:id", async (req, res) => {
    try {

        const { id } = req.params
        const { text } = req.body
        const updateComment = await Comments.findOneAndUpdate({ uuid: id }, { $set: { body: text } })
        if (updateComment) {
            const GetAllComments = await Comments.find({})
            return res.status(200).json({ message: "Comment updated successfully", data: GetAllComments })
        }


    } catch (error) {
        return res.status(500).json({ message: "Something error occured" + error })

    }
})






//USERS POST SAVE AND LOAD

router.post("/users/post/:id", async (req, res) => {

    try {



        let array = []
        const postId = req.params.id
        const { text, image, privacy, post_id, time } = req.body
        console.log({ image })
        const data = image
        const userId = postId.split("-")[0]
        if (image || text) {
            if (image) {

                cloudinary.uploader.upload(image, {
                    folder: `${userId}/post`,
                    public_id: `${post_id}`,
                    timeout: 60000,


                }, async (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: "Not Uploaded, Try Again" + err })
                    }
                    else {



                        //GET ALL POST AFTER INE IMAGE SAVE
                        cloudinary.search.expression(
                            "folder:" + `${userId}/post`,
                        ).sort_by('public_id', 'desc').execute(async (err, result) => {

                            //IF RESOURCE FOLDER IS NOT EMPTY

                            if (result.resources.length > 0) {

                                array.push(result.resources)
                                if (result.resources.length > 0) {



                                    //Now check text is exit or not 
                                    if (text) {
                                        const userTextPost = await new TextPost({
                                            post_id: post_id,
                                            text: text,
                                            privacy: privacy,
                                            userId: userId,
                                            createdAt: time

                                        })

                                        userTextPost.save(async (err) => {
                                            if (err) {
                                                return res.status(500).json({ message: "Something error occured" })
                                            }
                                            else {
                                                //find all the text post after save new text post 
                                                const allTextPost = await TextPost.find({})
                                                if (allTextPost.length > 0) {
                                                    array.push(allTextPost)
                                                    return res.status(200).json({ message: "Post added successfully", data: array })

                                                }


                                            }

                                        })
                                    }
                                }
                            }

                            //IF INTIALY RESOURCES IS EMPTY THEN ONLY TEXT POST WILL BE ADDED
                            else if (result.resources.length === 0) {
                                array.push(result)

                                //if text is not empty

                                if (text) {
                                    const userTextPost = await new TextPost({
                                        post_id: post_id,
                                        text: text,
                                        privacy: privacy,
                                        userId: userId,
                                        createdAt: time

                                    })

                                    userTextPost.save(async (err) => {
                                        if (err) {
                                            return res.status(500).json({ message: "Something error occured" })
                                        }
                                        else {
                                            //find all the text post after save new text post 
                                            const allTextPost = await TextPost.find({})
                                            if (allTextPost.length > 0) {
                                                array.push(allTextPost)
                                                return res.status(200).json({ message: "Post added successfully", data: array })

                                            }


                                        }

                                    })
                                }

                            }

                        })



                    }
                })
            }


            //if image is empty but text is not empty

            else if (text) {

                cloudinary.search.expression(
                    "folder:" + `${userId}/post`,
                ).sort_by('public_id', 'desc').execute(async (err, result) => {
                    if (result.resources.length > 0) {
                        array.push(result.resources)
                        if (result.resources.length > 0) {

                            // array.push(result.resources)
                            // array.push(result)
                            if (text) {
                                const userTextPost = await new TextPost({
                                    post_id: post_id,
                                    text: text,
                                    privacy: privacy,
                                    userId: userId,
                                    createdAt: time

                                })

                                userTextPost.save(async (err) => {
                                    if (err) {
                                        return res.status(500).json({ message: "Something error occured" })
                                    }
                                    else {
                                        const TakeAllTextPost = await TextPost.find({})
                                        if (TakeAllTextPost.length > 0) {

                                            array.push(
                                                TakeAllTextPost
                                            )
                                            return res.status(200).json({ message: "Post added successfully", data: array })
                                        }
                                    }

                                })
                            }
                        }
                    }


                })


            }




        }


    } catch (error) {
        return res.status(500).json({ message: "Something Error Occurred" })

    }
})



router.get("/users/public/posts/:id", async (req, res) => {
    try {
        let array = []
        // const { id } = req.query
        console.log("isd", { _id: req.params.id })
        const result = await cloudinary.search.expression(
            "folder:" + `${req.params.id}/post`,
        ).execute()
        const UserTextPost = await TextPost.find({ userId: req.params.id })

        if (result.resources.length > 0) {
            array.push(result.resources)
        }

        if (UserTextPost.length > 0) {
            array.push(UserTextPost)
        }

        return res.status(200).json({ message: "user posts", data: array })





    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })


    }
})



//DELETE THE POST BY SPECIf id

router.delete("/delete/user/post/:id", async (req, res) => {
    try {

        let array = []
        const { id } = req.params


        // console.log(id)
        // console.log(req.params.id)
        const userId = id.split("-")[0]
        // console.log("user id")
        // console.log(req.body)

        const { public_id } = req.body
        // console.log(public_id.split("/")[0])
        const userId1 = public_id.split("/")[0]
        // console.log(userId1)


        cloudinary.search.expression(
            "folder:" + `${userId1}/post`,




        ).execute(async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Something error occured inth" + err })
            }
            else {
                if (result.resources.length > 0) {
                    result.resources.filter((item) => {
                        if (item.public_id === public_id) {
                            cloudinary.uploader.destroy(item.public_id, async (err, result) => {
                                if (err) {
                                    return res.status(500).json({ message: "Something error occured" + err })
                                }
                                else {
                                    const deletePost = await TextPost.findOneAndDelete({ post_id: id })
                                    await Noti.findOneAndDelete({ post_id: id })

                                    if (deletePost) {
                                        const
                                            GetAllPosts = await TextPost.find({})
                                        const filterNonDeleteData = GetAllPosts.filter((item) => {
                                            return item.post_id !== id
                                        })

                                        array.push(filterNonDeleteData)


                                    }

                                }
                            })
                        }
                    })
                }
                else {
                    const deletePost = await TextPost.findOneAndDelete({ post_id: id })
                    if (deletePost) {
                        const GetAllPosts = await TextPost.find({})
                        await Noti.findOneAndDelete({ post_id: id })
                        const filterNonDeleteData = GetAllPosts.filter((item) => {
                            return item.post_id !== id
                        })
                        array.push(filterNonDeleteData)
                        // return res.status(200).json({ message: "Post deleted successfully", data: filterNonDeleteData })
                    }
                    return res.status(200).json({ message: "Post deleted successfully", data: array })
                }
            }
        })






        // return res.status(200).json({message:"delete comment successfully",data:deleteComment})

    } catch (error) {
        return res.status(500).json({ message: "Something error occured" + error })
    }
})








//==================================save user post into the mongodb  by local url=========================

router.post("/local/url/:id", async (req, res) => {
    try {
        // console.log(res.body)
        const token = req.params.id
        const { _id } = await jwt.verify(token, KEY)
        const id = _id
        const { text, image, name, privacy, post_id, time, fileType, likes_count, liked, userProfileImageUrl } = req.body
        console.log("user post")
        console.log(req.body)
        console.log("file type")
        console.log(fileType)


        //filter the local image url
        const filterUrl = image.split("blob")[1].slice(1)




        const SaveUserPosts = await new TextPost({
            username: name,
            text: text,
            image: image,
            fileType: fileType,
            privacy: privacy,
            post_id: post_id,
            userId: id,
            profileImage: userProfileImageUrl,
            likes_count: likes_count,
            liked: liked,
            post_url: "http://localhost:5000/blob/user/post/" + post_id,

            createdAt: time,

        })
        console.log({ SaveUserPosts })
        // await TextPost.dropIndexes({index:"*"})


        SaveUserPosts.save(async (err) => {
            if (err) {
                console.log(err)
                return res.status(500).json({ message: "Not Post" + err })
            }
            else {
                //send all user post by Id
                const GetAllUserPost = await TextPost.find({ $or: [{ userId: id }, { privacy: "public" }] })
                await pusher.trigger("AddPost", "AddPostMessage", {
                    GetAllUserPost: GetAllUserPost.reverse()
                }, req.body.socketId);

                console.log("hello worrld")

                console.log({ GetAllUserPost })
                return res.status(200).json({ message: "Posted Successsfully", data: GetAllUserPost.reverse() })

                // return res.end()
            }
        })
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })
    }
})



//Each post url for share the post or download the post
router.get("/user/post/:post_id", async (req, res) => {
    try {
        const { post_id } = req.params

        const post = await TextPost.findOne({ post_id: post_id })
        return res.status(200).json({ post_url: post })


    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
})




// ===================================SAVE all the user post into the mongodb  by local url=========================
//load the user post

router.get("/load/all/post/:id", async (req, res) => {
    try {
        const token = req.params.id
        const { _id } = await jwt.verify(token, KEY)

        //get all post by userId 
        const GetAllUserPost = await TextPost.find({ $or: [{ userId: _id }, { privacy: "public" }] })
        const GetAllUserPost1 = GetAllUserPost.filter((item) => {
            return
        })
        return res.status(200).json({ message: "successfull load", data: GetAllUserPost.reverse() })
    } catch (error) {

        return res.status(500).json({ message: "Something error occured" + error })
    }
})


//delete the user post

router.delete("/delete/user/post/local/:id", async (req, res) => {
    try {
        const id = req.params.id
        console.log({ id })
        const { userId } = req.body

        console.log("user deleletd this")
        console.log({ userId })
        console.log({ id })
        const deletePost = await TextPost.findOneAndDelete({ $and: [{ post_id: id }, { userId: userId }] })
        await Noti.findOneAndDelete({ $and: [{ post_id: id }, { userId: userId }] })



        // console.log("deleted response is ", deletePost)
        // console.log(deletePost)
        if (deletePost) {

            //delete all comment related to post
            await Comments.deleteMany({
                post_id
                    : id
            })
            //getallpost after delete
            const GetAllPostsAfterDelete = await TextPost.find({})
            console.log({ GetAllPostsAfterDelete })

            const allNotiAfterDelete = await Noti.find({})

            pusher.trigger("DeletePost", "PostDeleted", { GetAllPostsAfterDelete: GetAllPostsAfterDelete.reverse() }, req.body.socketId)
            pusher.trigger("DeleteNotiByPost", "DeleteNotiMessage", { allNotiAfterDelete }, req.body.socketId)

            return res.status(200).json({ message: "Post deleted successfully", data: GetAllPostsAfterDelete.reverse() })
        }
        else {
            return res.status(200).json({ message: "you can not delete this." })
        }

    } catch (error) {
        return res.status(500).json({ message: "Something error occured" + error })

    }
})


//take all the number of comment for current use

router.get("/all/comment/user/:id", async (req, res) => {
    try {
        // const id = req.params.id
        // console.log({ id })
        const token = req.params.id

        //verify token for current user
        const { _id } = await jwt.verify(token, KEY)

        const { post_id } = req.body
        const GetAllComment = await Comments.find({ userId: _id })
        await pusher.trigger("updateComment", "updateCommentMessage", { GetAllComment: GetAllComment.reverse() }, req.body.socketId)
        return res.status(200).json({ message: "successfull load", data: GetAllComment.reverse() })


    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })


    }
})


// ============================================//LIKE AND UNLIKE COUNT////////////////////////////////////////////////////////

router.put("/user/like/:post_id", async (req, res) => {
    try {

        const { post_id } = req.params
        const { likeTo, likedBy } = req.body
        console.log(req.body)
        // console.log({ id })]
        console.log(post_id)
        console.log(likeTo)
        console.log(likedBy)


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
                    const {image}= await TextPost.findOne({post_id})

                    //jisne post like ki hai uski info ko save kr lete hai
                    const SaveNoti = await Noti({
                        name: fname + " " + lname,
                        url: url,
                        post_id: post_id,
                        likeTo,
                        likedBy,
                        postImageURL:image
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


router.get("/load/userliked/details/:id", async (req, res) => {
    try {
        const userId = req.params.id
        console.log({ userId })
        console.log("loked")

        // find user details which liked post
        const userDetailsFind = await Post.findOne({ googleId: userId })
        const UserProfileImage = await cloudinary.search.expression(
            "folder:" + userId + "/profileImage")
            .sort_by('created_at', 'desc')
            .execute()

        console.log("user proifile image")
        console.log(UserProfileImage)
        // pusher.trigger("userDetails", 'message1', {
        //     userDetailsFind,
        //     UserProfileImage
        // }, req.body.socketId);
        return res.status(200).json({ message: "successfull", data: [userDetailsFind, UserProfileImage] })


    } catch (err) {

        return res.status(500).json({ message: "somethinng error occured" + err })

    }
}
)


router.get("/search/", async (req, res) => {
    try {
        const { q } = req.query
        // console.log("query data")
        // console.log(q)
        const keys = ["fname", "lname", "email"]
        const search = (data) => {
            return data.filter((item) => {
                // keys.some((key) => item[key].toLowerCase().includes(q))
                return item.fname.toLowerCase().includes(q)
            })
        }
        // { name: { $regex: q, $options: 'i' } }
        const searchResult = await Post.find({})
        return res.status(200).json(search(searchResult.splice(0, 10)))

    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" + err })
    }
})


//load the all notification
router.get("/load/all/notification/:id", async (req, res) => {
    try {
        const token = req.params.id
        const { _id } = await jwt.verify(token, KEY)
        const result = await Noti.find({ userId: _id })
        console.log({ result })
        return res.status(200).json({ message: "successfull", data: result })


    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" })

    }
})


//change visibilty of any post
router.put("/visibility/user/post/local/:post_id", async (req, res) => {
    try {
        const { post_id } = req.params
        const { visibility } = req.body
        TextPost.findOneAndUpdate({ post_id }, { privacy: visibility }, { new: true }, async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "somethinng error occured" + err })
            }
            else {
                const allPost = await TextPost.find({})
                return res.status(200).json({ message: "successfull", data: allPost })
            }
        })


    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" + err })


    }


})



//update the privay of any post
router.put("/api/setPrivacy/:post_id", async (req, res) => {
    try {
        const { post_id } = req.params
        const { privacy } = req.body
        TextPost.findOneAndUpdate({ post_id }, { privacy }, { new: true }, async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "somethinng error occured" + err })
            }
            else {
                const allPost = await TextPost.find({})
                return res.status(200).json({ message: "successfull", data: allPost })
            }
        })
    }
    catch (err) {
        return res.status(500).json({ message: "somethinng error occured" + err })
    }
})
module.exports = router;