import dotenv from 'dotenv';
import connectDB from './src/db/db_connection.js';
import { app } from './src/app.js';
import './src/jobs/subscription.cron.js';

dotenv.config({
    path: './env'
});

connectDB().then(() => {
    console.log('Database connected');

    app.on('error', (error) => {
        console.log('ERRR: ', error);
        throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}).catch((error) => {
    console.log('Error connecting to database:', error);
});


