



const jwt = require("jsonwebtoken");
const GoogleDb = require("../db/googledb");
require('dotenv').config();
// , "token": userToken }
const KEY = process.env.SECRET_KEY
const Auth = async (req, res, next) => {
    try {
        const userToken = req.cookies.uuid
        console.log("user token", userToken)
        console.log(userToken)
        const verifyToken = await jwt.verify(userToken, KEY)
        console.log("verifytoken", verifyToken)
        console.log(verifyToken)
        const VerifyUser = await GoogleDb.findOne({ _id: verifyToken._id })
        console.log("verigy user", VerifyUser)
        console.log(VerifyUser)
        console.log("verify token", verifyToken);
        if (!VerifyUser) {
            console.log("user not verify")
            // res.redirect("http://localhost:3000/dashboard")
            // res.json({ message: "user not verify" })

        }
        else {
            req.token = userToken
            req.userData = VerifyUser
        }
        next()
    }
    catch (err) {
        return res.status(401).json({ message: "user not verify" })

    }

}



module.exports = {

    isAuth: function (req, res, next) {
        if (req.isAuthenticated()) {
            req.user = req.user
            return next()
        }
        else {
            res.json({ message: "not authenticated" })

        }

    }

}
