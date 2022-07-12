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
const History = require("../db/History")
const Comments = require("../db/Comments");
const TextPost = require("../db/TextPost");
const Message = require("../db/Message")
const onlineUsers = require("../db/OnlineUser")
const Cache = require("node-cache")
const NodeCache = new Cache()
const axios = require("axios");
let Pusher = require('pusher');
const UserData = require("../db/UserData");
const { AsyncResource } = require("async_hooks");
const { truncate } = require("fs/promises");
const { mul } = require("@tensorflow/tfjs");
const crypto = require("crypto")
const RandomID = require("uuid").v4()
let pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTLS: true
});



//add news posts
async function AddNewsPost() {

    (async function () {
        const response = await axios({
            url: `https://newsapi.org/v2/everything?q=Apple&from=2022-07-07&sortBy=popularity&apiKey=${process.env.NEWS_API_ORG_KEY}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            "withCredentials": true
        })

        response.data.articles.forEach(async (item) => {
            const GetPosts = await TextPost.findOne({ NewsURL: item.url })
            if (GetPosts) {
                return
            }
            else {
                const data = {
                    username: item.author,
                    post_id: crypto.randomUUID(),
                    image: item.urlToImage,
                    fileType: "image",
                    post_url: item.url,
                    text: item.content,
                    time: Date.parse(item.publishedAt),
                    createdAt: Date.parse(item.publishedAt),
                    title: item.title,
                    postType: "news",
                    liked: [],
                    title: item.title,
                    privacy: "public",
                    source: item.source.name,
                    profileImage: item.source.name.includes(" ") ? item.source.name.split(" ")[0][0] + item.source.name.split(" ")[1][0] : item.source.name[0].toUpperCase() + item.source.name[item.source.name.length - 1].toUpperCase(),
                    NewsURL: item.url,
                    userId: RandomID,
                    des: item.description,
                }
                const storeNews = await TextPost(data)
                await storeNews.save()
            }
        })
    })()
}






//==============================library import end===================










exports.profileImagePost = async (req, res) => {
    try {
        const _id = req._id
        const { data, url } = req.body
        // return res.status(200).json(req.body)

        //down code for stor the image on cloudinary
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
            // console.log({ uploadResponse })
            if (FilterData === undefined) {
                await Post.findOneAndUpdate({ googleId: _id }, { $set: { url: uploadResponse.url } })
                await TextPost.updateMany({ userId: _id }, { $set: { profileImage: uploadResponse.url } })
                await Comments.updateMany({ userId: _id }, { $set: { ImageUrl: uploadResponse.url } })
                await History.updateMany({ "history.searchUserId": _id }, { $set: { url: uploadResponse.url } })
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
        // if (NodeCache.has(_id + "profileImage")) {
        //     return res.status(200).json(NodeCache.get(_id + "profileImage"))
        // }
        // else {

        const result = await cloudinary.search.expression(
            "folder:" + _id + "/profileImage",
        )
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()
        // NodeCache.set(_id + "profileImage", { url: result.resources.length > 0 && result.resources[0].url, assest_id: result.resources.length > 0 && result.resources[0].asset_id })
        // console.log(result)
        return res.status(200).json({ url: result.resources.length > 0 && result.resources[0].url, assest_id: result.resources.length > 0 && result.resources[0].asset_id, profileImage: "profile" })
        // }


    } catch (err) {
        // console.log(err)
        res.status(500).json({ message: "Something Error  Occured" + err })

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

        const _id = req._id
        // const uploadResponse =await  cloudinary.uploader.destroy(asset_id)

        const allUserIdAssests = await cloudinary.search.expression(
            "folder:" + _id + "/profileImage",
        ).execute()
        const allUserIdAssestsIds = allUserIdAssests.resources.filter((item) => {
            return item.assest_id === assest_id
        })

        //delet e the profile image from the cloudinary
        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIds[0].public_id)
        //also delete profile image from the mongodb and all post where user have these post
        await UserData.findOneAndUpdate({ googleId: _id }, { $set: { url: "" } })
        await TextPost.updateMany({ userId: _id }, { $set: { profileImage: "" } })
        await Comments.updateMany({ userId: _id }, { $set: { ImageUrl: "" } })
        await History.updateMany({ "history.searchUserId": _id }, { $set: { url: "" } })
        return res.status(200).json({ message: "Delete Successfully" })
    } catch (err) {
        return res.status(500).json({ message: "Not delete!!!!" + err })


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
        // if (NodeCache.has(req._id + "userInformation")) {
        //     return res.status(200).json({ "message": NodeCache.get(req._id + "userInformation") })
        // }
        // else {
        const _id = req._id
        const userInformationLoadFromServer = await Post.findOne({ googleId: _id })
        // NodeCache.set(req._id + "userInformation", userInformationLoadFromServer)
        return res.status(200).json({ message: userInformationLoadFromServer, userInfo: "INFO" })

        // }
    } catch (err) {
        return res.status(500).json({ message: "error occured, check internet connection!!!" })

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
            "folder:" + `${_id}/background`)
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()
        // if (NodeCache.has(_id + "bgImage")) {
        //     return res.status(200).json({ url: result.resources[0].url, assest_id: result.resources[0].asset_id })
        // }
        // else {
        if (result.resources.length > 0) {
            // NodeCache.set(_id + "bgImage", { url: result.resources[0].url, assest_id: result.resources[0].asset_id })
            return res.status(200).json({ url: result.resources[0].secure_url, assest_id: result.resources[0].asset_id, bgImage: "bgImage" })
        }
        else {
            return res.status(404).json({ message: "Background Image not exits", bgImage: "bgImage" })
            // }
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })
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
        const AllUsersComments = await Comments.find({ post_id: post_id })
        const AllUsersCommentslength = await Comments.find({ post_id: post_id })
        // console.log(+value)
        // console.log("all comment after new post upload")
        // console.log(AllUsersComments)

        if (AllUsersComments.length === 0) {
            return res.status(200).json({ message: "All comments", data: [], post_id })

        }
        else {
            // console.log({ AllUsersComments })
            return res.status(200).json({ message: "All comments", data: AllUsersComments, length: AllUsersCommentslength.length, post_id })
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

        UserComments.save(async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Something error occured" })
            }
            else {
                // console.log({ result })
                const length = await Comments.find({ post_id: comment.post_id }).countDocuments()
                return res.status(200).json({ message: "successfully saved", data: req.body, length })
            }
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
        // console.log({ text })
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
        // text, image, name, privacy, post_id, time, fileType, likes_count, liked, userProfileImageUrl
        const { text, image, privacy, post_id, time, fileType, name, userProfileImageUrl, likes_count, liked } = req.body
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
                                                // console.log(allTextPost)
                                                if (allTextPost.length > 0) {
                                                    array.push(allTextPost)
                                                    return res.status(200).json({ message: "Post added successfully", data: array })

                                                }


                                            }

                                        })
                                    }
                                    else {
                                        const allTextPost = await TextPost.find({
                                            userId: postId
                                        })
                                        array.push(allTextPost)
                                        return res.status(200).json({ message: "success full added", data: array })
                                    }
                                }
                            }

                            //IF INTIALY RESOURCES IS EMPTY THEN ONLY TEXT POST WILL BE ADDED
                            else if (result.resources.length === 0) {
                                array.push(result)

                                //if text is not empty

                                if (text) {
                                    const userTextPost = await TextPost({
                                        post_id: post_id,
                                        text: text,
                                        username: "",
                                        image: "",
                                        privacy: privacy,
                                        userId: userId,
                                        createdAt: time,
                                        fileType: "",
                                        profileImage: ""


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
                                        return res.status(500).json({ message: "Something error occured in message" + err })
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
        return res.status(500).json({ message: "Something Error Occurred" + err })

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
        // console.log(req.body)
        let mediaURL = ''
        const type = image.split(";")[0].split(":")[1]

        if (type === "image/jpeg" || type === "image/jpg" || type === "image/png" || type === "video/mp4" || type === "video/*") {


            //uncomment this if want to enable to upload post into cloudinary

            // if (image.length > 0) {
            //     cloudinary.uploader.upload(image, {
            //         folder: `${id}/post`,
            //         public_id: `${post_id}`,
            //         timeout: 60000,

            //     }, async (err, result) => {
            //         if (err) {
            //             return res.status(500).json({ message: "not upload" })
            //         }
            //         else {
            //             console.log({ result })
            //             mediaURL = result.url
            //             // return res.status(200).json({ message: result })
            //             const SaveUserPosts = await new TextPost({
            //                 username: name,
            //                 text: text,
            //                 // image: image,
            //                 image: result.url,
            //                 fileType: fileType,
            //                 privacy: privacy,
            //                 post_id: post_id,
            //                 userId: id,
            //                 profileImage: userProfileImageUrl,
            //                 likes_count: likes_count,
            //                 liked: liked,
            //                 post_url: "/user/single/post?post=" + post_id + `&&auther=${name}`,
            //                 createdAt: time,
            //             })
            //             SaveUserPosts.save(async (err) => {
            //                 if (err) {
            //                     // console.log(err)
            //                     return res.status(500).json({ message: "Not Post" + err })
            //                 }
            //                 else {
            //                     //send all user post by Id
            //                     const GetAllUserPost = await TextPost.find({ $or: [{ userId: id }, { privacy: "public" }] })

            //                     return res.status(200).json({ message: "Posted Successsfully", data: GetAllUserPost })

            //                     // return res.end()
            //                 }
            //             })
            //         }

            //     })
            // }
            // else {


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
                post_url: "/user/single/post?post=" + post_id + `&&auther=${name}`,
                createdAt: time,
            })
            SaveUserPosts.save(async (err) => {
                if (err) {
                    // console.log(err)
                    return res.status(500).json({ message: "Not Post" + err })
                }
                else {
                    //send all user post by Id
                    const GetAllUserPost = await TextPost.find({ $or: [{ userId: id }, { privacy: "public" }] })

                    return res.status(200).json({ message: "Posted Successsfully", data: GetAllUserPost.reverse() })

                    // return res.end()
                }
            })
            // }

        }
        else {
            return res.status(200).json({ message: "invalid formate" })
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })
    }
}

exports.GetPostFromMongoDb = async (req, res) => {
    try {

        const { post_id } = req.params
        // if (NodeCache.has(req.params.post_id + "PostFromMongoDb")) {
        //     const data = NodeCache.get(req.params.post_id + "PostFromMongoDb")
        //     return res.status(200).json(data)

        // }
        // else {
        const post = await TextPost.findOne({ post_id: post_id })
        // NodeCache.set(req.params.post_id + "PostFromMongoDb", { post_url: post })
        return res.status(200).json({ post_url: post })
        // }


    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
}


exports.loadAllUserPost = async (req, res) => {
    try {



        const _id = req._id
        const { value1, value2 } = req.params
        // await AddNewsPost()



        //get all post by userId 
        const value = +value1 + +value2
        const countDoc = await TextPost.find({ $or: [{ userId: _id }, { privacy: "public" }] }).countDocuments()
        if (+value1 === 0) {
            const GetAllUserPost = await TextPost.find({ $or: [{ userId: _id }, { privacy: "public" }] }).sort({ $natural: -1 }).limit(+value)

            return res.status(200).json({ message: "successfull load", data: GetAllUserPost, post: "post" })
        }
        else {

            const GetAllUserPost = await TextPost.find({ $or: [{ userId: _id }, { privacy: "public" }] }).sort({ $natural: -1 }).skip(+value1).limit(+value)
            return res.status(200).json({ message: "successfull load", data: GetAllUserPost, post: "post" })
        }
    } catch (error) {
        return res.status(500).json({ message: "Something error occured" + error })
    }
}

exports.deleteUserPostByMongoDB = async (req, res) => {
    try {
        const id = req._id
        const { userId, post_id } = req.body
        const { image } = await TextPost.findOneAndDelete({ post_id: post_id })
        const dir = path.join(__dirname, `../${image}`)
        fs.unlink(dir, async(err, result) => {
            const deletePost = await TextPost.findOneAndDelete({ $and: [{ post_id: post_id }, { userId: userId }] })
            await Noti.findOneAndDelete({ $and: [{ post_id: post_id }, { userId: userId }] })
            
            if (id === userId) {
                if (deletePost) {
                    //delete all comment related to post
                    await Comments.deleteMany({
                        post_id
                            : post_id
                    })
                    //getallpost after delete
                    const GetAllPostsAfterDelete = await TextPost.find({})
                    const allNotiAfterDelete = await Noti.find({})
                    const arrange = GetAllPostsAfterDelete.length > 0 && GetAllPostsAfterDelete.sort((a, b) => {
                        return b.time - a.time
                    })
                    return res.status(200).json({ message: "Post deleted successfully", data: arrange })
                }
                else {
                    return res.status(200).json({ message: "Deleted Successfully." })
                }
            }
            else {
                return res.status(401).json({ message: "you can not delete this post. you are not admin of this post" })
            }
        })

    } catch (error) {
        return res.status(500).json({ message: "Something error   occured" })
    }
}


exports.getAllCommentNumber = async (req, res) => {
    try {
        const _id = req._id
        const token = req.params.id
        //verify token for current user
        // const { _id } = await jwt.verify(token, KEY)
        const { post_id } = req.body
        const GetAllComment = await Comments.find({ userId: _id })
        // if (NodeCache.has(_id + "NumberComments")) {
        //     return res.status(200).json({ data: NodeCache.get(_id + "NumberComments") })
        // }
        // else {
        // NodeCache.set(_id + "NumberComments", GetAllComment.reverse())
        return res.status(200).json({ message: "successfull load", data: GetAllComment.reverse(), commentLength: "commentLength" })
        // }
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
                const arrange = allPost.length > 0 && allPost.sort((a, b) => {
                    return b.time - a.time
                })
                return res.status(200).json({ message: "successfull", data: arrange })
            }
        })
    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" + err })
    }
}

exports.likedPost = async (req, res) => {
    try {
        const userId = req.params.id
        // if (NodeCache.has(userId + "likedPost")) {
        //     return res.status(200).json({ data: NodeCache.get(userId + "likedPost") })
        // }
        // else {
        const userDetailsFind = await Post.findOne({ googleId: userId })
        const UserProfileImage = await cloudinary.search.expression(
            "folder:" + userId + "/profileImage")
            .sort_by('created_at', 'desc')
            .execute()
        // NodeCache.set(userId + "likedPost", { data: [userDetailsFind, UserProfileImage] })
        return res.status(200).json({ message: "successfull", data: [userDetailsFind, UserProfileImage] })
        // }

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


        // if (NodeCache.has(_id + "LoadAllNoti")) {
        //     return res.status(200).json(NodeCache.get(_id + "LoadAllNoti"))
        // }
        // else {

        const result = await Noti.find({
            $and: [{
                likeTo: _id
            }, { likedBy: { $ne: _id } }]
        }).sort({ $natural: -1 }).limit(5)
        // console.log({ result })

        // NodeCache.set(_id + "LoadAllNoti", { message: "successfull", data: result })

        return res.status(200).json({ message: "successfull", data: result, noti: "noti" })
        // }


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
        return res.status(200).json({ message: "successfull", data: length, post: post_id })
    } catch (err) {
        return res.status(500).json({ message: "somethinng error occured" })
    }
}


exports.friendrequest = async (req, res) => {
    try {
        const { profileUrl, anotherUserId, recieverName, senderName, userId, currentUser, receiverUrl, senderUrl, connectMessage } = req.body
        const _id = req._id
        if (currentUser === anotherUserId) {
            return res.status(403).json({ message: "you can't send request to yourself" })
        }
        else if (connectMessage === false) {
            const senderUser = await UserData.findOne({ googleId: currentUser })
            const recieverUser = await UserData.findOne({ googleId: anotherUserId })

            if (senderUser.senderrequest.some((item) => item._id === anotherUserId) === true && recieverUser.receiverrequest.some((item) => item._id === currentUser) === true) {
                return res.status(409).json({ message: "already send" })
            }
            else {
                await UserData.findOneAndUpdate({ googleId: currentUser }, { $push: { senderrequest: { name: recieverName, _id: anotherUserId, url: receiverUrl } } }, { new: true })
                await UserData.findOneAndUpdate({ googleId: anotherUserId }, { $push: { receiverrequest: { name: senderName, _id: currentUser, url: senderUrl, read: false } } }, { new: true })
                return res.status(200).json({ message: "successfull sent" })
            }
        }
        else if (connectMessage === true) {
            const recieverUser = await UserData.findOne({ googleId: anotherUserId })
            const senderUser = await UserData.findOne({ googleId: currentUser })
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
        return res.status(500).json({ message: "somethinng error occured" })

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
        const { senderId, name, url } = req.body
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
            await UserData.findOneAndUpdate({ googleId: senderId }, { $push: { message: { name: RecieverRequest.fname + " " + RecieverRequest.lname, url: RecieverRequest.url, type: "friend", read: false, _id: _id } } }, { new: true })
            await UserData.findOneAndUpdate({ googleId: _id }, { $push: { message: { name: SenderRequest.fname + " " + SenderRequest.lname, url: SenderRequest.url, type: "friend", read: false, _id: senderId } } }, { new: true })

            return res.status(200).json({ message: "successfull accecpted", accept: true, Users: [{ name, url, senderId }] })
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
        const userId = req.params.userId

        // if (NodeCache.has(userId + "friends")) {
        //     return res.status(200).json(NodeCache.get(userId + "friends"))
        // }
        // else {


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
        // NodeCache.set(userId + "friends", { friendList })
        return res.status(200).json({ friendList })
        // }
    } catch (err) {
        return res.status(500).json(err);
    }
}


exports.postLength = async (req, res) => {
    try {
        const user = await TextPost.find({});
        if (user) {
            // console.log(user.length)
            return res.status(200).json({ l: user.length })
        }
        else {
            return res.status(200).json({ l: 0, postLength: "postLength" })
        }
    } catch (err) {
        return res.status(500).json({ message: "something error occured" });
    }
}

exports.SinglePost = async (req, res) => {

    try {
        const { auther, post } = req.params
        const splitAuther = auther.split("-").join(" ")

        if (auther && post) {
            const user = await TextPost.findOne({ post_id: post, username: splitAuther });
            // console.log({ user })
            return res.status(200).json({ message: "Success", data: user })
        }
        else {
            return res.status(401).json({ message: "Post not Found" })
        }

    }
    catch (err) {
        return res.status(500).json({ message: "something error occured" })

    }
}


exports.ReactUser = async (req, res) => {
    try {
        const { userId } = req.params
        const _id = req._id
        if (userId) {
            const { fname, lname, url } = await UserData.findOne({ googleId: userId })
            //check every react user is a friends of current user or not
            const currentUserDetails = await UserData.findOne({ googleId: _id })
            const isFriends = currentUserDetails.friends.length > 0 && currentUserDetails.friends.some(item => {
                return item._id === userId
            })
            if (fname && lname) {
                return res.status(200).json({ message: "success", details: { name: fname + " " + lname, image: url, isFriends, currentUserDetails } })
            }
            else {
                return res.status(404).json({ message: "not found" })
            }
        }
        else {
            return res.status(200).json({ message: "Not liked" })
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error Occured" })

    }
}



exports.Bookmark = async (req, res) => {
    try {
        const { userId } = req.params
        const { bookMarkColor, ...postDetails } = req.body
        const { post_id } = req.body

        if (userId) {
            if (bookMarkColor === true) {
                const user = await UserData.findOneAndUpdate({ _id: userId }, { $pull: { bookMarkPost: { post_id: post_id } } }, { new: true })
                const user1 = await UserData.findOne({ _id: userId })
                await UserData.findOneAndUpdate({ googleId: req.body.userId }, { $pull: { bookMarkBy: { _id: userId, post_id } } }, { new: true })
                return res.status(200).json({ message: "successfull remove", bookmark: user1.bookMarkPost })

            }
            //remove the post if exits

            else {
                //add the post if it is exits and also check already exits ot not
                const alreadyExits = await UserData.findOne({ _id: userId })
                const isExits = alreadyExits.bookMarkPost.length > 0 && alreadyExits.bookMarkPost.filter((item) => {
                    return item.post_id === post_id
                })
                if (isExits.length > 0) {
                    return res.status(200).json({ message: "Already exits" })
                }
                else {
                    await UserData.findOneAndUpdate({ _id: userId }, { $push: { bookMarkPost: postDetails } }, { new: true })
                    const user = await UserData.findOne({ _id: userId })
                    await UserData.findOneAndUpdate({ googleId: req.body.userId }, { $push: { bookMarkBy: { _id: userId, post_id } } }, { new: true })
                    // NodeCache.set(req._id + "userInformation", user)
                    return res.status(200).json({ message: "bookmark Successfull", bookmark: user.bookMarkPost })
                }
            }
        }
        else {
            return res.status(401).json({ message: "Something missing" })
        }
    }
    catch (err) {
        return res.status(500).json({ message: "Something error Occured" })
    }
}




exports.GetPosts = async (req, res) => {
    try {
        const _id = req._id
        const { text, image, name, privacy, post_id, time, fileType, likes_count, liked, userProfileImageUrl } = req.body
        let emptyObject = {}

        const path = "_user/_posts" + `/_${_id}`
        // console.log(image)


        const type = image.split(";")[0].split(":")[1]
        if (type === "image/jpeg" || type === "image/jpg" || type === "image/png" || type === "video/mp4" || type === "video/*") {

            const buffer = Buffer(image.split(",")[1], 'base64')
            const fileName = `${post_id}_${Date.now()}.${type.split("/")[1]}`
            const filePath = path + `/${fileName}`
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true })
            }
            fs.writeFile(filePath, buffer, (err) => {
                if (err) {
                    return res.status(500).json({ message: "something error occured" })
                }
                else {
                    // console.log("file saved")
                    const PostDataIntoDb = new TextPost({
                        username: name,
                        text: text,
                        image: filePath,
                        fileType: fileType,
                        privacy: privacy,
                        post_id: post_id,
                        userId: _id,
                        profileImage: userProfileImageUrl,
                        likes_count: likes_count,
                        liked: liked,
                        post_url: "/user/single/post?post=" + post_id + `&&auther=${name}`,
                        createdAt: time,
                    })

                    PostDataIntoDb.save(async (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: "Something error occured" })
                        }
                        else {
                            // const GetAllUserPost = await TextPost.find({ $or: [{ userId: _id }, { privacy: "public" }] })
                            return res.status(200).json({ message: "successfull", data: result })
                        }
                    })

                }
            })
        }
        else if (image === "") {
            const PostDataIntoDb = new TextPost({
                username: name,
                text: text,
                image: "",
                fileType: fileType,
                privacy: privacy,
                post_id: post_id,
                userId: _id,
                profileImage: userProfileImageUrl,
                likes_count: likes_count,
                liked: liked,
                post_url: "/user/single/post?post=" + post_id + `&&auther=${name}`,
                createdAt: time,
            })
            PostDataIntoDb.save(async (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Something error occured" })
                }
                else {
                    // const GetAllUserPost = await TextPost.find({ $or: [{ userId: _id }, { privacy: "public" }] })
                    return res.status(200).json({ message: "successfull", data: result })
                }
            })

        }
        else {
            return res.status(403).json({ message: "invalid file" })
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })
    }
}



exports.Base64ProfileImage = async (req, res) => {
    try {
        const _id = req._id
        const { data, url, uuid } = req.body
        const UserDetails = await UserData.findOneAndUpdate({ googleId: _id }, { $set: { url: req.body.data } })
        return res.status(200).json({ message: "successfull upload", data: { url: UserDetails.url } })
    } catch (err) {
        return res.status(500).json({ message: "Opps Somethig error occured" + err })
    }
}



exports.SinglePost = async (req, res) => {
    try {
        const { auther, post } = req.body
        if (auther && post) {
            const postDetails = await TextPost.find({ $and: [{ username: auther }, { post_id: post }] })
            if (postDetails) {
                return res.status(200).json({ data: postDetails })
            }
            else {
                return res.status(404).json({ message: "Post not found" })
            }
        }
        else {
            return res.status(404).json({ message: "Post not found" })
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })
    }
}


exports.ServerPost = async (req, res) => {
    try {
        const { post } = req.headers
        return res.status(200).sendFile(path.join(__dirname, `../${post}`))
    }
    catch (err) {
        return res.status(500).json({ message: "something error occured" })
    }
}



exports.likeUserPost = async (req, res) => {
    try {
        // console.log(req.body)
        const post_id = req.params.postId
        const { likedBy, likeTo, liked } = req.body
        if (likedBy && likeTo) {
            if (liked === false) {
                //liked post
                const likedByUser = await UserData.findOne({ googleId: likedBy })
                const likeToUser = await UserData.findOne({ googleId: likeTo })
                const { image } = await TextPost.findOne({ post_id: post_id })
                const value = await UserData.findOneAndUpdate({ googleId: likeTo }, {
                    $push: {
                        AllNotification: {
                            postImagePath: image,
                            userPorfile: likedByUser.url,
                            postId: post_id,
                            name: likedByUser.fname + " " + likedByUser.lname,
                            post_url: "/user/single/post?post=" + post_id + `&&auther=${likeToUser.fname + " " + likeToUser.lname}`,
                            type: "like",
                            time: Date.now(),
                            read: false,
                            notification_id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                            userLikedId: likedBy,
                        }
                    }
                }, { new: true })
                return res.status(200).json({ message: "liked", value: value })

            }
            else {
                // unliked post_id
                const value = await UserData.findOneAndUpdate({ googleId: likeTo }, { $pull: { AllNotification: { userLikedId: likedBy } } }, { new: true })
                return res.status(200).json({ message: "Successful unliked", value })
            }
        }
        else {
            return res.status(403).json({ message: "Something missing" })
        }
    } catch (err) {
        return res.status(500).json({ message: "Something error occured" + err })

    }
}


exports.commentUserPost = async (req, res) => {
    try {
        const postId = req.params.postId
        const { comment, commentBy, replyParentId } = req.body
        const MessageType = comment.type
        if (commentBy && comment) {
            const commentByUser = await UserData.findOne({ googleId: commentBy })
            const { userId, image } = await TextPost.findOne({ post_id: postId })
            const { fname, lname, url } = await UserData.findOne({ googleId: userId })
            if (comment.parentId === null) {
                //send message to admin post admin
                const value = await UserData.findOneAndUpdate({ googleId: userId }, {
                    $push: {
                        AllNotification: {
                            name: comment.username,
                            UserProfile: commentByUser.url,
                            postId: comment.post_id,
                            postImagePath: image,
                            post_url: "/user/single/post?post=" + comment.post_id + `&&auther=${fname + " " + lname}`,
                            docIdCommentByUserId: commentByUser._id,
                            type: "comment",
                            commentParentId: comment.parentId,
                            commentId: comment.uuid,
                            time: comment.createdAt,
                            body: comment.body,
                            messageType: MessageType,
                            read: false,
                            notification_id: Math.random().toString(36).substring(2, 20) + Math.random().toString(36).substring(2, 20)
                        }
                    }
                })
                return res.status(200).json({ message: "Successfull saved" })
            }
            else {
                // now add comment message 
                // 1) add into owner notification as comment
                //2) add into jisko reply diya hai uske notificatios mai, jisne reply diya hai
                await UserData.findOneAndUpdate({ googleId: userId }, {
                    $push: {
                        AllNotification: {
                            name: comment.username,
                            UserProfile: commentByUser.url,
                            postId: comment.post_id,
                            postImagePath: image,
                            post_url: "/user/single/post?post=" + comment.post_id + `&&auther=${fname + " " + lname}`,
                            docIdCommentByUserId: commentByUser._id,
                            type: "comment",
                            commentParentId: comment.parentId,
                            commentId: comment.uuid,
                            time: comment.createdAt,
                            body: comment.body,
                            messageType: MessageType,
                            read: false,
                            notification_id: Math.random().toString(36).substring(2, 20) + Math.random().toString(36).substring(2, 20)
                        }
                    }
                })
                if (replyParentId !== commentBy) {
                    const value = await UserData.findOneAndUpdate({ googleId: replyParentId }, {
                        $push: {
                            AllNotification: {
                                name: comment.username,
                                UserProfile: commentByUser.url,
                                postId: comment.post_id,
                                postImagePath: image,
                                post_url: "/user/single/post?post=" + comment.post_id + `&&auther=${fname + " " + lname}`,
                                docIdCommentByUserId: commentByUser._id,
                                type: "reply",
                                commentParentId: comment.parentId,
                                commentId: comment.uuid,
                                time: comment.createdAt,
                                body: comment.body,
                                messageType: MessageType,
                                read: false,
                                notification_id: Math.random().toString(36).substring(2, 20) + Math.random().toString(36).substring(2, 20)
                            }
                        }
                    })
                    return res.status(200).json({ message: "comment successfull send", value })
                }
                else {
                    return res.status(200).json({ message: "Comment Added" })
                }

            }
        }
        else {
            return res.status(403).json({ message: "Something  Missing" })
        }
    }
    catch (err) {
        return res.status(500).json({ message: "Something error occure" })
    }
}



exports.updateAllNotificationType = async (req, res) => {
    try {
        const _id = req._id
        await UserData.update({ googleId: _id }, {
            $set: {
                "AllNotification.$[].read": true
            }
        },
            { "multi": true }
        )
        const { AllNotification } = await UserData.findOne({ googleId: _id })
        return res.status(200).json({ message: "Successfull updated", value: AllNotification })
    }
    catch (err) {
        return res.status(500).json({ message: "Something error occure" + err })
    }
}


exports.updateFriendNotificationType = async (req, res) => {
    try {
        //userId is a docId
        const userId = req.params.userId
        if (userId) {
            // console.log(userId)
            //update message status
            await UserData.updateOne({ _id: userId }, { $set: { "receiverrequest.$[].read": true } }, { new: true })
            const { receiverrequest } = await UserData.findOne({ _id: userId })
            return res.status(200).json({ message: "Successfull update", receiverrequest })
        }
        else {
            return res.status(200).json({ message: "Something missing" })
        }
    }
    catch (err) {
        return res.status(500).json({ message: "Something error occure" })
    }

}