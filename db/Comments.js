const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({

    uuid: String,
    body: String,
    username: String,
    userId: String,
    post_id: String,
    parentId: String,
    createdAt: String,
    ImageUrl: String,
    type: String


})

module.exports = mongoose.model('Comments', Schema)