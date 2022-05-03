const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({

    name: String,
    adminId: String,
    socketId: String,
    profilePic: String,
    time: String,




})

module.exports = mongoose.model('onlineUser', Schema)