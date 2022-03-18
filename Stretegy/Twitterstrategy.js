
const GoogleDB = require("../db/googledb");
const KEY = process.env.SECRET_KEY
const TwitterStrategy = require("passport-twitter").Strategy;
const passport = require('passport');
const jsonToken = require("jsonwebtoken");
let user;
module.exports = function () {


    //TWITTER STARTEGY  
    passport.use(new TwitterStrategy({

        callbackURL: "/api/login/google/redirect",
        clientID: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET
    }, async (req, accessToken, refreshToken, profile, done) => {

        console.log("twiter profile")
        console.log(profile)
        user = { ...profile }
        const tokenId = await jsonToken.sign({ email: profile.email }, KEY)

        GoogleDB.findOne({
            googleId: profile.id

        }).then(async (user) => {


            if (user) {
                console.log("user-1")
                console.log(user)
                // req.user = tokenId
                req.user = user

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
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    tokenId: tokenId1

                })
                // req.user = profile

                newUser.save().then((user) => {
                    console.log("user-2")
                    console.log(user)
                    req.user = user

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


    passport.serializeUser(function (user, done) {
        console.log("google strategy user")
        console.log(user)
        done(null, user.id);

    });

    passport.deserializeUser(function (id, done) {
        console.log("google deseriealizer user ")
        console.log(id)
        GoogleDB.findById(id, function (err, user) {
            console.log(user)
            done(err, user);
        });
    });

}