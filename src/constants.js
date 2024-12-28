export const DB_NAME = "GymManager"

export const ROLE_PERMISSIONS = {
    SuperAdmin: {
        canManageUsers: true,
        canManageSubscriptions: true,
        canPostNotices: true,
        canViewReports: true,
        canAssignPlans: true,
    },
    Manager: {
        canManageUsers: true,
        canManageSubscriptions: true,
        canPostNotices: true,
        canViewReports: true,
        canAssignPlans: false,
    },
    Trainer: {
        canManageUsers: false,
        canManageSubscriptions: false,
        canPostNotices: false,
        canViewReports: false,
        canAssignPlans: true,
    },
};

export const populateUserSubscription = {
    path: 'current_subscription', // Populate the current_subscription field
    populate: {
        path: 'subscription',
        select: 'title duration',
    }
}