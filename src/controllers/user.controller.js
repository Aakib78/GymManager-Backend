import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { UserSubscription } from "../models/user-subscription.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/api_response.js";
import moment from "moment";
import jwt from "jsonwebtoken"
// import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, phonenumber,dateOfBirth,gender} = req.body
    const fields = [fullName, username, email, phonenumber, password,dateOfBirth,gender];
    const fieldNames = ["FullName", "Username", "Email", "Phonenumber", "Password","Date of Birth","Gender"];
    fields.forEach((field, index) => {
        if (!field || field.trim() === "") {
            throw new ApiError(400, `${fieldNames[index]} is required.`);
        }
    });

    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }, {phonenumber}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with this User ID already exists")
    }

    let avatar;
    if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
        avatar = null
        console.log("avatar1");
    } else {
        console.log("avatar2");
        const avatarPath = req.files?.avatar[0]?.path;
        avatar = await uploadOnCloudinary(avatarPath);
        if (!avatar) {
            throw new ApiError(400, "Unable to upload profile image.")
        }
    }

    const user = await User.create({
        fullName:fullName,
        avatar: avatar?.url,
        email:email,
        password:password,
        phonenumber:phonenumber,
        dateOfBirth:dateOfBirth,
        gender:gender,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Unable to register user. Something went wrong!!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username,phonenumber, password } = req.body

    const identifier = email || username || phonenumber;

    if (!identifier) {
        throw new ApiError(400, "At least one of email, username, or phonenumber is required");
    }

    const user = await User.findOne({
        $or: [{ email: identifier },
            { username: identifier },
            { phonenumber: identifier },]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user password.")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).populate({
        path: 'current_subscription',
        populate: {
            path: 'subscription',
            model: 'Subscription',
        },
    }).select("-password -refreshToken")

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
                    profile: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
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
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

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

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
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
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
})

const addUserSubscription = asyncHandler(async (req, res) => {
    const { subscription_id } = req.body
        
    const subscription = await Subscription.findById(subscription_id);

    if (!subscription) {
        throw new ApiError(404, "Subscription not found.");
    }

    const activeSubscription = await UserSubscription.findOne({
        user_id: req.user._id,
        end_date: { $gt: moment().toDate() }, // Check if the end_date is in the future
    });
    console.log(activeSubscription);

    if (activeSubscription) {
        throw new ApiError(400, "User already has an active subscription.");
    }

    const startDate = moment().toDate();
    const endDate = moment(startDate).add(subscription.duration, 'months').toDate();

    const userSubscription = new UserSubscription({
        user_id: req.user._id,
        subscription: subscription,
        start_date: startDate,
        end_date: endDate,
    });

    await userSubscription.save();

    const user = await User.findById(req.user._id);
    user.current_subscription = userSubscription;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            userSubscription,
            "Subscription added successfully"
        ))
})

// const updateAccountDetails = asyncHandler(async (req, res) => {
//     const { fullName, email } = req.body

//     if (!fullName || !email) {
//         throw new ApiError(400, "All fields are required")
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             $set: {
//                 fullName,
//                 email: email
//             }
//         },
//         { new: true }

//     ).select("-password")

//     return res
//         .status(200)
//         .json(new ApiResponse(200, user, "Account details updated successfully"))
// });



// const getUserChannelProfile = asyncHandler(async (req, res) => {
//     const { username } = req.params

//     if (!username?.trim()) {
//         throw new ApiError(400, "username is missing")
//     }

//     const channel = await User.aggregate([
//         {
//             $match: {
//                 username: username?.toLowerCase()
//             }
//         },
//         {
//             $lookup: {
//                 from: "subscriptions",
//                 localField: "_id",
//                 foreignField: "channel",
//                 as: "subscribers"
//             }
//         },
//         {
//             $lookup: {
//                 from: "subscriptions",
//                 localField: "_id",
//                 foreignField: "subscriber",
//                 as: "subscribedTo"
//             }
//         },
//         {
//             $addFields: {
//                 subscribersCount: {
//                     $size: "$subscribers"
//                 },
//                 channelsSubscribedToCount: {
//                     $size: "$subscribedTo"
//                 },
//                 isSubscribed: {
//                     $cond: {
//                         if: { $in: [req.user?._id, "$subscribers.subscriber"] },
//                         then: true,
//                         else: false
//                     }
//                 }
//             }
//         },
//         {
//             $project: {
//                 fullName: 1,
//                 username: 1,
//                 subscribersCount: 1,
//                 channelsSubscribedToCount: 1,
//                 isSubscribed: 1,
//                 avatar: 1,
//                 coverImage: 1,
//                 email: 1

//             }
//         }
//     ])

//     if (!channel?.length) {
//         throw new ApiError(404, "channel does not exists")
//     }

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(200, channel[0], "User channel fetched successfully")
//         )
// })


// const getWatchHistory = asyncHandler(async (req, res) => {
//     const user = await User.aggregate([
//         {
//             $match: {
//                 _id: new mongoose.Types.ObjectId(req.user._id)
//             }
//         },
//         {
//             $lookup: {
//                 from: "videos",
//                 localField: "watchHistory",
//                 foreignField: "_id",
//                 as: "watchHistory",
//                 pipeline: [
//                     {
//                         $lookup: {
//                             from: "users",
//                             localField: "owner",
//                             foreignField: "_id",
//                             as: "owner",
//                             pipeline: [
//                                 {
//                                     $project: {
//                                         fullName: 1,
//                                         username: 1,
//                                         avatar: 1
//                                     }
//                                 }
//                             ]
//                         }
//                     },
//                     {
//                         $addFields: {
//                             owner: {
//                                 $first: "$owner"
//                             }
//                         }
//                     }
//                 ]
//             }
//         }
//     ])

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 user[0].watchHistory,
//                 "Watch history fetched successfully"
//             )
//         )
// })


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    addUserSubscription
}