import OneSignal from "onesignal-node";

const client = new OneSignal.Client(process.env.ONESIGNAL_APP_ID, process.env.ONESIGNAL_APP_AUTH_KEY);


/* Usage 
 const result = await sendNotification({
        externalUserIds: ['123456789'],
        title: "Welcome to Our App!",
        message: `Hi ${fullName}, thank you for joining us!`
    });
*/

const sendNotification = async ({ externalUserIds = [], playerIds = [], title, message, data = {}, url, imageUrl }) => {
    try {
        const notification = {
            contents: {
                en: message, // English message body
            },
            headings: {
                en: title, // English title
            },
            data: data, // Custom data payload
            url: url || undefined,
            big_picture: imageUrl || undefined
        };

        // Add specific recipients by externalUserIds or playerIds
        if (externalUserIds.length > 0) {
            notification.include_external_user_ids = externalUserIds; // Target external user IDs
        } else if (playerIds.length > 0) {
            notification.include_player_ids = playerIds; // Target player IDs
        } else {
            notification.included_segments = ['All']; // Send to all users
        }

        // Send the notification
        const response = await client.createNotification(notification);
        return response;
    } catch (error) {
        if (error instanceof OneSignal.HTTPError) {
            // When status code of HTTP response is not 2xx, HTTPError is thrown.
            console.log(error.statusCode);
            console.log(error.body);
        }
       return null
    }
}


export { sendNotification }