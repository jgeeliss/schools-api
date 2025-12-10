const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    _id: {
        // _id needs to be a String to store UUIDs
        type: String
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    teacher: {
        type: String,
        required: [true, 'Teacher is required'],
        trim: true
    },
    belongsTo: {
        type: String,
        // note: this field will store the permalink of a document from a School:
        ref: 'School',
        default: null
    }
}, {
    // note: automatically manages two special date fields in MongoDB: createdAt and updatedAt
    timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;