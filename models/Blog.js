const mongoose = require('mongoose');
const { schema } = require('./secure/postValidation');
const mongoosePaginate = require("mongoose-paginate")

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 255
    },
    body: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "public",
        enum: ["private", "public"],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    thumbnail: {
        type: String,
        required: true
    }
});

blogSchema.index({ title: 'text' })

blogSchema.statics.postValidation = function(body) {
    return schema.validate(body, { abortEarly: false })
}

blogSchema.plugin(mongoosePaginate)

// const Blog = mongoose.model('Blog', blogSchema);
// module.exports = Blog;

module.exports = mongoose.model('Blog', blogSchema);