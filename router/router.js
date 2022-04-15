
const fs = require("fs")
const os = require("os")
const express = require('express');
const router = express.Router();
// const Post = require("../db/UserData");
const jsonToken = require("jsonwebtoken")
const passport = require("passport")
const bcrypt = require("bcrypt");
const GoogleDB = require('../db/googledb');
const Post = require('../db/UserData');
const { cloudinary } = require("../Cloudnary/cloudnary");
const onlineUser = require("../db/OnlineUser")

const path = require("path");
const { isAuth } = require("../Auth/auth");

const KEY = process.env.SECRET_KEY
const clientURL = process.env.CLIENT_URL
// const UserEmail = require("../Stretegy/Googlestrtegy")
// console.log("mail",UserEmail)
// const os = require("os")
// const path = require("path")
// // const fs = require("fs")
// console.log(os.hostname())
// console.log("file path00")
// console.log(path.basename(__dirname + "../public/UserBlob"))
// console.log("router data")
// console.log(path.dirname(__dirname))

let userInfo = null

router.get("/", (req, res) => {
    res.send("Hello World");
})









router.post("/api/register", async (req, res) => {
    try {

        const { name, email, password, confirmPassword } = req.body

        if (!name || !email || !password || !confirmPassword) {
            res.status(400).json({ message: "Please fill all the fields" })
            return
        }
        else if (password !== confirmPassword) {
            res.status(400).json({ message: "Password and confirm password doesn't match" })
            return
        }
        else if (password.length < 8 || confirmPassword.length < 8) {
            res.status(400).json({ message: "Password must be atleast 8 characters" })
            return
        }
        function isEmailValid(email) {
            const pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
            return pattern.test(email)

        }
        if (!isEmailValid(email)) {
            res.status(400).json({ message: "Please enter a valid email" })
            return
        }
        else {

            const userToken = jsonToken.sign({ email }, KEY)
            const hashPassword = await bcrypt.hash(password, 10)
            const hashCpassword = await bcrypt.hash(confirmPassword, 10)

            const UserData = await new GoogleDB(

                {
                    name,
                    email,
                    googleId: hashPassword,
                    password: hashCpassword,
                    image: "",
                    role: "user",
                    provider: "Self Register",
                    status: "active",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    tokenId: userToken,
                    hashPassword,
                    hashCpassword,
                    UserSystemAvailaiableMemory: os.freemem(),
                    UserSystemTotalMemory: os.totalmem(),
                    UserSystemPlatform: os.platform(),
                    UserSystemPlatformRelease: os.release(),
                    UserSystemType: os.type(),
                    UserSystemUptime: os.uptime(),
                    UserSystemLoadAverage: os.loadavg(),
                    UserSystemTotalStorage: os.totalmem(),
                    UserSystemFreeStorage: os.freemem(),
                    UserSystemCPU: os.cpus(),
                    UserNetworkInterfaces: os.networkInterfaces(),
                }

            )


            const UserAlreadyDetails = await GoogleDB.findOne({ email })

            if (UserAlreadyDetails) {
                res.status(400).cookie("uuid", userToken).json({ message: "User Already register with this Email" })
                return
            }

            else {

            }
            UserData.save((err, data) => {
                if (err) {
                    res.status(400).json({ message: "Opps Something error Occured, try Again" + err })
                    return
                }
                else {



                    res.status(200).cookie("uuid", userToken).json({ message: "User registered successfully, now Verify Email, Email has send to register email" })
                    return
                }
            })


        }

    } catch (err) {
        res.status(400).json({ message: "Opps Something error Occured, try Again" })
        return

    }
})




//LOCAL LOGIN

router.post("/api/login", (req, res, next) => {
    console.log(req.body)
    console.log("local storage user", req.user)

    passport.authenticate("local", {
        successRedirect: "/success",
        failureRedirect: "/login/failed",
    })(req, res, next)




})



