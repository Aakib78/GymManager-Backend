import { ApiError } from '../utils/api_error.js';

// Error-handling middleware
const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        // Handle custom ApiError
        res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors || null,
            data: err.data,
        });
    } else if (err.name === 'ValidationError'){
        const message = Object.values(err.errors).map(err => err.message);
        res.status(400).json({
            success: false,
            message: message[0],
            errors: [],
            data: null,
        });
    } else {
        // Handle other unhandled errors
        res.status(500).json({
            success: false,
            message: "Internal Server Error: " +err.message,
            errors: [],
            data: null,
        });
    }
};

export { errorHandler };
