import FirebaseAdmin from "firebase-admin";
import { readFile } from 'fs/promises';
const serviceAccount = JSON.parse(
    await readFile(new URL('../../serviceaccount.json', import.meta.url), 'utf-8')
);

/* Usage 
 const result = await sendFirebaseNotification({
        token: {USER_FCM_TOKEN},
        title: "Welcome to Our App!",
        body: `Hi ${fullName}, thank you for joining us!`,
        data: {}
    });
*/

if (!FirebaseAdmin.apps.length) {
    FirebaseAdmin.initializeApp({
        credential: FirebaseAdmin.credential.cert(serviceAccount),
    });
}
const sendFBNotification = async (token, title, body, data = {}) => {
    console.log('Sending notification to:', title, body, token);
    const message = {
        notification: {
            title,
            body,
        },
        data: {
            ...data,
        },
        android: {
            notification: {
                imageUrl: 'https://imgs.search.brave.com/XZ5jCc2jU3F5JH1kBlCldIpYWf7arDfg5qb1Z7wLDuc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvNTc4/Mjk5NTYyL3Bob3Rv/L3Byb21vdGlvbmFs/LWJhZ3MuanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPVVScU9E/RDVkSUtGR2prd25C/eDl2Vkp6TTFmVG1o/WDNVNmJLZjNqaEph/dGM9'
            }
        },
        apns: {
            payload: {
                aps: {
                    'mutable-content': 1
                }
            },
            fcm_options: {
                image: 'https://imgs.search.brave.com/XZ5jCc2jU3F5JH1kBlCldIpYWf7arDfg5qb1Z7wLDuc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvNTc4/Mjk5NTYyL3Bob3Rv/L3Byb21vdGlvbmFs/LWJhZ3MuanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPVVScU9E/RDVkSUtGR2prd25C/eDl2Vkp6TTFmVG1o/WDNVNmJLZjNqaEph/dGM9'
            }
        },
        token,
    };

    try {
        const response = await FirebaseAdmin.messaging().send(message);
        console.log('Successfully sent notification:', response);
        return response;
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};


export { sendFBNotification }