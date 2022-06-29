const express = require('express');
const mongoose = require('mongoose');


const ChatMessages = new mongoose.Schema({

    conversationId: { type: String },
    senderId: {
        type: String
    },
    text: String,
    time: {
        type: String,
        default: Date.now()
    },

})
ChatMessages.index({ text: 1, time: 1 }, { unique: true })

module.exports = mongoose.model('ChatMessages', ChatMessages)