import type {Request,Response,NextFunction} from 'express';
import express from 'express';
import type { HttpError } from 'http-errors';
import { config } from './config/config.js';
import createHttpError from 'http-errors';
import globalErrorHandler from './middlewares/globalErrorHandler.js';

const app = express();

// routes
// http method:-GET, POST, Put, patch delete

app.get('/',(req,res,next)=>{
    const error = createHttpError(400,"Something went wrong");
    throw error;
    res.send("Server is running...");

})

// global error handler

app.use(globalErrorHandler)

export default app;