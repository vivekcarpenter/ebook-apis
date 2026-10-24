import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(201).json({ message: "Book created successfully" });
    } catch (error) {
        return next(createHttpError(500, "Internal server error"));
    }
};

export { createBook };