
const mongoose = require('mongoose');
// let Pusher = require('pusher');
require("dotenv").config()
const express = require("express")
const app = express()
console.log("hii, Mom")
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
    path: "/collegezone",
    cors: {
        origin: process.env.CLIENT_URL,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
    },
    cookie: {
        name: "___realtime",
        domain: process.env.CLIENT_URL,
        path: "/",
        // sameSite: "lax",
        secure: "auto"
    }
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
const httpProxy = require("http-proxy");

console.log("hii, Mom")
const URL = process.env.MONGO_URL
const PORT = process.env.PORT || 5001


//this is used for socket auth with password js for in details use socket.io doc
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);


app.get("/", (req, res) => {
    res.send("hello")
})
try {
    mongoose.connect(URL, (err) => {
        if (err) {
            console.log("not connected")
        }
        else {
            console.log("connected to db")
        }
    })

} catch (err) {
    console.log("connection err")
    console.log(err)
    // process.exit(1)
}
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
require("./Stretegy/Googlestrtegy")(passport)





app.use("/", router)
app.use("/all", GoogleRoute)
app.use("/blob", multerfile)
app.use("/history", history)
app.use("/api", Conversation)
app.use("/api", chatMessages)
app.use("/", TwitterRoute)






console.log = function (d) {
    fs.createWriteStream(__dirname + "/log.log", { flags: "a" }).write(utl.format(d) + "\n")
    process.stdout.write(utl.format(d) + "\n")

}


require("./Socket Middleware/Socket")(io)
require("./Socket/SocketMessage")
//reverse proxy for socket.io for production
httpProxy.createProxyServer({
    target: process.env.CLIENT_URL,
    ws: true,
})
require("./fsmodule")
//cludinary practice
server.listen(PORT, (err) => {
    if (err) {
        console.log({ err })
    }
    else {
        const port = server.address().port;
        console.log("server  is start at port " + port)

    }
})
