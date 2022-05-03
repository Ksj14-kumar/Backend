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
    profileImage: String,
    // likes_count: {
    //     type: Number,
    // },
    liked: {
        type: Array,

    },
    post_url: {
        type: String,
        required: true
    },

    time: {
        type: String,
        default: Date.now()

    },



})

module.exports = mongoose.model('TextPosts', Schema)



