import { Router } from "express";
import {
    registerAdminUser,
    loginAdminUser,
    logoutAdminUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentAdminUser,
    updateAdminUserAvatar
} from "../controllers/admin.controller.js";

import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkRolePermission } from "../middlewares/admin-permissions.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
    ]),
    registerAdminUser
)
router.route("/login").post(loginAdminUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutAdminUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentAdminUser)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAdminUserAvatar)

//Manage Subscriptions
import {
    createSubscription,
    deleteSubscription
} from "../controllers/subscription.controller.js";

router.route("/create-subscription").post(verifyJWT, 
    checkRolePermission('canManageSubscriptions'),
    upload.fields([
        {
            name: "promotional_image",
            maxCount: 1
        }
    ]), createSubscription)

router.route("/delete-subscription/:subscriptionId").delete(verifyJWT, checkRolePermission('canManageSubscriptions'), deleteSubscription)

export default router