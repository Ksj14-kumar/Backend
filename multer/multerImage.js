
const router = require("express").Router()

const multer = require('multer');
const { isAuth } = require("../Auth/auth");
const path = require("path")
const { promises, rmdirSync } = require("fs");
const { cloudinary } = require("../Cloudnary/cloudnary");
const GoogleDb = require("../db/googledb")
const Post = require("../db/UserData")



console.log("authentication data")


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("multer user image")
        console.log(req.userData)

        console.log(file)
        console.log(req.cookies.uuid)

        console.log(req.user)
        cb(null, 'public/UserBlob/' + req.user._id)
    },
    filename: function (req, file, cb) {
        console.log(file)
        console.log("file name is s")
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage }).single("file")











router.post("/user/blob/image/9fHtqOJumtxOzmTfLMFT/ETXsG3rHrnx2irUZmefU/njVzxxrEx84ZrUiERB0t/fxXRdJLMKIkzxucTbovy/sO9rLr3E0EuDpjYcawQD", async (req, res) => {


    try {
        console.log(req.user)
        console.log("after multer data user")
        console.log(req.userData)
        console.log("all files from user sends")
        console.log(req.body)
        const { _id } = req.user

        const { data } = req.body

        const DirectoryAlreadyExit = await cloudinary.search.expression(
            "folder:" + req.user._id,


        ).execute()

        console.log("user info")
        console.log(DirectoryAlreadyExit)
        console.log("user info end")

        // DirectoryAlreadyExit.resources[0].folder

        if (DirectoryAlreadyExit.resources.length > 0) {
            console.log("alkready exit folder root folder")

            const uploadResponseProfile = await cloudinary.search.expression(
                "folder:" + req.user._id + "/profileImage" ,
            ).execute()
            console.log("upload response profile start")
            console.log(uploadResponseProfile)
            console.log("upload response profile end")

            // uploadResponseProfile.resources[0].folder
            if (uploadResponseProfile.resources.length > 0) {
                console.log("profile directory already exits")
                const uploadResponse = await cloudinary.uploader.upload(data, {
                    folder: `${req.user._id}/profileImage`,

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
                //     console.log("upload response profile start")
                // console.log(uploadResponse)
                // console.log("upload response profile end")
                return res.status(200).json({ message: "Uploaded Successfully", data: uploadResponse })

            }
            else {
                console.log("directory profile directory not exits while root folder exits")
                const uploadResponse = await cloudinary.uploader.upload(data, {
                    folder: `${req.user._id}/profileImage`,

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
            console.log("root folder not exits")
            const uploadResponse = await cloudinary.uploader.upload(data, {
                folder: req.user._id + "/profileImage",
                public_id: _id,


            })
            console.log("root folder not exitsc start")
            console.log(uploadResponse)
            console.log("root folder not exits end")

            if (uploadResponse) {

                const uploadResponseProfileData = await cloudinary.search.expression(
                    "folder:" + req.user._id + "/profileImage",


                ).execute()
                if (uploadResponseProfileData.resources.length > 0) {
                    console.log("directory profile directory already exits")
                    const uploadResponseProfile = await cloudinary.uploader.upload(data, {
                        folder: `${req.user._id}/profileImage`,

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
                    console.log("directory profile directory not exits")
                    const uploadResponseProfile = await cloudinary.uploader.upload(data, {
                        folder: `${req.user._id}/profileImage`,

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

router.get("/profile/image/e9thhvkKqJpnTlYo1sQl/QVbghZqhoSr2Rt5qvNYJ/iKj3RoJojFWmcDo4wTlm/9Olk5vTenhdkjHrdYEWl", async (req, res) => {
    try {

        const { _id } = req.user




        // UserBlob/
        const result = await cloudinary.search.expression(
            "folder:" + _id + "/profileImage",

        )
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()

        // const publicIds = result.map(resource => resource.public_id)
        // console.log("result data for profile ")
        // console.log(result)
        // console.log("public ids", resources)

        res.status(200).json({ parseData: result })



    } catch (err) {
        res.status(500).json({ message: "Something Error  Occured" + err })

    }
})

router.post("/strategy/images/", async (req, res) => {

    try {
        console.log("all files from user sends")
        console.log(req.body)
        const { data } = req.body

        const uploadResponse = await cloudinary.uploader.upload(data, {
            folder: req.user._id,

            resource_type: "image",
            timeout: 100000,
        })
        console.log("upload reesponse from cloudinary")
        console.log(uploadResponse)
        res.status(200).json({ message: uploadResponse })



    }



    catch (err) {
        console.log(err)
    }
})



router.delete("/delete/assest/", async (req, res) => {
    try {
        // console.log("request for delete files")
        // console.log(req.body)
        const { uploadImageDataFromServer } = req.body
        const { public_id } = req.body

        // const uploadResponse =await  cloudinary.uploader.destroy(asset_id)
        // console.log("upload reesponse from cloudinary for delete")
        // console.log(uploadResponse)

        const allUserIdAssests = await cloudinary.search.expression(
            "folder:" + req.user._id + "/profileImage",

        ).execute()

        // console.log("userAssests")
        // console.log(typeof uploadImageDataFromServer)
        // console.log(uploadImageDataFromServer)
        // console.log(allUserIdAssests)

        const allUserIdAssestsIds = allUserIdAssests.resources.filter((item) => {
            return item.asset_id === uploadImageDataFromServer[0].asset_id
        })
        // console.log("all assests ids")
        // console.log(allUserIdAssestsIds)

        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIds[0].public_id)
        // console.log("dele")
        // console.log(deleteAssest)

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
        // console.log(err)
        return res.status(401).json({ message: "not created!!!!" })

    }

})


router.get("/user/083525p7ljhwmxifts31/l66cbrsuytmj1wujuauz/nqoye5ozdqj89b4s4qoq/ua1iztaxjo4bbmzvd391/3mzqeygnoszlknp90h51/t28uf00khscofxgjwj20", async (req, res) => {
    try {
        console.log("user00")
        console.log(req.user)
        const userInformationLoadFromServer = await Post.findOne({ googleId: req.user._id.valueOf() })
        console.log("userinformation load from server")
        console.log(userInformationLoadFromServer)

        res.status(200).json({ message: userInformationLoadFromServer })


    } catch (err) {
        res.status(500).json({ message: "error occured, check internet connection!!!" })

    }
})





//-----------------------------------BACKGROUND IMAGES --------------------------

router.post("/user/blob/image/bg/S6MjFqeb8HdJRGjkUs9W/QUCzIb1mKtMevddN24yB/YWYhtXwEEtUlHu0Nkhmq/eAQCSzpYo28SJxXCMV4d/yR3VTmMynJw6N3xlS530/WpsJsZKo4hGf18jaWmZL", async (req, res) => {
    try {
        // console.log(req.user)
        // console.log("bckground image user")
        // console.log(req.userData)
        // console.log("all data send for background")
        // console.log(req.body)
        const { _id } = req.user
        const { data } = req.body
        const uploadResponse = await cloudinary.uploader.upload(data, {
            folder: `${req.user._id}/background`,
            public_id: _id,
            resource_type: "image",
            timeout: 100000,
            // overwrite: true,
            // use_filename: true,
            // unique_filename: false,
            // chunk_size: 1000000,
            invalidate: true,
            phash: true
        })
        console.log("upload reesponse from cloudinary")
        console.log(uploadResponse)
        return res.status(200).json({ message: "Uploaded Successfully", data: uploadResponse })
    } catch (err) {
        // console.log(err)
        res.status(401).json({ message: "not uploaded please try again!!!" + err })

    }
})

router.get("/bg/image/mwQgga2z5KfChXjuF1s0/r6dg0LqqWmCG4W5UQOTa/ftFhzft7YNwT6jb9EVoX/ogvnbpOcPnjgMatu3mtb/JSC2PQZQVlK19QXDbSl1", async (req, res) => {
    try {
        const { _id } = req.user
        // UserBlob/
        const result = await cloudinary.search.expression(
            "folder:" + `${req.user._id}/background`,
        )
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()

        // const publicIds = result.map(resource => resource.public_id)
        // console.log("result data for background")
        // console.log(result)
        // console.log("public ids", resources)
        console.log("background image load", result)

        res.status(200).json({ parseData: result })



    } catch (err) {
        return res.status(500).json({ message: "Something error occured" })

    }
})



router.delete("/delete/assest/bg", async (req, res) => {
    try {
        console.log("request for delete background files ")

        console.log(req.body)
        console.log("userAssest for delete")
        const { uploadImageDataFromBackground } = req.body
        const { public_id } = req.body

        // const uploadResponse =await  cloudinary.uploader.destroy(asset_id)
        // console.log("upload reesponse from cloudinary for delete")
        // console.log(uploadResponse)

        const allUserIdAssestsForBg = await cloudinary.search.expression(
            "folder:" + `${req.user._id}/background`,

        ).execute()

        console.log("userAssests for background image delete")
        // console.log(typeof uploadImageDataFromServer)
        // console.log(uploadImageDataFromServer)
        console.log(allUserIdAssestsForBg)

        const allUserIdAssestsIdsDeletForBackground = allUserIdAssestsForBg.resources.filter((item) => {
            return item.asset_id === uploadImageDataFromBackground[0].asset_id
        })
        console.log("all assests ids for background")
        console.log(allUserIdAssestsIdsDeletForBackground)

        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIdsDeletForBackground[0].public_id)
        console.log("dele")
        console.log(deleteAssest)

        return res.status(200).json({ message: "Delete Successfully", data: allUserIdAssestsIdsDeletForBackground })





    } catch (err) {

        return res.status(401).json({ message: "not deleted!!!" + err })

    }
})


//=======================USER UPLOAD PHOTOS===============











module.exports = router;