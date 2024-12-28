import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js"
import { ApiResponse } from "../utils/api_response.js";
import { sendNotification } from "../utils/one_signal.js";
import { Attendance } from "../models/attendance.model.js"
import moment from "moment"
import { populateUserSubscription } from "../constants.js";


const punchToday = asyncHandler(async (req, res) => {
    const existingRecord = await Attendance.findOne({
        user_id: req.user._id, // Ensure this references the authenticated user
        date: new Date().setHours(0, 0, 0, 0), // Same day check
    });

    if (existingRecord) {
        if (!existingRecord.punchOut) {
            existingRecord.punchOut = new Date();
            existingRecord.duration = Math.round(
                (existingRecord.punchOut - existingRecord.punchIn) / (1000 * 60)
            );
          
            const hours = Math.floor(existingRecord.duration / 60);
            const minutes = existingRecord.duration % 60;
            existingRecord.duration_formatted = `${hours} Hour${hours !== 1 ? 's' : ''} ${minutes} Min`;

            await existingRecord.save();

            return res
                .status(200)
                .json(new ApiResponse(
                    200,
                    existingRecord,
                    "Punch-out successful."
                ))
        }else {
            return res
                .status(200)
                .json(new ApiResponse(
                    200,
                    existingRecord,
                    "Already punched for today."
                ))
        }
    }else {
        const newAttendance = new Attendance({
            user_id: req.user._id,
            punchIn: new Date(),
            date: new Date().setHours(0, 0, 0, 0), // Store the date as midnight (start of the day)
        });

        await newAttendance.save();
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                newAttendance,
                "Punch-in successful."
            ))
    }
})

const fetchAttendeesByDate =asyncHandler (async (req,res)=>{
    const { date } = req.query;

    if (!date) {
        throw new ApiError(400, "Date is required.");
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate)) {
        throw new ApiError(400, "Invalid date format");
    }

    const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

    const usersPunchedonDate = await Attendance.find({
        punchIn: { $gte: startOfDay, $lt: endOfDay },  // Filter records for today
    }).populate({
        path: 'user_id',
        select: '-password -refreshToken',
        populate: populateUserSubscription
    });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            usersPunchedonDate,
            "Succesfully fetched."
        ))

})

const fetchMonthlyAttendees = asyncHandler(async (req, res) => {
    const { month, year } = req.query;

    if (!month || !year || isNaN(month) || isNaN(year)) {
        throw new ApiError(400, "Invalid month or year");
    }

    if (month < 1 || month > 12) {
        throw new ApiError(400, "Month must be between 1 and 12");
    }

    const currentYear = new Date().getFullYear();
    if (year > currentYear) {
        throw new ApiError(400, 'Year cannot be greater than the current year '+currentYear);

    }

    // Convert month and year into a start and end date for the month
    const startOfMonth = new Date(year, month - 1, 1); // Month is 0-indexed in JS
    const endOfMonth = new Date(year, month, 0); // Last day of the month

    // Query attendance records for the given month
    const attendanceRecords = await Attendance.aggregate([
        {
            $match: {
                punchIn: { $gte: startOfMonth, $lt: endOfMonth },
            },
        },
        {
            $project: {
                day: { $dayOfMonth: '$punchIn' }, // Extract the day of the month from punchIn
            },
        },
        {
            $group: {
                _id: '$day', // Group by day of the month
                count: { $sum: 1 }, // Count the number of punches for each day
            },
        },
        {
            $sort: { _id: 1 }, // Sort by day (ascending)
        },
    ]);

    const result = attendanceRecords.map(record => ({
        date: `${year}-${month.padStart(2, '0')}-${String(record._id).padStart(2, '0')}`,
        punches: record.count,
    }));

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            result,
            "Succesfully fetched."
        ))

})



export {
    punchToday,
    fetchAttendeesByDate,
    fetchMonthlyAttendees
}