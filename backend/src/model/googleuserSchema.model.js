const mongoose = require("mongoose");

const googleusersSchema = new mongoose.Schema(
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
        isVerified: {
            type: Boolean,
            default: false,
        },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
        verificationCode: { type: String },
        verificationCodeExpires: { type: Date },
        isFirstLogin: {
            type: Boolean,
            default: true
        },
        googleId: {
            type: String,
            unique: true
        },
        image: {
            type: String
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "googleuser" // <-- Force collection name to be "googleuser"
    }
);

const GoogleUser = mongoose.model("GoogleUser", googleusersSchema); 

module.exports = GoogleUser;
