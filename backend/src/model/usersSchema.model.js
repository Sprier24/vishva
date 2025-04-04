const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            trim: true
        },
        isVerified :{
            type:Boolean,
            default:false,
        },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
        verificationCode: { type: String },
        verificationCodeExpires: { type: Date },
        isFirstLogin:{
            type:Boolean,
            default:true
        },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const Users = mongoose.model("users", usersSchema);

module.exports = Users;
