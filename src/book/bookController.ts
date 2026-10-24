import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import cloudinary from "../config/cloudinary.js";
import path from "node:path";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("files", req.files);
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

    const bookfileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdf",
        format: "pdf",
      },
    );
    // console.log("bookfileuploadresult",bookfileUploadResult);
    res.status(201).json({ message: "Book created successfully" });
  } catch (error) {
    return next(createHttpError(500, "Internal server error"));
  }
};

export { createBook };
