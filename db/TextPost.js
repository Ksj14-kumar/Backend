const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({
    username: String,
    post_id: String,
    image: String,
    fileType: String,
    post_url: {
        type: String,
        required: true
    },
    text: String,
    time: {
        type: String,
        default: Date.now()
    },
    createdAt: String,
    liked: {
        type: Array,
    },
    privacy: String,
    profileImage: String,
    userId: String,
    admin: Boolean,
    title: String,
    postType: String,
    source: String,
    NewsURL: String,
    des: String,




})

Schema.index({ "post_id": 1 }, { unique: true })

module.exports = mongoose.model('TextPosts', Schema)

// username: item.author,
// post_id: crypto.randomUUID(),
// image: item.urlToImage,
// fileType: "image",
// post_url: item.url,
//
// text: item.content,
// time: Date.parse(item.publishedAt),
// createdAt: Date.parse(item.publishedAt),
// liked: [],
// privacy:"public",
// profileImage: item.source.name.includes(" ") ? item.source.name.split(" ")[0][0] + item.source.name.split(" ")[1][0] : item.source.name[0].toUpperCase() + item.source.name[item.source.name.length - 1].toUpperCase(),
// userId: RandomID,
// title: item.title,
// postType: "news",
//
// title: item.title,
// source: item.source,
// NewsURL: item.url,
// des: item.description,
