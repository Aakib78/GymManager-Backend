import mongoose, { Schema } from "mongoose";

const userSubscriptionSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        subscription: {
            type: Schema.Types.ObjectId, ref: 'Subscription',
            required: true,
        },
        isActive: { type: Boolean, default: true },
        start_date: {
            type: Date,
            required: true
        },
        end_date: {
            type: Date,
            required: true
        },
    },
    {
        timestamps: true
    }
)

export const UserSubscription = mongoose.model("UserSubscription", userSubscriptionSchema)