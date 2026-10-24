
import express from 'express';

import globalErrorHandler from './middlewares/globalErrorHandler.js';
import userRouter from './user/userRouter.js';
import bookRouter from './book/bookRoutes.js';

const app = express();
app.use(express.json());
// routes
// http method:-GET, POST, Put, patch delete

app.get('/',(req,res,next)=>{
    // const error = createHttpError(400,"Something went wrong");
    // throw error;
    res.send("Server is running...");

})

app.use('/api/users',userRouter)
app.use('/api/books',bookRouter);

// global error handler

app.use(globalErrorHandler)

export default app;