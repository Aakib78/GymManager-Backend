import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User', // Reference to your User model
            required: true,
        },
        subscription_id: {
            type: Schema.Types.ObjectId,
            ref: 'Subscription', // Reference to your Subscription model
            required: true,
        },
        order_id: {
            type: String
        },
        amount: {
            type: Number
        },
        currency: {
            type: String,
            required: true
        },
        receipt: {
            type: String,
            required: true
        },
        status: {
            type: String,
        },
        payment_id: {
            type: String,
        }
    },
    {
        timestamps: true
    }
)

export const Order = mongoose.model("Order", orderSchema)