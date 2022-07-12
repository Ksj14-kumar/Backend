
const mongoose = require('mongoose');
// let Pusher = require('pusher');


require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")
const fs = require("fs")
const os = require("os")
const utl = require("util")
const axios = require("axios")
const crypto = require("crypto")
const uuid = require("uuid").v4()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, {

    path:"/collegezone",
    // transports: [ "websocket"],
    cors: {
        origin: process.env.CLIENT_URL,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
    },
    // cookie: {-
    //     name: "session cookie",
    //     domain: process.env.CLIENT_URL,
    //     path: "/",
    //     sameSite: "lax",
    //     secure: "auto"
    // }
})


// io.set("origins", "*:*");

//top file end

const bodyParser = require("body-parser")
app.set("views engine", "ejs")
const router = require("./router/router");
const GoogleRoute = require("./router/AllLogin")
const TwitterRoute = require("./router/twitterRoute")
const multerfile = require("./multer/multerImage")
const history = require("./multer/History")
const Conversation = require("./router/Conversation")
const chatMessages = require('./router/Messages')
const compression = require("compression")

const session = require("express-session");
const cookieSession = require("cookie-session")
const cookieParser = require("cookie-parser")
const passport = require('passport');
const path = require('path');
const { truncatedNormal } = require('@tensorflow/tfjs');
const httpProxy = require("http-proxy");
const TextPost = require('./db/TextPost');


const URL = process.env.MONGO_URL
const port = process.env.PORT || 5001

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);



try {
    // { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
    mongoose.connect(URL, (err) => {
        if (err) {
            console.log("not connected")
        }
        else {
            console.log("connected to db")
        }
    })

} catch (err) {
    console.log(err)
    // process.exit(1)
}


//use the socket.io as middleware

// app.use(function (req,res,next){
//     req.io=io
//     next()
// })
app.use(function (req, res, next) {
    res.setTimeout(120000, function () {
        console.log(' from index file Request has timed out.');
        res.sendStatus(408);
    });

    next();
});
app.use(compression())
app.use(express.static(path.join(__dirname, '/public/userDirectories')))
app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" }))
app.use(bodyParser.json({ limit: '200mb' }))
// app.set('trust proxy', 1)
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    // preflightContinue: false,
    // optionsSuccessStatus: 200
}
))


app.use(session({
    name: "session id",
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    cookie: {
        name: "session",
        // maxAge: 1000 * 60 * 60 * 24 * 7,
        // httpOnly: false,
        // expires: false,
        secure: "auto",
        sameSite: "lax",
    }
}))
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())

// console.log("",process.env.NODE_ENV
require("./Stretegy/Googlestrtegy")(passport)



app.use("/", router)
app.use("/all", GoogleRoute)
app.use("/blob", multerfile)
app.use("/history", history)
app.use("/api", Conversation)
app.use("/api", chatMessages)
// app.use("/", TwitterRoute)






console.log = function (d) {
    fs.createWriteStream(__dirname + "/log.log", { flags: "a" }).write(utl.format(d) + "\n")
    process.stdout.write(utl.format(d) + "\n")

}

//socket middleware
// io.use((socket, next) => {
//     const token = socket.handshake.auth.token
//     console.log(token)
//     if (token) {
//         jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
//             if (err) {
//                 console.log(err)
//                 return next(new Error("Authentication error"))
//             }
//             console.log(decode)
//             console.log("successfull verify")
//             socket.decoded = decoded
//             next()
//         }
//         )
//     }
// })

require("./Socket Middleware/Socket")(io)
require("./Socket/SocketMessage")
//reverse proxy for socket.io for production
httpProxy.createProxyServer({
    target: process.env.CLIENT_URL,
    ws: true,
})

require("./fsmodule")
//cludinary practice


server.listen(port, (req, res) => {
    console.log("server  is start at port " + port)
})
