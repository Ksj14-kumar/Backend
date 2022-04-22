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


let Pusher = require('pusher');
let pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTLS: true
});







//==============================library import end===================







exports.profileImagePost = async (req, res) => {
    try {
        const _id = req._id
        const { data, url } = req.body


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

}



exports.getProfileImage = async (req, res) => {
    try {


        const _id = req._id
        const result = await cloudinary.search.expression(
            "folder:" + _id + "/profileImage",
        )
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()
        res.status(200).json({ url: result.resources[0].url, assest_id: result.resources[0].asset_id })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Something Error  Occured" })

    }
}


exports.getStrategyImages = async (req, res) => {

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
}


exports.DeleteAssestsProfileImage = async (req, res) => {
    try {
        const { assest_id } = req.body

        const id = req._id


        // const uploadResponse =await  cloudinary.uploader.destroy(asset_id)

        const allUserIdAssests = await cloudinary.search.expression(
            "folder:" + id + "/profileImage",
        ).execute()
        const allUserIdAssestsIds = allUserIdAssests.resources.filter((item) => {
            return item.assest_id === assest_id
        })
        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIds[0].public_id)
        return res.status(200).json({ message: "Delete Successfully" })
    } catch (err) {
        return res.status(500).json({ message: "Not delete!!!!" })


    }
}


exports.saveUserInformation = async (req, res) => {
    try {

        const _id = req._id

        const { UserProfileInformationm } = req.body
        const { username, fname, lname, gender, address, city, country, postalCode, college, stream, degree, position, aboutMe } = UserProfileInformationm

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



            const checkUserAlreadyExit = await Post.findOneAndUpdate({ googleId: _id }, req.body.UserProfileInformationm, { new: true, upsert: true })



            if (checkUserAlreadyExit) {


                return res.status(200).json({ message: "Successfull Update", data: checkUserAlreadyExit })
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

}



exports.getUserInformation = async (req, res) => {
    try {



        const _id = req._id
        const userInformationLoadFromServer = await Post.findOne({ googleId: _id })
        res.status(200).json({ message: userInformationLoadFromServer })
    } catch (err) {
        res.status(500).json({ message: "error occured, check internet connection!!!" })

    }
}


exports.backgroundImagePost = async (req, res) => {
    try {

        // const { _id } = req.user
        const { data } = req.body
        const id = req._id

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

                await cloudinary.uploader.destroy(uploadResponse.public_id)
                //show the message tro client

                return res.status(403).json({ message: "This is not allowed contain, violence stuff" })
            }
        }
    } catch (err) {
        res.status(401).json({ message: "not uploaded please try again!!!" })
    }
}

exports.getBackgroundImage = async (req, res) => {
    try {
        const _id = req._id
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
}

exports.DeleteAssestsBackgroundImage = async (req, res) => {
    try {

        const { uploadImageDataFromBackground } = req.body
        console.log(uploadImageDataFromBackground)
        const id = req._id
        const allUserIdAssestsForBg = await cloudinary.search.expression(
            "folder:" + `${id}/background`,
        ).execute()
        const allUserIdAssestsIdsDeletForBackground = allUserIdAssestsForBg.resources.filter((item) => {
            return item.assest_id === uploadImageDataFromBackground.assest_id
        })
        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIdsDeletForBackground[0].public_id)
        return res.status(200).json({ message: "Delete Successfully", data: allUserIdAssestsIdsDeletForBackground })





    } catch (err) {
        return res.status(401).json({ message: "not deleted!!!" + err })

    }
}


exports.loadComments = async (req, res) => {
    try {
        // const { _id } = req.user
        // console.log(req.params)
        const { post_id, userId } = req.params
        const { value } = req.params
        console.log({ post_id, userId })
        const AllUsersComments = await Comments.find({
            post_id: post_id
        }).limit(+value)

        const AllUsersCommentslength = await Comments.find({
            post_id: post_id
        })
        console.log(+value)

        // console.log("all comment after new post upload")
        // console.log(AllUsersComments)

        if (AllUsersComments.length === 0) {
            return res.status(200).json({ message: "All comments", data: [] })

        }
        else {
            return res.status(200).json({ message: "All comments", data: AllUsersComments, length: AllUsersCommentslength.length })


        }




    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
}

exports.saveComment = async (req, res) => {
    try {

        const userId = req.params.commentId
        console.log(req.body)
        const { comment } = req.body


        const UserComments = await Comments(comment)

        UserComments.save((err) => {
            if (err) {
                return res.status(500).json({ message: "Something error occured" })
            }
            return res.status(200).json({ message: "Comments added successfully", data: req.body })
        })



    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })


    }
}


exports.deleteComment = async (req, res) => {
    try {
        const id = req.params.commentId
        const { post_id } = req.body
        const deleteComment = await Comments.findOneAndDelete({ $and: [{ uuid: id }, { post_id }] })
        if (deleteComment) {
            const GetAllComments = await Comments.find({ post_id })
            const filterNonDeleteData = GetAllComments.filter((item) => {
                return item.uuid !== id
            })

            return res.status(200).json({ message: "Comment deleted successfully", data: filterNonDeleteData })
        }
        // return res.status(200).json({message:"delete comment successfully",data:deleteComment})
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })
    }
}

