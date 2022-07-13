
const fs = require("fs")
const os = require("os")
const express = require('express');
const router = express.Router();
// const Post = require("../db/UserData");
const jsonToken = require("jsonwebtoken")
const passport = require("passport")
const bcrypt = require("bcrypt");
const GoogleDB = require('../db/googledb');
const { cloudinary } = require("../Cloudnary/cloudnary");
const path = require("path");
const { AuthToken } = require('../Auth/auth');
const { route } = require("./Conversation");
const UserData = require("../db/UserData");
const TextPost = require("../db/TextPost");
const LocalStrategy = require("passport-local").Strategy;
const KEY = process.env.SECRET_KEY
const clientURL = process.env.CLIENT_URL
const Comment = require("../db/Comments")
let userInfo = null

router.get("/", (req, res) => {
    res.send("Hello World");
})








// //PASSWORD DESCRILIZE AND STRATEGY
// passport.serializeUser(function (user, done) {
//     // console.log(done(null, user.id))
//     console.log(user)
//      done(null, user.id);
//     // done(null, user)
// });
// passport.deserializeUser(function (id, done) {
//     GoogleDB.findById(id, function (err, user) {
//         if (err) {
//              done(null, false, { error: err });
//         }
//         else {
//              done(null, user)
//         }
//     });
//     // done(null, user)
// });




// passport.use(new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
//     GoogleDB.findOne({ email: email }, async (err, user) => {
//         // console.log("local  users")
//         // console.log(user)
//         if (err) {
//             return done(err);
//         }
//         if (!user) {
//             return done(null, false, { message: "User not found" });
//         }
//         else {
//             const VerifyPassword = await bcrypt.compare(password, user.password);
//             if (!VerifyPassword) {
//                 return done(null, false, { message: "Invalid credentials" });
//             }
//             else {
//                 // console.log("user is found")
//                 // console.log(user)
//                  done(null, user);
//             }
//         }
//     })
// }))

























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

router.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            res.status(400).json({ message: "please check your internet connection" + err })
            return
        }
        if (!user) {
            res.status(400).json({ message: "User not found" })
            return
        }
        req.logIn(user, async (err) => {
            if (err) {
                res.status(400).json({ message: "login failed" })
                return
            }

            const userToken = await jsonToken.sign({ _id: req.user._id }, KEY)
            res.status(200).json({
                url: clientURL,
                message: "Login Successfull",
                user: user.name,
                cookie: userToken
            })
            return
        })
    })(req, res, next)


})

// passport.authenticate("local", {
//     successRedirect: "/success",
//     failureRedirect: "/login/failed",
// })

// router.post("/api/login", (req, res, next) => {
//     // console.log("local storage user", req.user)
//     console.log("local user when login")
//     console.log(req.body)
//     console.log(req.user)
//     // console.log("local user /when logout")

//     passport.authenticate("local", {
//         successRedirect: "/success",
//         failureRedirect: "/login/failed",
//     })(req, res, next)
//     console.log(req.user)

// })



//  SUCCESS AND FAILURE ROUTE AFTER LOGIN local auth
router.get("/success", async (req, res) => {
    // console.log("user success req.user")
    // console.log(req.user)
    console.log("success")

    try {
        // console.log("private user")
        // console.log(req._user)

        // console.log("local user data")
        // console.log(res.locals.user)
        // console.log(req.user)
        // console.log("success is /end")


        // fs.mkdirSync(__dirname+"/public/images/"+req.user.email)
        const { _id } = req.user
        if (fs.existsSync(path.dirname(__dirname) + "/public/UserBlob/" + _id)) {
            // console.log("already created")
        }
        else {
            // console.log("not created")
            fs.mkdirSync(path.dirname(__dirname) + "/public/UserBlob/" + _id, { recursive: true })
        }
        const userToken = await jsonToken.sign({ _id: req.user._id }, KEY)
        // console.log("user local stargety login token")
        // console.log(userToken)
        res.cookie("uuid", userToken)
        // console.log({ user: req.user })
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
        res.status(400).json({ message: "Opps Something error Occured in the field, try Again" + err })
        return

    }

})


router.get("/login/failed", (req, res) => {
    console.Console("lofginb")
    res.status(401).json({ message: "Invalid Credentials" })
})











//LOGOUT AUTHENTICATION

router.post("/logout", AuthToken, (req, res) => {
    req.logout()
    res.clearCookie("uuid")
    res.clearCookie("token")



    res.status(200).json({ message: clientURL })


})


//================DELETE ACCOUNT ============================

router.delete("/delete/account/:id", AuthToken, async (req, res) => {
    try {



        const id = req._id
        console.log({ id })
        const FindUser = await GoogleDB.findOne({ _id: id })

        //search the Profile image of user

        const FindUserImagesAndPost = await cloudinary.search.expression(
            "folder:" + id + "/profileImage",

        ).execute()


        //seach backgriund images of user
        const backgroundImages = await cloudinary.search.expression(
            "folder:" + id + "/background",

        ).execute()


        //CHECK USER DATA 
        if (FindUserImagesAndPost.resources.length > 0 || backgroundImages.resources.length > 0) {


            //delete the user profile image
            if (FindUserImagesAndPost.resources[0].folder.split("/")[0]) {

                cloudinary.api.delete_resources_by_prefix(FindUserImagesAndPost.resources[0].folder.split("/")[0],
                    function (result) {
                        // console.log(result)
                        // console.log("delete profile")
                    })
            }


            //delete background
            if (backgroundImages.resources[0].folder.split("/")[0]) {

                cloudinary.api.delete_resources_by_prefix(backgroundImages.resources[0].folder.split("/")[0],
                    function (result) {
                        // console.log(result)
                        // console.log("delete back")
                    })
            }

        }

        if (FindUser) {
            //delte all user post and comments
            await TextPost.deleteMany({ userId: id })
            await Comment.deleteMany({ userId: id })
            await GoogleDB.findOneAndDelete({ _id: id })
            await UserData.findOneAndDelete({ googleId: id })
            req.session = null
            req.logOut()
            res.clearCookie("uuid")
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




router.get("/profile", AuthToken, (req, res) => {
    // console.log(req.io)

    // req.io.on("connection",(socket)=>{
    //     console.log("connected")

    // })

    // req.io.on("disconnect",(socket)=>{
    //     console.log("disconnected")

    // })




    res.status(200).send("welcome to the profile")
})


router.get("/:id", async (req, res) => {
    try {
        const user = await UserData.findOne({ googleId: req.params.id })
        // console.log({ user })
        if (user) {
            return res.status(200).json({ user })
        }
        else {
            return res.status(400).json({ message: "User Not Found" })
        }



    } catch (err) {
        res.status(400).json({ message: "Opps Something error Occured, try Again" })
        return

    }
})


module.exports = router;
