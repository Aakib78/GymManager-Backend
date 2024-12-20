import dotenv from 'dotenv';
import connectDB from './db/db_connection.js';

import express from 'express';

dotenv.config({
    path: './env'
});

connectDB();

const app = express();

