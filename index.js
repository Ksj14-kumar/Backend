
const mongoose = require('mongoose');
// let Pusher = require('pusher');


require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")
const fs = require("fs")
const os = require("os")
const utl = require("util")
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",


        // credentials: true,
        // maxAge: "3600",
        // preflightContinue: false
    }



})



//top file end

require("./Stretegy/Googlestrtegy")
const bodyParser = require("body-parser")
app.set("views engine", "ejs")
const router = require("./router/router");
const GoogleRoute = require("./router/AllLogin")
const TwitterRoute = require("./router/twitterRoute")
const multerfile = require("./multer/multerImage")

const compression = require('compression')

const session = require("express-session");
const cookieSession = require("cookie-session")
const cookieParser = require("cookie-parser")
const passport = require('passport');
const path = require('path');


const URL = process.env.MONGO_URL
const port = process.env.PORT || 5001


require("./Socket Middleware/Socket")(io)




//use the socket.io as middleware

// app.use(function (req,res,next){
//     req.io=io
//     next()
// })

app.use(function (req, res, next) {
    res.setTimeout(120000, function () {
        console.log('Request has timed out.');
        res.sendStatus(408);
    });

    next();
});
app.use(cors())
mongoose.connect(URL, (err) => {
    if (err) {
        console.log("not connected")
    }
    else {
        console.log("connected to db")
    }
})





app.use(compression())
app.use(express.static(path.join(__dirname, '/public/userDirectories')))
// app.set('trust proxy', 1)
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(cors())
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
        sameSite: "lax",
    }
}))

console.log(process.env.NODE_ENV)





app.use(passport.initialize())
app.use(passport.session())

app.use(function (req, res, next) {
    console.log("in index.js files")
    console.log(req.user)
    res.locals.user = req.user || null
    next();
})


// {
//     origin: "http://localhost:3000/",
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//     credentials: true,

// }





// ALL ENV VARIABLE 


app.use("/", router)
app.use("/all", GoogleRoute)
app.use("/blob", multerfile)
// app.use("/", TwitterRoute)




console.log = function (d) {
    fs.createWriteStream(__dirname + "/log.log", { flags: "a" }).write(utl.format(d) + "\n")
    process.stdout.write(utl.format(d) + "\n")

}


// require("./fsmodule")
//cludinary practice


server.listen(port, (req, res) => {
    console.log("server  is start at port " + port)
})
