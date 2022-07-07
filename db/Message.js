const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({
    conversations: Array,
    messages: [{
        message: { type: String },
        time: { type: Number },
        senderId: { type: String },
        type: { type: String },
        messageID: { type: Number },
        read: { type: Boolean },
        forwarded: { type: Boolean, default: false },
    }],
    block: { type: Boolean, default: false }
})

// Schema.index({ conversations: 1 }, { unique: true })
module.exports = mongoose.model('messages', Schema);
