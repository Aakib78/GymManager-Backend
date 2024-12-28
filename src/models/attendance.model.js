import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId, ref: 'User',
            required: true,
        },
        punchIn: { type: Date, required: true },
        punchOut: { type: Date }, 
        duration: { type: Number },
        duration_formatted: { type: String },
        date: { type: Date, default: () => new Date().setHours(0, 0, 0, 0) },
    },
    {
        timestamps: true
    }
)

export const Attendance = mongoose.model("Attendance", attendanceSchema)