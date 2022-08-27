const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const mongoosePaginate = require('mongoose-paginate');

const { schema } = require("./secure/userValidation");

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, "نام و نام خانوادگی الزامی می باشد"],
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 255,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {toJSON : {virtuals : true}});

userSchema.virtual("blogs", {
    ref : "Blog",
    localField : "_id",
    foreignField : "user"
})

userSchema.statics.userValidation = function(body) {
    return schema.validate(body, { abortEarly: false });
};

userSchema.plugin(mongoosePaginate);

userSchema.pre('save', function(next) {
    const user = this;

    if (!user.isModified('password')) return next();

    bcrypt.hash(user.password, 10, (err, hash) => {
        if (err) return next(err)
        user.password = hash
        next()
    })
})

userSchema.post('save', () => {
    console.log('The new user saved.')
})

// const User = mongoose.model("User", userSchema);
// module.exports = User;

module.exports = mongoose.model("User", userSchema);