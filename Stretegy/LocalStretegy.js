const passport = require('passport');

const LocalStretegy = require("passport-local").Strategy;

const Post = require("../db/UserData");

const bcrypt = require("bcrypt");
const GoogleDB = require('../db/googledb');


module.exports = async function () {
    passport.use(new LocalStretegy({ usernameField: "email" }, (email, password, done) => {
        GoogleDB.findOne({ email: email }, async (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, { message: "User not found" });
            }
            else {

                const VerifyPassword = await bcrypt.compare(password, user.hashPassword);
                if (!VerifyPassword) {
                    return done(null, false, { message: "Invalid credentials" });
                }
                else {
                    return done(null, user);
                }


            }

        })


    }))


    // PASSWORD DESCRILIZE AND STRATEGY
    // passport.serializeUser(function (user, done) {
    //     console.log("local strategy user")
    //     console.log(user)
    //     done(null, user.id);

    // });

    // passport.deserializeUser(function (id, done) {
    //     console.log("deseriealizer user ")
    //     console.log(id)
    //     Post.findById(id, function (err, user) {
    //         done(err, user);
    //     });
    // });

}