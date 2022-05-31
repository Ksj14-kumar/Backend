const passport = require("passport")

const router = require("express").Router()
const clientURL = process.env.CLIENT_URL



//GOOGLE LOGIN

router.get("/twitter", passport.authenticate("twitter"))

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


// // /google

// router.get("/google/success", (req, res) => {
//     console.log("google user")
//     console.log(req.session.passport.user)
//     console.log(req.user)
//     console.log(req.session)
//     console.log(req.session.passport)

//     // console.log(req.session.passport.user.profile)
//     // console.log(req.session.passport.user.profile.emails)
//     console.log(req.session.passport)
//     console.log(req.user)
//     if (req.user) {
//         res.status(200).json({
//             message: "Login Successfull",
//             user: req.user,
//             // cookie: req.cookies.info
//         })
//     }

//     // res.redirect(clientURL)
// })


// router.get("/login/failed", (req, res) => {
//     res.status(401).json({ message: "Invalid Credentials" })
// })



module.exports = router