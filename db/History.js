const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    adminId: String,
    history: {
        type: Array,


    },


})


Schema.index({ adminId: 1 }, { unique: true })




module.exports = new mongoose.model('History', Schema);