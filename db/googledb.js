const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({
    name: String,
    email: String,
    googleId: String,
    password: String,
    image: String,
    role: String,
    status: String,
    provider: String,
    createdAt: Date,
    updatedAt: Date,
    UserSystemAvailaiableMemory: String,
    UserSystemTotalMemory: String,
    UserSystemPlatform: String,
    UserSystemPlatformRelease: String,
    UserSystemTotalStorage: String,
    UserSystemAvailableStorage: String,
    UserSystemType: String,
    UserSystemUptime: String,
    UserSystemLoadAverage: Array,
    UserSystemTotalStorage: String,
    UserSystemFreeStorage: String,
    UserSystemCPU: Array,
    UserNetworkInterfaces: Array,







})

module.exports = mongoose.model('GoogleData', Schema)