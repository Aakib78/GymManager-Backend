import { ApiError } from "../utils/api_error.js";
import { asyncHandler } from "../utils/async_handler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        let user;
        if (decodedToken?.isAdmin) {
            user = await Admin.findById(decodedToken?._id).select("-password -refreshToken");
        }else {
            user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        }

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})