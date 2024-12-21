import { ApiError } from '../utils/api_error.js';

// Error-handling middleware
const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        // Handle custom ApiError
        res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            data: err.data,
        });
    } else {
        // Handle other unhandled errors
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errors: [],
            data: null,
        });
    }
};

export { errorHandler };
