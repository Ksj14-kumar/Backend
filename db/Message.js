const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({
    conversations: Array,
    messages: Array
})

module.exports = mongoose.model('messages', Schema);