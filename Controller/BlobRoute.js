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
const Message = require("../db/Message")
const onlineUsers = require("../db/OnlineUser")


let Pusher = require('pusher');
const UserData = require("../db/UserData");
const { send } = require("process");
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
        console.log(_id)
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
            // console.log({ uploadResponse })
            if (FilterData === undefined) {
                await Post.findOneAndUpdate({ googleId: _id }, { $set: { url: uploadResponse.url } })
                await TextPost.findOneAndUpdate({ userId: _id }, { $set: { profileImage: uploadResponse.url } })
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
        // console.log(err)
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
        res.status(200).json({ url: result.resources.length > 0 && result.resources[0].url, assest_id: result.resources.length > 0 && result.resources[0].asset_id })
    } catch (err) {
        // console.log(err)
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
        // console.log(req.body)

        const { UserProfileInformation, url, uuid } = req.body

        const { username, fname, lname, gender, address, city, country, postalCode, college, stream, degree, position, aboutMe } = UserProfileInformation

        if (!username || !fname || !lname || !gender || !address || !city || !country || !postalCode || !aboutMe || !college || !stream || !degree || !position) {
            res.status(401).json({ message: "Please fill all the fields" })
            return

        }
        else {

            const IsUserInfoAvaila = await new Post(
                {
                    username,
                    fname: fname[0].toUpperCase() + fname.slice(1).toLowerCase(),
                    lname: lname[0].toUpperCase() + lname.slice(1).toLowerCase(),
                    gender: gender[0].toUpperCase() + gender.slice(1).toLowerCase(),
                    address: address.toLowerCase(),
                    city: city[0].toUpperCase() + city.slice(1).toLowerCase(),
                    country: country[0].toUpperCase() + country.slice(1).toLowerCase(),
                    postalCode,
                    url: url,
                    aboutMe,
                    college,

                    stream,
                    degree,
                    position,
                    googleId: _id,
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
                googleId: _id,
                url: url,
            }



            const checkUserAlreadyExit = await Post.findOneAndUpdate({ googleId: _id }, { ...req.body.UserProfileInformation, url }, { new: true, upsert: true })



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
        // console.log({ uploadResponse })


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
        // console.log(uploadImageDataFromBackground)
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
        // console.log({ post_id, userId })
        const AllUsersComments = await Comments.find({
            post_id: post_id
        }).limit(+value)

        const AllUsersCommentslength = await Comments.find({
            post_id: post_id
        })
        // console.log(+value)

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
        // console.log(req.body)
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
        const { text, image, privacy, post_id, time, fileType, name, userProfileImageUrl } = req.body
        // console.log(req.body)
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
                                                const allTextPost = await TextPost.find({
                                                    userId: postId
                                                })
                                                console.log(allTextPost)
                                                if (allTextPost.length > 0) {
                                                    array.push(allTextPost)
                                                    return res.status(200).json({ message: "Post added successfully", data: array })

                                                }


                                            }

                                        })
                                    }
                                    else {
                                        return res.status(200).json({ message: "success full added", data: array })
                                    }
                                }
                            }

                            //IF INTIALY RESOURCES IS EMPTY THEN ONLY TEXT POST WILL BE ADDED
                            else if (result.resources.length === 0) {
                                array.push(result)

                                //if text is not empty

                                if (text) {
                                    const userTextPost = await  TextPost({
                                        post_id: post_id,
                                        text: text,
                                        username:"",
                                        image:"",                              
                                        privacy: privacy,
                                        userId: userId,
                                        createdAt: time,
                                        fileType:"",
                                        profileImage:""


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
                                        return res.status(500).json({ message: "Something error occured in message" +err})
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
        return res.status(500).json({ message: "Something Error Occurred"+err })

    }
}


exports.getUserPublicPostintoCloudinary = async (req, res) => {
    try {
        let array = []
        // const { id } = req.query
        // console.log("isd", { _id: req.params.id })
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
        // console.log("user post")
        // console.log(req.body)
        // console.log("file type")
        // console.log(fileType)
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
        // console.log({ SaveUserPosts })
        // await TextPost.dropIndexes({index:"*"})


        SaveUserPosts.save(async (err) => {
            if (err) {
                // console.log(err)
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
        // console.log({ value: +value })
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
        // console.log(deletePost)
        if (deletePost) {

            //delete all comment related to post
            await Comments.deleteMany({
                post_id
                    : post_id
            })
            //getallpost after delete
            const GetAllPostsAfterDelete = await TextPost.find({})
            // console.log({ GetAllPostsAfterDelete })

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
        // console.log({ userId })
        // console.log("loked")

        // find user details which liked post
        const userDetailsFind = await Post.findOne({ googleId: userId })
        const UserProfileImage = await cloudinary.search.expression(
            "folder:" + userId + "/profileImage")
            .sort_by('created_at', 'desc')
            .execute()

        // console.log("user proifile image")
        // console.log(UserProfileImage)
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
        const id = req.params.id
        // const { _id } = await jwt.verify(token, KEY)

        const result = await Noti.find({
            $and: [{
                likeTo: _id
            }, { likedBy: { $ne: _id } }]
        }).sort({ $natural: -1 }).limit(5)
        // console.log({ result })
        return res.status(200).json({ message: "successfull", data: result })


    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" + err })

    }
}
exports.loadAllNotification = async (req, res) => {
    try {


        const _id = req._id
        const id = req.params.id

        // const { _id } = await jwt.verify(token, KEY)

        const result = await Noti.find({ $and: [{ likeTo: _id }, { likedBy: { $ne: _id } }] }).sort({ $natural: -1 })
        // console.log({ result })
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


exports.finduser = async (req, res) => {
    try {
        let getUserPost, ShowDot;
        const _id = req._id
        const { anotherUserId } = req.body

        // /get profile
        const ProfileImage = await cloudinary.search.expression(
            "folder:" + anotherUserId + "/profileImage")
            .sort_by('created_at', 'desc').execute()

        // console.log( ProfileImage.resources[0] )

        //get Bg
        const BgImage = await cloudinary.search.expression(
            "folder:" + anotherUserId + "/background")
            .sort_by('created_at', 'desc').execute()
        // console.log({ BgImage })


        const BgURL = (BgImage.resources.length > 0 && BgImage.resources !== undefined) && BgImage.resources[0].url
        const ProfileURL = (ProfileImage.resources.length > 0 && ProfileImage.resources !== undefined) && ProfileImage.resources[0].url



        const userGeneralInfo = await Post.find({ googleId: anotherUserId })

        // console.log({ userGeneralInfo })
        if (!anotherUserId) {

            return res.status(403).json({ message: "please, select user" })

        }
        else {
            if (anotherUserId === _id) {

                getUserPost = await TextPost.find({ userId: anotherUserId })
                ShowDot = true

                return res.status(200).json({ getUserPost, ProfileURL, BgURL, userGeneralInfo, ShowDot })
            }
            else {
                getUserPost = await TextPost.find({ userId: anotherUserId, privacy: "public" })
                ShowDot = false
                return res.status(200).json({ getUserPost, ProfileURL, BgURL, userGeneralInfo, ShowDot })

            }

            // const ProfileImage = await cloudinary.search.expression(
            //     "folder:" + anotherUserId + "/profileImage")
            //     .sort_by('created_at', 'desc').execute()

            // console.log("profile")
            // console.log(ProfileImage)
            // if (ProfileImage.resources.length > 0 && ProfileImage.resources !== undefined) {

            //     const ProfileURL = ProfileImage.resources[0].url

            //     const BgImage = await cloudinary.search.expression(
            //         "folder:" + anotherUserId + "/background")
            //         .sort_by('created_at', 'desc').execute()

            //     if (BgImage.resources.length > 0 && BgImage.resources !== undefined) {

            //         const BgURL = BgImage.resources[0].url

            //         return res.status(200).json({ getUserPost, ProfileURL, BgURL, userGeneralInfo, ShowDot })
            //     }
            //     else {


            //         return res.status(200).json({ getUserPost, ProfileURL, userGeneralInfo, ShowDot })
            //     }
            // }
            // else {

            //     return res.status(200).json({ getUserPost, ShowDot, userGeneralInfo })
            // }






        }

    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })

    }
}


exports.commentLength = async (req, res) => {
    try {
        const { post_id } = req.body
        const length = await Comments.find({ post_id }).countDocuments()
        // console.log(length)
        return res.status(200).json({ message: "successfull", data: length })




    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" })
    }
}


exports.friendrequest = async (req, res) => {
    try {
        const { profileUrl, anotherUserId, recieverName, senderName, userId, currentUser, receiverUrl, senderUrl, connectMessage } = req.body
        console.log("send reqiest")
        console.log(req.body)


        const _id = req._id
        console.log(_id)

        if (currentUser === anotherUserId) {
            return res.status(403).json({ message: "you can't send request to yourself" })
        }
        else if (connectMessage === false) {
            const senderUser = await UserData.findOne({ googleId: currentUser })
            const recieverUser = await UserData.findOne({ googleId: anotherUserId })
            // console.log({ senderUser })
            // console.log(senderUser.senderrequest.some((item) => item.anotherUserId === anotherUserId))
            // console.log({ recieverUser })
            // console.log(recieverUser.receiverrequest.some((item) => item.currentUser === currentUser) === true)

            if (senderUser.senderrequest.some((item) => item._id === anotherUserId) === true && recieverUser.receiverrequest.some((item) => item._id === currentUser) === true) {
                return res.status(409).json({ message: "already send" })
            }
            else {

                await UserData.findOneAndUpdate({ googleId: currentUser }, { $push: { senderrequest: { name: recieverName, _id: anotherUserId, url: receiverUrl } } }, { new: true })

                await UserData.findOneAndUpdate({ googleId: anotherUserId }, { $push: { receiverrequest: { name: senderName, _id: currentUser, url: senderUrl } } }, { new: true })
                return res.status(200).json({ message: "successfull sent" })
            }
        }

        else if (connectMessage === true) {
            const recieverUser = await UserData.findOne({ googleId: anotherUserId })
            const senderUser = await UserData.findOne({ googleId: currentUser })

            // console.log(senderUser.senderrequest.some((item) => item.anotherUserId === anotherUserId))
            // console.log(recieverUser.receiverrequest.some((item) => item.currentUser === currentUser) === true)

            if (senderUser.senderrequest.some((item) => item._id === anotherUserId) === true && recieverUser.receiverrequest.some((item) => item._id === currentUser) === true) {


                await UserData.findOneAndUpdate(
                    { googleId: currentUser }, { $pull: { senderrequest: { _id: anotherUserId } } }, { new: true }
                )
                await UserData.findOneAndUpdate(
                    { googleId: anotherUserId }, { $pull: { receiverrequest: { _id: currentUser } } }, { new: true }

                )
                return res.status(200).json({ message: "Successfull delete" })
            }

        }


    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" + err })

    }
}

exports.deletefriendrequest = async (req, res) => {
    try {
        const { senderId } = req.body
        const _id = req._id
        // console.log(req.body)
        if (!senderId) {
            return res.status(403).json({ message: "not delete" })
        }
        else {

            await UserData.updateOne({ googleId: _id }, { $pull: { receiverrequest: { _id: senderId } } })

            const data = await UserData.updateOne({ googleId: senderId }, { $pull: { senderrequest: { _id: _id } } }, { new: true })
            // console.log({ data })

            return res.status(200).json({ message: "successfull delete" })

        }

    }
    catch (err) {
        return res.status(500).json({ message: "somethinng error occured" + err })

    }

}


exports.acceptfriendrequest = async (req, res) => {
    try {
        const { senderId, name } = req.body
        const _id = req._id
        // console.log("accept")
        // console.log(req.body)


        if (!senderId) {
            return res.status(403).json({ message: "some error" })
        }
        else {


            const RecieverRequest = await UserData.findOne({ googleId: _id })
            const SenderRequest = await UserData.findOne({ googleId: senderId })
            const FilterRequestData = await RecieverRequest.receiverrequest.filter(item => {
                return item._id === senderId
            })

            // console.log({ FilterRequestData })


            const getSenderRequest = await UserData.findOne({ googleId: senderId })
            // console.log({ getSenderRequest })
            const FilterSenderData = await getSenderRequest.senderrequest.filter(item => {
                return item._id === _id
            })
            // console.log({ FilterSenderData })




            await UserData.updateOne({ googleId: senderId }, { $push: { friends: FilterSenderData[0] } }, { new: true })
            await UserData.updateOne({ googleId: _id }, { $push: { friends: FilterRequestData[0] } }, { new: true })
            await UserData.updateOne({ googleId: senderId }, { $pull: { senderrequest: { _id: _id } } }, { new: true })
            await UserData.updateOne({ googleId: _id }, { $pull: { receiverrequest: { _id: senderId } } }, { new: true })
            await UserData.findOneAndUpdate({ googleId: senderId }, { $push: { message: { name: RecieverRequest.fname + "" + RecieverRequest.lname, url: RecieverRequest.url, type: "friend", _id: _id } } }, { new: true })

            await UserData.findOneAndUpdate({ googleId: _id }, { $push: { message: { name: SenderRequest.fname + "" + SenderRequest.lname, url: SenderRequest.url, type: "friend", _id: senderId } } }, { new: true })


            return res.status(200).json({ message: "successfull accecpted" })
        }
    }
    catch (err) {
        return res.status(500).json({ message: "somethinng error occured" + err })

    }

}



exports.disconnectfriend = async (req, res) => {
    try {
        const { senderId } = req.body
        const _id = req._id
        // console.log(req.body)

        await UserData.findOneAndUpdate({ googleId: _id }, { $pull: { friends: { _id: senderId } } }, { new: true })
        await UserData.findOneAndUpdate({ googleId: senderId }, { $pull: { friends: { _id: _id } } }, { new: true })

        await UserData.findOneAndUpdate({ googleId: _id }, { $pull: { friends: { _id: senderId } } }, { new: true })
        await UserData.findOneAndUpdate({ googleId: senderId }, { $pull: { friends: { _id: _id } } }, { new: true })
        await UserData.findOneAndUpdate({ googleId: _id }, { $pull: { message: { _id: senderId } } }, { new: true })

        await UserData.findOneAndUpdate({ googleId: senderId }, { $pull: { message: { _id: _id } } }, { new: true })
        return res.status(200).json({ message: "Successfull delete" })

    }
    catch (err) {
        return res.status(500).json({ message: "somethinng error occured" })

    }
}




exports.getfriends = async (req, res) => {
    try {

        const user = await UserData.findOne({ googleId: req.params.userId });
        const friends = await Promise.all(
            user.friends.map((friendId) => {
                return UserData.findOne({ googleId: friendId._id })
            })
        );

        let friendList = [];
        friends.map((friend) => {
            // console.log(friend)

            friendList.push({ _id: friend.googleId, name: friend.fname + " " + friend.lname, url: friend.url });
        });
        return res.status(200).json({ friendList })
    } catch (err) {
        return res.status(500).json(err);
    }
}
