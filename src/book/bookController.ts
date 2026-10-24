import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import cloudinary from "../config/cloudinary.js";
import path from "node:path";
import mongoose from "mongoose";
import { Book } from "./bookModel.js";
import fs from "node:fs";

interface AuthRequest extends Request {
  userId: string;
}

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, genre, author } = req.body;

    if (!title || !genre || !author) {
      return next(createHttpError(400, "All fields are required"));
    }

    // console.log("files", req.files);
    if (!req.files) {
      return next(createHttpError(400, "File is required"));
    }

    const files = req.files as { [filename: string]: Express.Multer.File[] };
    const coverImage = files?.coverImage?.[0];

    if (!coverImage) {
      return next(createHttpError(400, "Cover image is required"));
    }

    const filename = coverImage.filename;

    const filepath = path.resolve(
      import.meta.dirname,
      "../../public/data/uploads",
      filename,
    );
    const coverImageMimeType = coverImage.mimetype.split("/").at(1) as string;
    const uploadResult = await cloudinary.uploader.upload(filepath, {
      filename_override: filename,
      folder: "book-covers",
      format: coverImageMimeType,
    });
    if (!files.file) {
      return next(createHttpError(400, "File is required"));
    }
    const bookFileName = files.file[0]?.filename;
    if (!bookFileName) {
      return next(createHttpError(400, "Book file is required"));
    }
    const bookFilePath = path.resolve(
      import.meta.dirname,
      "../../public/data/uploads",
      bookFileName,
    );

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdf",
        format: "pdf",
      },
    );

    const _req = req as AuthRequest;
    const newBook = await Book.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    await fs.promises.unlink(filepath);
    await fs.promises.unlink(bookFilePath);
    // console.log("bookfileuploadresult",bookfileUploadResult);
    res.status(201).json({ message: "Book created successfully" });
  } catch (error) {
    return next(createHttpError(500, "Internal server error"));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  try{
      const {title, genre} = req.body;
      const id = req.params.id;

      const book = await Book.findById(id);
      if(!book){
        return next(createHttpError(404,"Book not found"))
      }

      if(book.author.toString() !== req.userId){
        return next(createHttpError(403,"You are not authorized to update"))
      }

      const files = req.files as { [filename:string]: Express.Multer.File[]}
      let completeCoverImage = "";
      if(!files){
        return next(createHttpError(400,"File is required"))
      }

      if(files.coverImage){
        const filename = files.coverImage[0]?.filename;
        const coverMimeType = files.coverImage[0]?.mimetype.split("/").at(-1);
        const filepath = path.resolve(__dirname,"../../public/data/uploads" + filename);
        completeCoverImage = filename as string;
        const uploadResult = await cloudinary.uploader.upload(filepath,{
          filename_override:completeCoverImage,
          folder:"book-covers",
        })
        completeCoverImage = uploadResult.secure_url;
        await fs.promises.unlink(filepath);
      }

      

  }catch(error){
    return next(createHttpError(500,"Internal server error"))
  }
};


export { createBook , updateBook};
