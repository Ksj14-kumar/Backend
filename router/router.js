
const fs = require("fs")
const os = require("os")
const express = require('express');
const router = express.Router();
const Post = require("../db/UserData");
const jsonToken = require("jsonwebtoken")
const passport = require("passport")
const bcrypt = require("bcrypt");
const GoogleDB = require('../db/googledb');

const path = require("path")

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



//  SUCCESS AND FAILURE ROUYTE AFTER LOGIN local auth
router.get("/success", (req, res) => {

    try {
        console.log("local user data", req.user)
        console.log(req.user)

        // fs.mkdirSync(__dirname+"/public/images/"+req.user.email)
        const { _id } = req.user


        if (fs.existsSync(path.dirname(__dirname) + "/public/UserBlob/" + _id)) {
            console.log("already created")
        }
        else {
            // console.log("not created")
            fs.mkdirSync(path.dirname(__dirname) + "/public/UserBlob/" + _id, { recursive: true })
        }

        const userToken = jsonToken.sign({ email: req.user.email }, KEY)
        if (req.user) {

            res.cookie("uuid", userToken).status(200).json({
                url: clientURL,
                message: "Login Successfull",
                user: req.user,
                cookie: req.cookies
            })
        }


    } catch (err) {
        res.status(400).json({ message: "Opps Something error Occured in the field, try Again" + err.name })
        return

    }

})


router.get("/login/failed", (req, res) => {
    res.status(401).json({ message: "Invalid Credentials" })
})











//LOGOUT AUTHENTICATION

router.get("/logout", (req, res) => {

    res.clearCookie("tokenId")
    res.clearCookie("info")

    delete req.session.session
    req.session.destroy((err) => {
        req.logOut()
        res.status(200).redirect(clientURL)

    })


})








router.get("/profile", (req, res) => {
    res.render("profile")
})





module.exports = router;



