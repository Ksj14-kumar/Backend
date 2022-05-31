const passport = require("passport")
require("dotenv").config()
const router = require("express").Router()
const clientURL = process.env.CLIENT_URL

const os = require("os")
const path = require("path")
const fs = require("fs")
const jwtToken = require("jsonwebtoken")
// console.log(os.hostname())
// console.log(path.basename(__dirname))



//GOOGLE LOGIN


// /google

router.get("/google/success", async (req, res) => {

    try {
        // console.log("google user")
        // console.log(req.user)
        // console.log(req.session)

        const { _id } = req.user

        const userToken = await jwtToken.sign({ _id }, process.env.SECRET_KEY)

        // console.log(userToken)

        // create a folder
        if (fs.existsSync(path.dirname(__dirname) + "/public/UserBlob/" + _id)) {
            // console.log("already created")
        }
        else {
            // console.log("not created")
            fs.mkdirSync(path.dirname(__dirname) + "/public/UserBlob/" + _id, { recursive: true })
        }

        // console.log("token created ")

        // console.log(req.user)
        if (req.user) {
            res.status(200).cookie("uuid", userToken).json({
                message: "Login Successfull",
                user: req.user,
                // cookie: req.cookies.info
            })
        }

        // res.redirect(clientURL)



    } catch (err) {
        return res.status(401).json({ messagee: "not authenticated"  })
        // console.log("something error occured,likely" + + err)

    }

})


router.get("/login/failed", (req, res) => {
    // console.log("invalid cr3edentials")
    // console.log(req.user)
    res.status(401).json({ message: "Invalid Credentials" })
})








router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}))

router.get("/api/login/google/redirect", (req, res, next) => {

    // console.log("redirect user details", req.user)
    // console.log(req.user)
    passport.authenticate("google", {
        failureRedirect: "/login/failed",
        successRedirect: clientURL + "/dashboard",
        // session: true


    })(req, res, next)

}
)





//TWITTER ROUTES


router.get("/twitter", passport.authenticate("twitter"))

router.get("/api/login/twitter/redirect", (req, res, next) => {

    try {
        // console.log("redirect user details", req.user)
        // console.log(req.user)
        passport.authenticate("twitter", {
            failureRedirect: "/login/failed",
            successRedirect: clientURL + "/dashboard",

            session: true
            // res.redirect("/")


        })(req, res, next)

    } catch (err) {
        console.log(err.name)

    }



}
)




//FACEBOOK ROUTES

router.get("/facebook", passport.authenticate("facebook", {
    scope: ["user_friends", "email"]
}))

router.get("/api/login/facebook/redirect", (req, res, next) => {

    // console.log("redirect user details", req.user)
    // console.log(req.user)
    passport.authenticate("facebook", {
        failureRedirect: "/login/failed",
        successRedirect: clientURL + "/dashboard",
        // session: true


    })(req, res, next)

}
)






// GITHUB ROUTES

router.get("/github", passport.authenticate("github", {
    scope: ['user:email']
}))

router.get("/api/login/github/redirect", (req, res, next) => {

    // console.log("redirect github details", req.user)
    // console.log(req.user)
    passport.authenticate("github", {
        failureRedirect: "/login/failed",
        successRedirect: clientURL + "/dashboard",
        // session: true


    })(req, res, next)

}
)






module.exports = router