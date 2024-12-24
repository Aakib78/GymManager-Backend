import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createSubscriptionPaymentOrder, verifySubscriptionPayment } from "../controllers/payments.controller.js";

const router = Router()

router.route("/create-subscription-order").post(
    verifyJWT,
    createSubscriptionPaymentOrder
)

router.route("/verify-subscription-payment").post(
    verifyJWT,
    verifySubscriptionPayment
)

export default router

