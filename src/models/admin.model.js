import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const adminSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
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
        phonenumber: {
            type: String,

            unique: true,
            validate: {
                validator: function (v) {
                    return /^[6-9]\d{9}$/.test(v);
                },
                message: "Please enter a valid Indian phone number"
            },
            required: [true, "Phone number is required"]
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        role: {
            type: String,
            enum: ['SuperAdmin', 'Manager', 'Trainer'],
            default: 'Manager',
        },
        permissions: {
            canManageUsers: { type: Boolean, default: false },
            canManageSubscriptions: { type: Boolean, default: false },
            canPostNotices: { type: Boolean, default: false },
            canViewReports: { type: Boolean, default: false },
            canAssignPlans: { type: Boolean, default: false },
        },
        avatar: {
            type: String,
            default:null
        },
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

adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

adminSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

adminSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
            isAdmin: true,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

adminSchema.methods.generateRefreshToken = function () {
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

export const Admin = mongoose.model("Admin", adminSchema)