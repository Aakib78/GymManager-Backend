
import mongoose, { Schema } from "mongoose";

const paymentHistorySchema = new Schema({
    payment_id: { type: String, required: true, unique: true },
    order_id: { type: String, required: true },
    payment_signature: { type: String, required: true },
    amount: { type: Number, required: true },
    payment_status: { type: String, enum: ['paid', 'failed', 'pending'], required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    payment_method: { type: String }, // Card, UPI, etc.
},
    {
        timestamps: true
    });

export const PaymentHistory = mongoose.model("PaymentHistory", paymentHistorySchema)