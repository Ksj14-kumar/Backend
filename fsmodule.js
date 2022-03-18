// const os = require("os")
// const fs = require("fs")
// const path = require("path")
// const cookieSession = require("cookie-session")

// const crypto = require("crypto")




// // console.log("Pathe module in node js")
// // console.log(path.basename(__dirname))
// // console.log(path.dirname(__dirname))
// // console.log(path.dirname(__filename))
// // console.log(path.extname(__filename))
// // console.log(path.resolve(__dirname))
// // console.log(path.normalize(path.join(__dirname + "//public")))
// // console.log(path.isAbsolute("/public1"))
// // console.log(path.normalize(path.join(__dirname + "/public12" + "//public1")))
// // console.log(path.relative(__dirname, __filename))
// // console.table(__dirname)

// // console.log("Pathe module in node js")
// // console.table({ name: "Sanju", age: 21 })
// // console.log(os.freemem())
// // console.log(os.arch())
// // console.log(os.homedir())
// // console.log(os.hostname())
// // console.log(os.platform())
// // console.log(os.release())
// // console.log(os.tmpdir())
// // console.log(os.version())
// // console.log(os.totalmem())
// // console.log(os.uptime())
// // console.log(os.cpus()[0].model)
// // console.log(os.cpus())



// if (fs.existsSync(__dirname + "/test.txt")) {
//     console.log("file exists")
// }
// else {

//     console.log("file not exits")
//     fs.writeFileSync(__dirname + "/test.txt", "thi is error")
// }



// if (fs.existsSync(__dirname + "/home.txt")) {

//     // fs.readFile(__dirname + "/home.txt", (err, data) => {

//     //     console.log("file is readable", data)
//     // })


//     fs.appendFileSync(__dirname + "/home.txt", "this is home file")

//     const data = fs.readFileSync(__dirname + "/home.txt")
//     console.log(data.toString())
// }

// else {
//     console.log("home file not exits")
//     fs.writeFileSync(__dirname + "/home.txt")

// }



// if (fs.existsSync(__dirname + "/public/pub1")) {
//     console.log("directory alreadt exites")
// }
// else {
//     fs.mkdirSync(__dirname + "/public/pub1")

//     console.log("not created")
// }


// // if (fs.existsSync(__dirname + "/public/userDirectories")) {
// //     console.log("directory alreadt exites")
// // }
// // else {
// //     fs.mkdirSync(__dirname + "/public/userDirectories")

// //     console.log("not created")
// // }

// // if (fs.existsSync(__dirname + "/public/pub1/pub3")) {
// //     console.log("already created")
// // }
// // else {
// //     console.log("not created")
// //     fs.mkdirSync(__dirname + "/public/pub1/pub3")
// // }