exports.updateComment = async (req, res) => {
    try {

        const { commentId } = req.params
        const { text, post_id } = req.body
        const updateComment = await Comments.findOneAndUpdate({ uuid: commentId }, { $set: { body: text } }, { new: true })
        if (updateComment) {
            const GetAllComments = await Comments.find({ post_id })
            return res.status(200).json({ message: "Comment updated successfully", data: GetAllComments })
        }


    } catch (error) {
        return res.status(500).json({ message: "Something error occured" + error })

    }
}


exports.saveUserPostIntoCloudinary = async (req, res) => {

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
}


exports.getUserPublicPostintoCloudinary = async (req, res) => {
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
}

exports.deleteUserPostByCloudinary = async (req, res) => {
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
}


//===============================pos store into local storage-=====

exports.saveUserPostIntoMongoDB = async (req, res) => {
    try {
        const id = req._id


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
                // await pusher.trigger("AddPost", "AddPostMessage", {
                //     GetAllUserPost: GetAllUserPost.reverse()
                // }, req.body.socketId);

                // console.log("hello worrld")


                // console.log({ GetAllUserPost })
                return res.status(200).json({ message: "Posted Successsfully", data: GetAllUserPost.reverse() })

                // return res.end()
            }
        })
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })
    }
}

exports.GetPostFromMongoDb = async (req, res) => {
    try {
        const { post_id } = req.params

        const post = await TextPost.findOne({ post_id: post_id })
        return res.status(200).json({ post_url: post })


    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
}


exports.loadAllUserPost = async (req, res) => {
    try {
        const _id = req._id
        const { value } = req.params
        console.log({ value: +value })
        // const { _id } = await jwt.verify(token, KEY)

        //get all post by userId 
        const GetAllUserPost = await TextPost.find({ $or: [{ userId: _id }, { privacy: "public" }] }).limit(+value)
        const GetAllUserPost1 = GetAllUserPost.filter((item) => {
            return
        })
        return res.status(200).json({ message: "successfull load", data: GetAllUserPost.reverse() })
    } catch (error) {

        return res.status(500).json({ message: "Something error occured" + error })
    }
}

exports.deleteUserPostByMongoDB = async (req, res) => {
    try {

        const id = req._id


        const { userId, post_id } = req.body


        const deletePost = await TextPost.findOneAndDelete({ $and: [{ post_id: post_id }, { userId: userId }] })
        await Noti.findOneAndDelete({ $and: [{ post_id: post_id }, { userId: userId }] })
        // console.log("deleted response is ", deletePost)
        console.log(deletePost)
        if (deletePost) {

            //delete all comment related to post
            await Comments.deleteMany({
                post_id
                    : post_id
            })
            //getallpost after delete
            const GetAllPostsAfterDelete = await TextPost.find({})
            console.log({ GetAllPostsAfterDelete })

            const allNotiAfterDelete = await Noti.find({})

            // pusher.trigger("DeletePost", "PostDeleted", { GetAllPostsAfterDelete: GetAllPostsAfterDelete.reverse() }, req.body.socketId)
            // pusher.trigger("DeleteNotiByPost", "DeleteNotiMessage", { allNotiAfterDelete }, req.body.socketId)

            return res.status(200).json({ message: "Post deleted successfully", data: GetAllPostsAfterDelete.reverse() })
        }
        else {
            return res.status(200).json({ message: "Deleted Successfully." })
        }

    } catch (error) {
        return res.status(500).json({ message: "Something error   occured" + error })

    }
}


exports.getAllCommentNumber = async (req, res) => {
    try {
        const _id = req._id
        // console.log({ id })
        const token = req.params.id

        //verify token for current user
        // const { _id } = await jwt.verify(token, KEY)

        const { post_id } = req.body
        const GetAllComment = await Comments.find({ userId: _id })
        await pusher.trigger("updateComment", "updateCommentMessage", { GetAllComment: GetAllComment.reverse() }, req.body.socketId)
        return res.status(200).json({ message: "successfull load", data: GetAllComment.reverse() })


    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })


    }
}


exports.privacy = async (req, res) => {
    try {
        const { post_id } = req.params
        const { visibility } = req.body
        TextPost.findOneAndUpdate({ post_id }, { privacy: visibility }, { new: true }, async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "somethinng error occured" + err })
            }
            else {
                const allPost = await TextPost.find({})
                return res.status(200).json({ message: "successfull", data: allPost.reverse() })
            }
        })


    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" + err })


    }


}

exports.likedPost = async (req, res) => {
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

exports.search = async (req, res) => {
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
}

exports.loadAllNoti = async (req, res) => {
    try {


        const _id = req._id
        // const { _id } = await jwt.verify(token, KEY)
        const result = await Noti.find({ likeTo: _id })
        console.log({ result })
        return res.status(200).json({ message: "successfull", data: result })


    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" })

    }
}

exports.setPrivacy = async (req, res) => {
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
}