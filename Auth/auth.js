



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



// module.exports = {

//     isAuth: async function (req, res, next) {
//         const userToken = req.cookies.uuid
//         console.log("user token", userToken)
//         console.log(userToken)
//         const verifyToken = await jwt.verify(userToken, KEY)
//         console.log("verifytoken", verifyToken)
//         console.log(verifyToken)
//         const VerifyUser = await GoogleDb.findOne({ email: verifyToken.email }) || await GoogleDb.findOne({ _id: verifyToken._id })
//         console.log("verigy user", VerifyUser)
//         console.log(VerifyUser)
//         console.log("verify token", verifyToken);
//         console.log(verifyToken)




//         if (req.isAuthenticated()) {
//             req.user = req.user

//             return next()
//         }
//         else {
//             res.status(500).json({ message: "not authenticated" })

//         }

//     }

// }



exports.AuthToken = async (req, res, next) => {
    try {



        // req.cookies.uuid || req.body.uuid   ||req.headers.cookie.uuiid|| 
        const userToken = req.cookies.uuid || req.body.uuid || req.headers.cookie.uuiid || req.headers.authorization.split("Bearer ")[1]
        console.log("user token", userToken)
        console.log(userToken)
        const verifyToken = await jwt.verify(userToken, KEY)
        console.log("verifytoken", verifyToken)
        console.log(verifyToken)
        const VerifyUser = await GoogleDb.findOne({ _id: verifyToken._id })
        console.log("verigy user")
        // console.log(VerifyUser)

        if (!VerifyUser) {
            console.log("user not verify")
            // res.redirect("http://localhost:3000/dashboard")
            return res.status(401).json({ message: "user not verify" })

        }
        else if (VerifyUser) {
            req.token = userToken
            req._id = verifyToken._id
            req.userData = VerifyUser
        }

        next()



    } catch (err) {
        return res.status(401).json({ message: "user not verify" })


    }

}