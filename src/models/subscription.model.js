import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        deffered_price: {
            type: Number,
            required: true
        },
        offer_price: {
            type: Number,
            required: true
        },
        promotional_image: {
            type: String, // cloudinary url
            required: true,
        },
        duration: {
            type: Number,
            required: true, // Represents the duration in months
        },
    },
    {
        timestamps: true
    }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)