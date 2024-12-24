import { createOrder, verifyPaymentSignature } from "../utils/razorpay.js";
import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js"
import { ApiResponse } from "../utils/api_response.js";
import { Order } from "../models/order.model.js"
import { PaymentHistory } from "../models/payment-history.model.js"

const createSubscriptionPaymentOrder = asyncHandler(async (req, res) => {
    const { amount,currency, subscription_id} = req.body;
    const user = req.user;
    const result = await createOrder({
        amount: amount,
        currency: currency
    });

    if (!result) {
        throw new ApiError(400, "Failed to create order");
    }

    const order = new Order({
        user_id: user._id,
        subscription_id: subscription_id,
        order_id: result.id,
        amount: amount,
        currency: currency,
        receipt: result.receipt,
        status: 'pending',
        payment_id: null
    });

    const savedOrder = await order.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            savedOrder,
            "Order created successfully"
        ))
})


const verifySubscriptionPayment = asyncHandler(async (req, res) => {
    const { payment_id, order_id, signature } = req.body
    
    const expectedSignature = verifyPaymentSignature({
        razorpay_payment_id: payment_id,   
        razorpay_order_id: order_id,
        razorpay_signature: signature
    }); 

    if (expectedSignature===false) {
        throw new ApiError(400, "Invalid payment signature");
    }
   
    const order = await Order.findOne({
        $or: [{ order_id: order_id }]
        })

    if (!order) {
        throw new ApiError(400, "Order not found with this Order ID");
    }
    order.payment_id = payment_id;
    order.status = 'Completed';
    await order.save();

    const paymentHirtory = new PaymentHistory({
        user_id: req.user._id,
        amount: order.amount,
        payment_id:payment_id,
        order_id: order_id,
        payment_signature: signature,
        payment_status: 'paid',
    });
    const savedPayment = await paymentHirtory.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            savedPayment,
            "Payment Successfull. Order is completed"
        ))

})

export { createSubscriptionPaymentOrder, verifySubscriptionPayment }