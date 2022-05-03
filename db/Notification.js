const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true

    },
    post_id: {
        type: String,
        required: true
    },

    likeTo: String,
    likedBy: String,
    postImageURL: String,

})



module.exports = mongoose.model('Notification', NotificationSchema);