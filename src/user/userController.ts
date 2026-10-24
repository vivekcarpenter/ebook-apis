import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { User } from "./userModel.js";
import bcrypt from "bcrypt";

import { config } from "../config/config.js";
import jwt from "jsonwebtoken";
import type { IUser } from "./userTypes.js";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // validation

  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are requires");
    return next(error);
  }
  // database call
  let newUser: IUser;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      const error = createHttpError(400, "User already exists");
      return next(error);
    }

    // password -> hash
    const hashedPassword = await bcrypt.hash(password, 10);
    newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (error) {
    return next(createHttpError(500, "Internal server error"));
  }
  // token generation jwt

  try {
    const token = jwt.sign(
      {
        sub: newUser._id,
      },
      config.jwtSecret as string,
      {
        expiresIn: "1d",
      },
    );
    res.status(201).json({
      accessToken: token,
    });
  } catch (error) {
    return next(createHttpError(500, "Internal server error"));
  }
};

const loginUser = async (req:Request, res:Response, next:NextFunction) => {
    const {email,password} = req.body;

    if(!email || !password) {
        const error = createHttpError(400,"All fields are required");
        return next(error);
    }

    try {
        const user = await User.findOne({email:email});
        if(!user){
            const error = createHttpError(404,"User not found");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            const error = createHttpError(401,"Invalid credentials");
            return next(error);
        }

        const token = jwt.sign({sub:user._id},config.jwtSecret as string,{expiresIn:"1d"});

        res.status(200).json({
            accessToken:token
        })

        

    } catch (error) {
        return next(createHttpError(500,"Internal server error"));
    }


}

export { createUser , loginUser};
