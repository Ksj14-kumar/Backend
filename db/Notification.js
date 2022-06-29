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
    time: {
        type: String,
        default: Date.now()
    }

})


NotificationSchema.index({ name: 1, url: 1, post_id: 1 }, { unique: true })



module.exports = mongoose.model('Notification', NotificationSchema);