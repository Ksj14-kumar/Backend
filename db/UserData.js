const mongoose = require('mongoose');


const Schema = new mongoose.Schema({
    username: String,
    fname: String,
    lname: String,
    gender: String,
    address: String,
    city: String,
    country: String,
    postalCode: String,
    college: String,
    stream: String,
    degree: String,
    position: String,
    aboutMe: String,
    googleId: String,
    url: String,
    friends: Array,
    senderrequest: Array,
    receiverrequest: Array,
    message: Array,
    bookMarkPost: Array,
    bookMarkBy: Array,
    AllNotification: Array,
    theme: {
        type: Boolean,
        default: false
    },

})

Schema.index({ username: 1 }, { unique: true })

// Schema.add({
//     token: {
//         required: true,
//         type: String
//     }
// })




module.exports = mongoose.model("UserRegistrationDetails", Schema)