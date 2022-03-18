
const router = require("express").Router()

const multer = require('multer');
const { isAuth } = require("../Auth/auth");
const path = require("path")
const { promises } = require("fs");
const { cloudinary } = require("../Cloudnary/cloudnary");



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











router.post("/user/blob/image", [isAuth], async (req, res) => {


    try {
        console.log(req.user)
        console.log("after multer data user")
        console.log(req.userData)
        console.log("all files from user sends")
        // console.log(req.body)
        const { _id } = req.user

        const { data } = req.body

        const uploadResponse = await cloudinary.uploader.upload(data, {
            folder: req.user._id,

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
        console.log("upload reesponse from cloudinary")
        console.log(uploadResponse)



        return res.status(200).json({ message: "Uploaded Successfully", data: uploadResponse })






    } catch (err) {
        console.log(err)
        res.status(499).json({ message: "not uploaded please try again" })

    }

})

router.get("/profile/image", isAuth, async (req, res) => {
    try {

        const { _id } = req.user




        // UserBlob/
        const result = await cloudinary.search.expression(
            "folder:" + _id,

        )
            .sort_by('created_at', 'desc')
            // .max_results(20)
            .execute()

        // const publicIds = result.map(resource => resource.public_id)
        console.log("result data is ")
        console.log(result)
        // console.log("public ids", resources)

        res.json({ parseData: result })



    } catch (err) {
        console.log(err)

    }
})

router.post("/strategy/images/", isAuth, async (req, res) => {

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



router.delete("/delete/assest/", isAuth, async (req, res) => {
    try {
        console.log("request for delete files")
        console.log(req.body)
        const { uploadImageDataFromServer } = req.body
        const { public_id } = req.body

        // const uploadResponse =await  cloudinary.uploader.destroy(asset_id)
        // console.log("upload reesponse from cloudinary for delete")
        // console.log(uploadResponse)

        const allUserIdAssests = await cloudinary.search.expression(
            "folder:" + req.user._id,

        ).execute()

        // console.log("userAssests")
        // console.log(typeof uploadImageDataFromServer)
        // console.log(uploadImageDataFromServer)
        // console.log(allUserIdAssests)

        const allUserIdAssestsIds = allUserIdAssests.resources.filter((item) => {
            return item.asset_id === uploadImageDataFromServer[0].asset_id
        })
        console.log("all assests ids")
        console.log(allUserIdAssestsIds)

        const deleteAssest = await cloudinary.uploader.destroy(allUserIdAssestsIds[0].public_id)
        console.log("dele")
        console.log(deleteAssest)

        return res.status(200).json({ message: "Delete Successfully", data: allUserIdAssestsIds })





    } catch (err) {

        console.log(err)

    }
})

module.exports = router;