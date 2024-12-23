import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/api_response.js";
import { Subscription } from "../models/subscription.model.js";


const createSubscription = asyncHandler(async (req, res) => {
    const { title, description, deffered_price, offer_price,duration } = req.body
    if (
        [title, description, deffered_price, offer_price, duration].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    if (!req.files || !req.files.promotional_image || req.files.promotional_image.length === 0) {
        throw new ApiError(400, "Promotional image is required")
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
        deffered_price: deffered_price.trim(),
        offer_price: offer_price.trim(),
        promotional_image: promotionalImage.url,
        duration: duration
    })
    return res.status(201).json(
        new ApiResponse(200, subscription, "Subscription added Successfully")
    )
})

const deleteSubscription = asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
   
    if (!subscriptionId) {
        throw new ApiError(400, "Subscription ID is required.")
    }

    const subscription = await Subscription.findByIdAndDelete(subscriptionId);
    
    if (!subscription) {
        throw new ApiError(404, "Subscription not found.");
    }
    if (subscription.promotional_image) {
        const imagePublicId = subscription.promotional_image.split('/').pop().split('.')[0];
        await deleteFromCloudinary(imagePublicId);
    }

    return res.status(200).json(
        new ApiResponse(200, subscription, "Subscription deleted successfully")
    );
});

const fetchAllSubscription = asyncHandler(async (req, res) => { 
        try {
            const subscriptions = await Subscription.find({});

            return res.status(200).json(
                new ApiResponse(200, subscriptions, "Subscription fetched successfully.")
            );
        } catch (error) {
            return res.status(500).json(
                new ApiError(500, error.message)
            );
        }
});

const updateSubscription = asyncHandler(async (req,res) => {
    const { subscriptionId } = req.params;
    if (!subscriptionId) {
        throw new ApiError(400, "Subscription ID is required.")
    }
    const { title, description, deffered_price, offer_price,duration } = req.body;
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
        throw new ApiError(400, "Subscription not found.");
    }
   
    if (title) subscription.title = title.trim();
    if (description) subscription.description = description.trim();
    if (deffered_price) subscription.deffered_price = deffered_price.trim();
    if (offer_price) subscription.offer_price = offer_price.trim();
    if (duration) subscription.duration = duration.trim();

   
    let newPromotionalImage;
    if (!req.files || !req.files.promotional_image || req.files.promotional_image.length === 0) {
        newPromotionalImage= null
    }else {
        const newPromotionalImagePath = req.files?.promotional_image[0]?.path;
        newPromotionalImage = await uploadOnCloudinary(newPromotionalImagePath);
        if (!newPromotionalImage) {
            throw new ApiError(400, "Unable to upload promotional image.")
        }
    }

    if (newPromotionalImage !== null) {
        if (subscription.promotional_image) {
            const oldImagePublicId = subscription.promotional_image.split('/').pop().split('.')[0];
            await deleteFromCloudinary(oldImagePublicId);
        }
        subscription.promotional_image = newPromotionalImage.url;
    }

    // Save updated subscription to the database
    await subscription.save();

    return res.status(200).json(
        new ApiResponse(200, subscription, "Subscription updated successfully")
    );
})

export {
    createSubscription,
    deleteSubscription,
    fetchAllSubscription,
    updateSubscription
}