import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { punchToday, fetchAttendeesByDate, fetchMonthlyAttendees } from "../controllers/attendance.controller.js";

const router = Router()

router.route("/punch-today").post(
    verifyJWT,
    punchToday
)

router.route("/fetch-attendees").get(
    verifyJWT,
    fetchAttendeesByDate
)

router.route("/fetch-monthly-attendees").get(
    verifyJWT,
    fetchMonthlyAttendees
)

export default router

