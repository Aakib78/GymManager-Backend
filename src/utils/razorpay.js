import Razorpay from "razorpay";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const createOrder = async ({ amount, currency, receipt }) => {
    try {
        const options = {
            amount: amount,
            currency: currency || "INR",
            receipt: receipt || `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const verifyPaymentSignature = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    const secret = razorpay.key_secret;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    try {
        const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
        return isValidSignature;
    } catch (error) {
        return false;
    }
}


export { createOrder, verifyPaymentSignature }