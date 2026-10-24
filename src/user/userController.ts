import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { User } from "./userModel.js";
import bcrypt from "bcrypt"

import type { subscribe } from "node:diagnostics_channel";
import { config } from "../config/config.js";
import jwt from "jsonwebtoken";

const createUser = async (req:Request,res:Response,next:NextFunction) => {
    const {name,email,password} = req.body;


    // validation
    
    if(!name || !email || !password){
        const error = createHttpError(400,"All fields are requires");
        return next(error);
    }
    // database call

    const user = await User.findOne({email:email});
    if(user){
        const error = createHttpError(400,"User already exists");
        return next(error);
    }

    // password -> hash
     const hashedPassword = await bcrypt.hash(password,10)
     const newUser =await User.create({
        name,
        email,
        password:hashedPassword
     })
    // token generation jwt

    const token = jwt.sign({
        sub:newUser._id
    },
    config.jwtSecret as string,
    {
        expiresIn:"1d"
    }
)





    // response

    res.json({
        accessToken:token
    })
}

export {createUser};