//  SUCCESS AND FAILURE ROUTE AFTER LOGIN local auth
router.get("/success", async (req, res) => {

    try {
        // console.log("local user data", req.user)
        // console.log(req.user)



        // fs.mkdirSync(__dirname+"/public/images/"+req.user.email)
        const { _id } = req.user


        if (fs.existsSync(path.dirname(__dirname) + "/public/UserBlob/" + _id)) {
            console.log("already created")
        }
        else {
            // console.log("not created")
            fs.mkdirSync(path.dirname(__dirname) + "/public/UserBlob/" + _id, { recursive: true })
        }

        const userToken = await jsonToken.sign({ _id: req.user._id }, KEY)
        // console.log("user local stargety login token")
        console.log(userToken)
        res.cookie("uuid", userToken, { httpOnly: true })
        // console.log({ user: req.user })



        //jo jo user login or live hai unhe database mai store kr lete hai

        // req.io.on("connection", (socket) => {
        //     console.log("someone is connected")
        //     socket.on("newUser", async (data) => {
        //         // console.log("new user", data)
        //         const { _id } = await jsonToken.verify(data, KEY)
        //         //data mai ek jsonweb token hai usse user ki info extract kr lete hai 
        //         // const token


        //         const { fname, lname } = await Post.findOne({ googleId: _id })


        //         const StoreLiveUser = await onlineUser({
        //             name: fname + " " + lname,
        //             adminId: _id,
        //             socketId: socket.id,
        //             time: new Date(Date.now()),

        //         })
        //         StoreLiveUser.save((err, data) => {
        //             if (err) return res.status(400).json({ message: "Opps Something error Occured, try Again" })

        //         })
        //     })
        //     socket.on("disconnect", () => {
        //         console.log("disconnected")
        //     })
        // })



        const { name } = req.user
        if (req.user) {

            res.status(200).json({
                url: clientURL,
                message: "Login Successfull",
                user: name,
                cookie: userToken
            })
        }


    } catch (err) {
        res.status(400).json({ message: "Opps Something error Occured in the field, try Again" })
        return

    }

})


router.get("/login/failed", (req, res) => {
    res.status(401).json({ message: "Invalid Credentials" })
})











//LOGOUT AUTHENTICATION

router.post("/logout", (req, res) => {
    req.logout()
    res.clearCookie("uuid")
    res.clearCookie("token")



    res.status(200).json({ message: clientURL })


})


//================DELETE ACCOUNT ============================

router.delete("/delete/account/:id", async (req, res) => {
    try {



        const FindUser = await GoogleDB.findById(req.params.id)

        //search the Profile image of user

        const FindUserImagesAndPost = await cloudinary.search.expression(
            "folder:" + req.params.id + "/profileImage",

        ).execute()


        //seach backgriund images of user
        const backgroundImages = await cloudinary.search.expression(
            "folder:" + req.params.id + "/background",

        ).execute()

        // cloudinary.api.delete_folder(req.params.id, (err,result) => {
        //     if(err){console.log(err)}
        //     console.log("folder successful delet"+result)
        // })




        //CHECK USER DATA 
        if (FindUserImagesAndPost.resources.length > 0 || backgroundImages.resources.length > 0) {


            //delete the user profile image
            if (FindUserImagesAndPost.resources[0].folder.split("/")[0]) {

                cloudinary.api.delete_resources_by_prefix(FindUserImagesAndPost.resources[0].folder.split("/")[0],
                    function (result) {
                        console.log(result)
                        console.log("delete profile")
                    })
            }


            //delete background
            if (backgroundImages.resources[0].folder.split("/")[0]) {

                cloudinary.api.delete_resources_by_prefix(backgroundImages.resources[0].folder.split("/")[0],
                    function (result) {
                        console.log(result)
                        console.log("delete back")
                    })
            }

        }

        // if (FindUserImagesAndPost.resources.length > 0) {
        //     await cloudinary.v2.uploader.destroy(FindUserImagesAndPost)
        //     console.log("assests successful delete")

        // }



        if (FindUser) {
            req.session = null
            req.logOut()
            res.clearCookie("uuid")






            await GoogleDB.findByIdAndDelete(req.params.id)
            res.status(200).json({ message: "User Deleted Successfully" })
            return
        }
        else {
            return res.status(400).json({ message: "User Not Found" })
        }




    } catch (err) {
        res.status(400).json({ message: "Opps Something error Occured, try Again" + err })
        return


    }

})




router.get("/profile", (req, res) => {
    // console.log(req.io)

    // req.io.on("connection",(socket)=>{
    //     console.log("connected")

    // })

    // req.io.on("disconnect",(socket)=>{
    //     console.log("disconnected")

    // })




    res.status(200).send("welcome to the profile")
})




module.exports = router;



