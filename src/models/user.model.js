import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            match: [/^[a-z0-9._]+$/, 'Username can only contain lowercase letters, numbers, dots, and underscores'],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            unique: true,
            validate: {
                validator: function (v) {
                    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
                },
                message: "Please enter a valid email"
            },
        },
        fullName: {
            type: String,
            required: [true, "Full Name is required"],
            trim: true,
            index: true
        },
        phonenumber: {
            type: String,
            unique: true,
            validate: {
                validator: function (v) {
                    return /^[6-9]\d{9}$/.test(v);
                },
                message: "Please enter a valid phone number"
            },
            required: [true, "Phone number is required"]
        },
        dateOfBirth: {
            type: Date,
            required: [true, "Date of birth is required"],
            validate: {
                validator: function (value) {
                    const today = new Date();
                    const ageLimit = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                    return value <= ageLimit; // Ensure the date is at least 18 years ago
                },
                message: "You must be at least 18 years old"
            }
        },
        gender: {
            type: String,
            required: [true, "Gender is required"],
            enum: {
                values: ['Male', 'Female', 'Other'],
                message: '{VALUE} is not a valid gender'
            },
        },
        avatar: {
            type: String,
            default: null
        },
        current_subscription: { type: Schema.Types.ObjectId, ref: 'UserSubscription', default: null },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
            isAdmin: false,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)