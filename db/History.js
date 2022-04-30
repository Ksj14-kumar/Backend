const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    adminId: String,
    history: {
        type: Array,


    }

})





module.exports = new mongoose.model('History', Schema);