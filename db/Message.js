const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({
    conversations: Array,
    messages: Array
})

Schema.index({ conversations: 1 }, { unique: true })

module.exports = mongoose.model('messages', Schema);