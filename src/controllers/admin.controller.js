import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js"
import { Admin } from "../models/admin.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/api_response.js";
import jwt from "jsonwebtoken"
import { ROLE_PERMISSIONS } from "../constants.js";

// import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async (adminId) => {
    try {
        const admin = await Admin.findById(adminId)
        const accessToken = admin.generateAccessToken()
        const refreshToken = admin.generateRefreshToken()

        admin.refreshToken = refreshToken
        await admin.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerAdminUser = asyncHandler(async (req, res) => {

    try {
        
        const { fullName, email, username, password, phonenumber, role } = req.body
        if (
            [fullName, username,email, phonenumber,password,role].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }

        const existedAdminUser = await Admin.findOne({
            $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }, { phonenumber }]
        })

        if (existedAdminUser) {
            throw new ApiError(409, "User with this username, email, or phone number already exists")
        }

        let avatarLocalPath;
        if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
            avatarLocalPath = req.files.avatar[0].path
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)

        const selectedRole = role || "Manager";
        const permissions = ROLE_PERMISSIONS[selectedRole];

        if (!permissions) {
            throw new ApiError(400, "Invalid role provided");
        }

        const admin = await Admin.create({
            fullName: fullName,
            email: email.trim().toLowerCase(),
            username: username.trim().toLowerCase(),
            password: password.trim(),
            phonenumber: phonenumber.trim(),
            avatar: avatar?.url || "",
            role: selectedRole,
            permissions: permissions
        })

        const createdUser = await Admin.findById(admin._id).select(
            "-password -refreshToken"
        )

        if (!createdUser) {
            throw new ApiError(500, "Unable to register user. Something went wrong!!")
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        )
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            throw new ApiError(500, messages.at(0));
        }
         return res.status(500).json(
             new ApiError(500, error.message)
        )
    }
})

const loginAdminUser = asyncHandler(async (req, res) => {
    const { user_id, password } = req.body

    if (!user_id) {
        throw new ApiError(400, "At least one of email, username, or phonenumber is required");
    }

    const adminUser = await Admin.findOne({
        $or: [{ email: user_id },
            { username: user_id },
            { phonenumber: user_id },]
    })

    if (!adminUser) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await adminUser.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user password.")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(adminUser._id)

    const loggedInAdminUser = await Admin.findById(adminUser._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInAdminUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutAdminUser = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const adminUser = await Admin.findById(decodedToken?._id)

        if (!adminUser) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== adminUser?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(adminUser._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const adminUser = await Admin.findById(req.admin?._id)
    const isPasswordCorrect = await adminUser.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    adminUser.password = newPassword
    await adminUser.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentAdminUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.admin,
            "User fetched successfully"
        ))
})

const updateAdminUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    const adminUser = await Admin.findByIdAndUpdate(
        req.admin?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, adminUser, "Avatar image updated successfully")
        )
})


export {
    registerAdminUser,
    loginAdminUser,
    logoutAdminUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentAdminUser,
    updateAdminUserAvatar
}