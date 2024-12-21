import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/api_response.js";
import { Subscription } from "../models/subscription.model.js";


const createSubscription = asyncHandler(async (req, res) => {
    try {
        const { title, description, deffered_price, offer_price} = req.body
       
        if (
            [title, description, deffered_price, offer_price].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }

        const promotionalImagePath = req.files?.promotional_image[0]?.path;

        if (!promotionalImagePath) {
            throw new ApiError(400, "Promotional image is required")
        }
    

        const promotionalImage = await uploadOnCloudinary(promotionalImagePath)

        if (!promotionalImage) {
            throw new ApiError(400, "Unable to upload promotional image.")
        }

        const subscription = await Subscription.create({
            title: title.trim(),
            description: description.trim(),
            deffered_price:deffered_price.trim(),
            offer_price: offer_price.trim(),
            promotional_image: promotionalImage.url
        })
        return res.status(201).json(
            new ApiResponse(200, subscription, "Subscription added Successfully")
        )
    
    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message)
        )
    }
})

const deleteSubscription = asyncHandler(async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        console.log("Working",subscriptionId);
        // Check if subscriptionId is provided
        if (!subscriptionId) {
            throw new ApiError(400, "Subscription ID is required.");
        }


        // Find and delete the subscription
        const subscription = await Subscription.findByIdAndDelete(subscriptionId);
       
        // If subscription is not found
        if (!subscription) {
            throw new ApiError(404, "Subscription not found.");
        }

       
        // Optionally, delete the promotional image from Cloudinary (if you want to clean up)
        // Assuming the subscription has a promotional_image field
        if (subscription.promotional_image) {
            const imagePublicId = subscription.promotional_image.split('/').pop().split('.')[0];
            await deleteFromCloudinary(imagePublicId);
        }

        return res.status(200).json(
            new ApiResponse(200, null, "Subscription deleted successfully")
        );
    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message)
        );
    }
});


export {
    createSubscription,
    deleteSubscription
}