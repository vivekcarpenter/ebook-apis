import express from 'express';

const app = express();

// routes
// http method:-GET, POST, Put, patch delete

app.get('/',(req,res,next)=>{

    res.send("Server is running...");

})

export default app;