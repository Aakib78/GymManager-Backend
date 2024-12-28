import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { errorHandler } from './middlewares/error-handler.middleware.js';

const app = express();


app.use(cors({origin: process.env.CORS_ORIGIN,credentials: true}));
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true,limit: '16kb'}));
app.use(express.static('public'));
app.use(cookieParser());


//Routes inport
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import paymentsRouter from './routes/payment.routes.js';
import attendanceRouter from './routes/attendance.routes.js';

//Routes Declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/payments", paymentsRouter)
app.use("/api/v1/attendance", attendanceRouter)

//Error Handler
app.use(errorHandler);

export { app };
