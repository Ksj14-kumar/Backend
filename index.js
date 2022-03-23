

const mongoose = require('mongoose');
require("dotenv").config()


const express = require("express")
const app = express()


const cors = require("cors")

const fs = require("fs")
const os = require("os")
const utl = require("util")


//top file end


// const GoogleDB = require("./db/googledb");
// const Post = require("./db/UserData")
require("./Stretegy/GoogleStrtegy")
const bodyParser = require("body-parser")

app.set("views engine", "ejs")
const router = require("./router/router");
const GoogleRoute = require("./router/AllLogin")
const TwitterRoute = require("./router/twitterRoute")
const multerfile = require("./multer/multerImage")


const session = require("express-session");
const cookieSession = require("cookie-session")
const cookieParser = require("cookie-parser")
const passport = require('passport');
const path = require('path');

const URL = process.env.MONGO_URL
const port = process.env.PORT || 5001
mongoose.connect(URL, (err) => {
    if (err) {
        console.log("not connected")
    }
    else {
        console.log("connected")

    }
})




app.use(express.static(path.join(__dirname, '/public/userDirectories')));


app.set('trust proxy', 1)
app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" })
)
app.use(bodyParser.json({ limit: '50mb' }))
app.use(session({
    name: "session id",
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    cookie: {
        // name: "session",
        // maxAge: 1000 * 60 * 60 * 24 * 7,
        // httpOnly: false,
        secure: "auto",
        // sameSite: "lax",
    }

}))





app.use(passport.initialize())
app.use(passport.session())


app.use(cors())


// {
//     origin: "http://localhost:3000/",
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//     credentials: true,

// }





// ALL ENV VARIABLE 








app.use("/", router)
app.use("/", GoogleRoute)
app.use("/", multerfile)
// app.use("/", TwitterRoute)


console.log = function (d) {
    fs.createWriteStream(__dirname + "/log.log", { flags: "a" }).write(utl.format(d) + "\n")
    process.stdout.write(utl.format(d) + "\n")

}







require("./fsmodule")


app.listen(port, (req, res) => {
    console.log("server  is start at port " + port)
})
