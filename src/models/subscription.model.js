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
    },
    {
        timestamps: true
    }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)