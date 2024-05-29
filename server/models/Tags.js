const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    course:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    }
});

module.exports = mongoose.model("Tag", TagSchema)