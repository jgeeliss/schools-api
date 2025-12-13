const mongoose = require('mongoose');

const organisationSchema = new mongoose.Schema({
    _id: {
        // _id needs to be a String to store UUIDs
        type: String
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['school', 'board', 'umbrella'],
        required: [true, 'Type is required']
    },
    // level: {
    //     type: String,
    //     enum: ['primary', 'secondary', 'higher', 'other'],
    //     default: 'other'
    // },
    belongsTo: {
        type: String,
        // note: this field will store the permalink of a document from another Organisation:
        ref: 'Organisation',
        default: null
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },
    telephone: {
        type: String,
        required: [true, 'Telephone is required'],
    }
}, {
    // note: automatically manages two special date fields in MongoDB: createdAt and updatedAt
    timestamps: true
});

const Organisation = mongoose.model('Organisation', organisationSchema);

module.exports = Organisation;