const mongoose = require('mongoose');


const Schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    hashPassword: { type: String, required: true },
    hashCpassword: { type: String, required: true }
})


Schema.add({
    token: {
        required: true,
        type: String
    }
})




module.exports = mongoose.model("UserRegistrationDetails", Schema)