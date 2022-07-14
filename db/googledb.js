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
    username: String,
    fname: String,
    lname: String,
    gender: String,
    address: String,
    city: String,
    country: String,
    postalCode: String,
    college: String,
    stream: String,
    degree: String,
    position: String,
    aboutMe: String,
    verified: { type: Boolean, default: false },
})

// Schema.index({ name: 1 }, { unique: true })

module.exports = mongoose.model('GoogleData', Schema)