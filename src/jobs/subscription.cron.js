import { UserSubscription } from "../models/user-subscription.model.js"
import cron from "node-cron";

// Scheduled job to deactivate expired subscriptions
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        console.log("Running subscription expiration job...");
        // Find all subscriptions that are active and expired
        const expiredSubscriptions = await UserSubscription.find({
            is_active: true,
            end_date: { $lt: now },
        });

        // Update each expired subscription
        for (const subscription of expiredSubscriptions) {
            subscription.is_active = false;
            await subscription.save();
            console.log(`Deactivated subscription: ${subscription._id}`);
        }
        console.log("Subscription expiration job completed.");
    } catch (error) {
        console.error("Error during subscription expiration job:", error);
    }
});