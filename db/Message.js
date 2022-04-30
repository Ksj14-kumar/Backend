const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({

    acceptUserId: String,
    acceptMessage: String,
    acceptDate: String,
    url: String,



})

module.exports = mongoose.model('messages', Schema)