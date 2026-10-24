import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import jwt from 'jsonwebtoken';
import { config } from "../config/config.js";

export interface AuthRequest extends Request {
    userId:string
}

const authenticate = (req:Request,res:Response,next:NextFunction) => {
    
    const token = req.headers.authorization?.split(" ")[1];
    if(!token){
        return next(createHttpError(401,"Unauthorized request token not found"));

    }

    

   try {
    const decoded =  jwt.verify(token as string, config.jwtSecret as string);
    const _req = req as AuthRequest;
    _req.userId = decoded.sub as string;
    next();
   } catch (error) {
    return next(createHttpError(401,"Authorization token is required."))
   }
    // req.user = decoded ;

}

export default authenticate;