
const router = require("express").Router()

const multer = require('multer');
const { isAuth } = require("../Auth/auth");
const path = require("path")
const { promises, rmdirSync } = require("fs");
const { cloudinary } = require("../Cloudnary/cloudnary");
const GoogleDb = require("../db/googledb")
const Post = require("../db/UserData");
const Comments = require("../db/Comments");
const TextPost = require("../db/TextPost");





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
        const _id = req.params.id

        const { data } = req.body

        const DirectoryAlreadyExit = await cloudinary.search.expression(
            "folder:" + _id,


        ).execute()



        // DirectoryAlreadyExit.resources[0].folder

        if (DirectoryAlreadyExit.resources.length > 0) {

            const uploadResponseProfile = await cloudinary.search.expression(
                "folder:" + _id + "/profileImage" ,
            ).execute()


            // uploadResponseProfile.resources[0].folder
            if (uploadResponseProfile.resources.length > 0) {
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

                return res.status(200).json({ message: "Uploaded Successfully", data: uploadResponse })

            }
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
                return res.status(200).json({ message: "Uploaded Successfully", data: uploadResponse })
            }
        }
        else {
            const uploadResponse = await cloudinary.uploader.upload(data, {
                folder: _id + "/profileImage",
                public_id: _id,


            })


            if (uploadResponse) {

                const uploadResponseProfileData = await cloudinary.search.expression(
                    "folder:" + _id + "/profileImage",


                ).execute()
                if (uploadResponseProfileData.resources.length > 0) {
                    const uploadResponseProfile = await cloudinary.uploader.upload(data, {
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
                    return res.status(200).json({ message: "Uploaded Successfully", data: uploadResponseProfile })

                }
                else {
                    const uploadResponseProfile = await cloudinary.uploader.upload(data, {
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
                    return res.status(200).json({ message: "Uploaded Successfully", data: uploadResponseProfile })
                }
            }



        }



    }


    catch (err) {
        res.status(499).json({ message: "not uploaded please try again" })
    }


})



// =====================================get the profile images===========

router.get("/profile/image/e9thhvkKqJpnTlYo1sQl/QVbghZqhoSr2Rt5qvNYJ/iKj3RoJojFWmcDo4wTlm/9Olk5vTenhdkjHrdYEWl/:id", async (req, res) => {
    try {

        // const { _id } = req.user
        const _id = req.params.id




        // UserBlob/
        const result = await cloudinary.search.expression(
            "folder:" + _id + "/profileImage",

        )
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()

        // const publicIds = result.map(resource => resource.public_id)


        res.status(200).json({ parseData: result })



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

router.delete("/delete/assest/", async (req, res) => {
    try {
        const { uploadImageDataFromServer } = req.body
        const { public_id } = req.body

        // const uploadResponse =await  cloudinary.uploader.destroy(asset_id)

        const allUserIdAssests = await cloudinary.search.expression(
            "folder:" + req.user._id + "/profileImage",

        ).execute()


        const allUserIdAssestsIds = allUserIdAssests.resources.filter((item) => {
            return item.asset_id === uploadImageDataFromServer[0].asset_id
        })

        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIds[0].public_id)
        return res.status(200).json({ message: "Delete Successfully", data: allUserIdAssestsIds })





    } catch (err) {
        return res.status(500).json({ message: "Not delete!!!!" })


    }
})



router.post("/user/i/b/y9y5y0q3eztm3ibcd8z0/bum6ozd9m1sw4w9fbxea/amqvdkbe49sn4u3cvsvt/e5ce6ba3miamapdl7wyv", async (req, res) => {
    try {

        const { _id } = req.user
        const { username, fname, lname, gender, address, city, country, postalCode, college, stream, degree, position, aboutMe } = req.body



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

        const _id = req.params.id
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
        const id = req.params.id
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
        return res.status(200).json({ message: "Uploaded Successfully", data: uploadResponse })
    } catch (err) {
        res.status(401).json({ message: "not uploaded please try again!!!" })

    }
})

router.get("/bg/image/mwQgga2z5KfChXjuF1s0/r6dg0LqqWmCG4W5UQOTa/ftFhzft7YNwT6jb9EVoX/ogvnbpOcPnjgMatu3mtb/JSC2PQZQVlK19QXDbSl1/:id", async (req, res) => {
    try {




        const id = req.params.id
        console.log(id)
        const result = await cloudinary.search.expression(
            "folder:" + `${id}/background`,
        )
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()

        console.log(result)




        return res.status(200).json({ parseData: result })











    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
})



router.delete("/delete/assest/bg", async (req, res) => {
    try {

        const { uploadImageDataFromBackground } = req.body
        const { public_id } = req.body

        // const uploadResponse =await  cloudinary.uploader.destroy(asset_id)

        const allUserIdAssestsForBg = await cloudinary.search.expression(
            "folder:" + `${req.user._id}/background`,

        ).execute()


        const allUserIdAssestsIdsDeletForBackground = allUserIdAssestsForBg.resources.filter((item) => {
            return item.asset_id === uploadImageDataFromBackground[0].asset_id
        })

        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIdsDeletForBackground[0].public_id)

        return res.status(200).json({ message: "Delete Successfully", data: allUserIdAssestsIdsDeletForBackground })





    } catch (err) {
        return res.status(401).json({ message: "not deleted!!!" })

    }
})


//=======================USER COMMENTS===============

router.get("/root/load/all/comments/:commentId/:userId", async (req, res) => {
    try {
        // const { _id } = req.user
        console.log(req.params)
        const { commentId, userId } = req.params
        const AllUsersComments = await Comments.find({
            $and: [{ post_id: commentId }, {
                userId
                    : userId
            }]
        })

        console.log("all comment after new post upload")
        console.log(AllUsersComments)

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


        console.log(id)
        console.log(req.params.id)
        const userId = id.split("-")[0]
        console.log("user id")
        console.log(req.body)

        const { public_id } = req.body
        console.log(public_id.split("/")[0])
        const userId1 = public_id.split("/")[0]
        console.log(userId1)


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

                                    if (deletePost) {
                                        const GetAllPosts = await TextPost.find({})
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
        console.log(res.body)
        const id = req.params.id
        const { text, image, privacy, post_id, time, fileType } = req.body
        console.log(req.body)
        console.log("file type")
        console.log(fileType)
        const SaveUserPosts = await new TextPost({
            username: "SAnju",
            text: text,
            image: image,
            fileType: fileType,
            privacy: privacy,
            post_id: post_id,
            userId: id,
            createdAt: time,

        })
        console.log({SaveUserPosts})

        SaveUserPosts.save(async (err) => {
            if (err) {
                return res.status(500).json({ message: "Not post" })
            }
            else {
                const GetAllUserPost = await TextPost.find({})
                return res.status(200).json({ message: "Posted Successsfully", data: GetAllUserPost.reverse() })
            }
        })



    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })

    }

})






// ===================================SAVE all the user post into the mongodb  by local url=========================
//load the user post

router.get("/load/all/post/:id", async (req, res) => {
    try {
        const id = req.params.id
        const GetAllUserPost = await TextPost.find({})
        return res.status(200).json({ message: "successfull load", data: GetAllUserPost.reverse() })
    } catch (error) {

        return res.status(500).json({ message: "Something error occured" + error })
    }
})


//delete the user post

router.delete("/delete/user/post/local/:id", async (req, res) => {
    try {
        const id = req.params.id
        const deletePost = await TextPost.findOneAndDelete({ post_id: id })



        if (deletePost) {
            const DeleteCommentRelatedToPost = await Comments.deleteMany({
                post_id
                    : id
            })
            const GetAllPostsAfterDelete = await TextPost.find({})




            return res.status(200).json({ message: "Post deleted successfully", data: GetAllPostsAfterDelete.reverse() })
        }

    } catch (error) {
        return res.status(500).json({ message: "Something error occured" + error })

    }
})


//take all the number of comment for current use

router.get("/all/comment/user/:id", async (req, res) => {
    try {
        const id = req.params.id
        const { post_id } = req.body
        const GetAllComment = await Comments.find({ userId: id })
        return res.status(200).json({ message: "successfull load", data: GetAllComment.reverse() })


    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })


    }
})



module.exports = router;