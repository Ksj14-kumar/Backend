const passport = require('passport');
const os = require("os")

const GoogleDB = require("../db/googledb");

const bcrypt = require("bcrypt");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const TwitterStrategy = require("passport-twitter").Strategy;

const FacebookStrategy = require("passport-facebook").Strategy;
const GithubStrategy = require("passport-github2").Strategy;

const LocalStrategy = require("passport-local").Strategy;

const KEY = process.env.SECRET_KEY

const jsonToken = require("jsonwebtoken");
// const Post = require('../db/UserData');

let user;







// module.exports = () => {
passport.use(new GoogleStrategy({

    callbackURL: "http://localhost:5000/all/api/login/google/redirect",
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
}, async (req, accessToken, refreshToken, profile, done) => {
    console.log("iser profile dta")
    console.log(profile)
    // return done(null, profile);




    console.log("profile data")
    console.log(profile)


    // const userToken = await jsonToken.sign({ _id: profile.id }, KEY)
    GoogleDB.findOne({
        googleId: profile.id
    }).then(async (user) => {
        if (user) {
            console.log("user-1")
            console.log(user)
            // req.user = tokenId
            req.user = user
            // res.cookie("uuid", userToken)

            return done(null, user)
        }
        else {
            const tokenId1 = await jsonToken.sign({ email: profile.email }, KEY)
            // console.log("token dhfdsh")
            // console.log(tokenId1)
            const newUser = await new GoogleDB({
                name: profile.displayName,
                email: profile.email,
                googleId: profile.id,
                password: profile.id,
                image: profile.photos[0].value,
                role: "user",
                status: "active",
                provider: "google",
                createdAt: new Date(),
                updatedAt: new Date(),
                tokenId: tokenId1,
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






            })
            // req.user = profile

            newUser.save().then((user) => {
                console.log("user-2")
                console.log(user)
                req.user = user
                // res.cookie("uuid", userToken)

                return done(null, user)

            }).catch((err) => {

                console.log("error", err)
            }
            )
        }
    }).catch((err) => {
        console.log("error", err)

    })
}

))
// }







//TWITTER

passport.use(new TwitterStrategy({

    consumerKey: "mLRbWZBfhsVHFxJVsva1AJDGr",
    consumerSecret: "XWXKYNJ6nflNLcmjFXuE73IzH95GLTmcoOmI2K9pDJHowqRMVv",
    callbackURL: "http://www.localhost:5000/all/api/login/twitter/redirect"
}, async (req, accessToken, refreshToken, profile, cb) => {


    return cb(null, profile)

    // user = { ...profile }

    // console.log("twitter profile")
    // console.log(profile)



    // const tokenId = await jsonToken.sign({ email: profile.email }, KEY)
    // GoogleDB.findOne({
    //     googleId: profile.id
    // }).then(async (user) => {
    //     if (user) {
    //         console.log("user-1")
    //         console.log(user)
    //         // req.user = tokenId
    //         req.user = user

    //         return done(null, user)
    //     }
    //     else {
    //         const tokenId1 = await jsonToken.sign({ email: profile.email }, KEY)
    //         // console.log("token dhfdsh")
    //         // console.log(tokenId1)
    //         const newUser = await new GoogleDB({
    //             name: profile.displayName,
    //             email: profile.email,
    //             googleId: profile.id,
    //             password: profile.id,
    //             image: profile.photos[0].value,
    //             role: "user",
    //             status: "active",
    //             createdAt: new Date(),
    //             updatedAt: new Date(),
    //             tokenId: tokenId1

    //         })
    //         // req.user = profile

    //         newUser.save().then((user) => {
    //             console.log("user-2")
    //             console.log(user)
    //             req.user = user

    //             return done(null, user)

    //         }).catch((err) => {

    //             console.log("error", err)
    //         }
    //         )
    //     }
    // }).catch((err) => {
    //     console.log("error", err)

    // })
}

))


//  FACEBOOK STRATEGY

passport.use(new FacebookStrategy({
    callbackURL: "http://localhost:5000/all/api/login/facebook/redirect",
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    profileFields: ['id', 'displayName', 'photos', 'email']
},
    async (accessToken, refreshToken, profile, done) => {
        // console.log("facebook daata")
        // console.log(profile)
        // console.log("facebook profile data")
        // return cb(null, profile)






        const tokenId = await jsonToken.sign({ id: profile.id }, KEY)

        // console.log("yoken id is ")
        // console.log(tokenId)
        const user = await GoogleDB.findOne({
            googleId: profile.id
        })


        if (user) {
            return done(null, user)
        }
        else {
            const tokenId1 = await jsonToken.sign({ id: profile.id }, KEY)
            const SaveUserInfo = await new GoogleDB({
                name: profile.displayName,
                email: profile.emails[0].value !== undefined ? profile.emails[0].value : "null email",
                googleId: profile.id,
                password: profile.id,
                image: profile.photos[0].value !== undefined ? profile.photos[0].value : "null image",
                role: "user",
                statue: "active",
                provider: profile.provider,
                createdAt: new Date(),
                updatedAt: new Date(),
                tokenId: tokenId1,
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




            })

            SaveUserInfo.save((err) => {
                if (err) {
                    console.log("user not save ", err.name)
                    return done(null, false)
                }
                else {
                    console.log("user successfull saved")
                    return done(null, user)
                }
            })
        }


    }

))




//   LOCAL STRATEGY


passport.use(new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    GoogleDB.findOne({ email: email }, async (err, user) => {

        console.log("local  users")
        console.log(user)


        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, { message: "User not found" });
        }
        else {

            const VerifyPassword = await bcrypt.compare(password, user.password);
            if (!VerifyPassword) {
                return done(null, false, { message: "Invalid credentials" });
            }
            else {
                console.log("user is found")
                console.log(user)
                return done(null, user);
            }


        }

    })


}))




//  GITHUB STRATEGY


passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:5000/all/api/login/github/redirect"
    // profileFields: ['email']


},
    async (accessToken, refreshToken, profile, done) => {

        // console.log("github profile")
        // console.log(profile)

        // return done(null, profile)
        try {

            const user = await GoogleDB.findOne({
                password: profile.id
            })

            // console.log("user info ", UserInfo)
            // console.log(UserInfo)

            if (user) {
                return done(null, user)
            }
            else {

                // console.log("create account")
                const user = await new GoogleDB({
                    name: profile.displayName,
                    // email: profile.email !== null ? profile.email : "null email",
                    // googlId: profile.nodeId,
                    password: profile.id,
                    image: profile.photos[0].value ? profile.photos[0].value : "null image",
                    role: "user",
                    // statue: "active",
                    provider: profile.provider,
                    createdAt: new Date(),
                    updatedAt: new Date(),
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
                    // tokenId: accessToken


                })

                console.log("save data")
                user.save((err) => {
                    if (err) {
                        console.log("user not save ", err.name)
                        return done(null, err)
                    }
                    else {
                        console.log("save successfull")
                        return done(null, user)
                    }


                })
            }

        } catch (err) {
            console.log("something error found ", err.name)

        }



    }


))























//PASSWORD DESCRILIZE AND STRATEGY
passport.serializeUser(function (user, done) {

    done(null, user.id);
    // done(null, user)

});

passport.deserializeUser(function (id, done) {
  
    GoogleDB.findById(id, function (err, user) {
        // console.log(user)
        done(err, user);
    });
    // done(null, user)
});