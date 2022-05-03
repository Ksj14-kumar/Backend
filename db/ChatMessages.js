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
    }







})

module.exports = mongoose.model('ChatMessages', ChatMessages)