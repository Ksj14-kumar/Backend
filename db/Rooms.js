const express = require('express');
const mongoose = require('mongoose');


const Schema = new mongoose.Schema({
    RoomId: String,
    RoomName: String,
    RoomType: String,
    admin: Array,
    RoomDescription: String,
    RoomImage: {
        type: String,

    },
    RoomCreatedBy: String,
    RoomCreatedDate: String,
    RoomModifiedBy: String,
    RoomModifiedDate: String,
    RoomStatus: String,
    RoomMembers: Array,
    RoomMessages: Array,
    RoomLastMessage: String,
    RoomLastMessageDate: String,
    RoomLastMessageBy: String,
    RoomLastMessageSeen: String,
    RoomLastMessageSeenBy: String,
    RoomLastMessageSeenDate: String,
    RoomLastMessageSeenStatus: String,
    RoomLastMessageSeenStatusBy: String,
    RoomLastMessageSeenStatusDate: String,
    time: String,



})

Schema.index({ RoomId: 1 }, { unique: true })

module.exports = mongoose.model('rooms', Schema);