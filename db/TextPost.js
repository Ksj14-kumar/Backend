const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({

    post_id: String,
    text: String,
    username: String,
    image: String,
    userId: String,
    createdAt: String,
    privacy: String,
    fileType: String,
    // likes_count: {
    //     type: Number,
    // },
    liked: {
        type: Array,
        // unique: false,
        
    },

    time: {
        type: String,
        default: new Date(Date.now()).getTime().toLocaleString()

    },


})

module.exports = mongoose.model('TextPosts', Schema)



