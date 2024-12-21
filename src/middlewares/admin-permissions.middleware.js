

export const checkRolePermission = (requiredPermission) => {
    return (req, res, next) => {
        const user = req.user;  // Assuming req.user is set by an auth middleware

        // Check if the user has the required permission
        if (!user || !user.permissions || !user.permissions[requiredPermission]) {
            return res.status(403).json({ message: `Access denied. Missing permission: ${requiredPermission}` });
        }
        req.user = user;
        next();
    };
};