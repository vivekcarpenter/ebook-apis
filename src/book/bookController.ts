
import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import cloudinary from "../config/cloudinary.js";
import path from "node:path";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import { Book } from "./bookModel.js";

interface AuthRequest extends Request {
  userId: string;
}

type UploadedFiles = {
  coverImage?: Express.Multer.File[];
  file?: Express.Multer.File[];
};

const uploadDirectory = path.resolve(
  import.meta.dirname,
  "../../public/data/uploads",
);

// Delete temporary Multer files safely.
const removeLocalFile = async (filepath?: string) => {
  if (!filepath) return;

  try {
    await fs.unlink(filepath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Failed to remove temporary file:", error);
    }
  }
};

// Upload a book cover to Cloudinary.
const uploadCover = async (filepath: string, filename: string) => {
  return cloudinary.uploader.upload(filepath, {
    public_id: filename,
    folder: "book-covers",
    resource_type: "image",
  });
};

// Upload a PDF as a raw Cloudinary resource.
const uploadPdf = async (filepath: string, filename: string) => {
  return cloudinary.uploader.upload(filepath, {
    public_id: filename,
    folder: "book-pdf",
    resource_type: "raw",
  });
};

// CREATE BOOK
const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const files = req.files as UploadedFiles | undefined;
  let coverPath: string | undefined;
  let pdfPath: string | undefined;

  try {
    const { title, genre } = req.body;
    const authReq = req as AuthRequest;

    if (!title?.trim() || !genre?.trim()) {
      return next(
        createHttpError(400, "Title and genre are required"),
      );
    }

    const cover = files?.coverImage?.[0];
    const pdf = files?.file?.[0];

    if (!cover) {
      return next(createHttpError(400, "Cover image is required"));
    }

    if (!pdf) {
      return next(createHttpError(400, "Book PDF is required"));
    }

    coverPath = path.resolve(uploadDirectory, cover.filename);
    pdfPath = path.resolve(uploadDirectory, pdf.filename);

    const coverResult = await uploadCover(
      coverPath,
      path.parse(cover.filename).name,
    );

    const pdfResult = await uploadPdf(
      pdfPath,
      path.parse(pdf.filename).name,
    );

    const book = await Book.create({
      title: title.trim(),
      genre: genre.trim(),
      author: authReq.userId,
      coverImage: coverResult.secure_url,
      coverImagePublicId: coverResult.public_id,
      file: pdfResult.secure_url,
      filePublicId: pdfResult.public_id,
    });

    return res.status(201).json({
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    return next(error);
  } finally {
    await Promise.all([
      removeLocalFile(coverPath),
      removeLocalFile(pdfPath),
    ]);
  }
};

// GET ALL BOOKS
const listBooks = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const books = await Book.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: "Books fetched successfully",
      count: books.length,
      data: books,
    });
  } catch (error) {
    return next(error);
  }
};

// GET SINGLE BOOK
const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.isValidObjectId(bookId)) {
      return next(createHttpError(400, "Invalid book ID"));
    }

    const book = await Book.findById(bookId)
      .populate("author", "name email");

    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    return res.status(200).json({
      message: "Book fetched successfully",
      data: book,
    });
  } catch (error) {
    return next(error);
  }
};

// UPDATE BOOK
const updateBook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const files = req.files as UploadedFiles | undefined;
  let coverPath: string | undefined;
  let pdfPath: string | undefined;

  try {
    const { title, genre } = req.body;
    const { bookId } = req.params;
    const authReq = req as AuthRequest;

    if (!mongoose.isValidObjectId(bookId)) {
      return next(createHttpError(400, "Invalid book ID"));
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    if (book.author.toString() !== authReq.userId) {
      return next(
        createHttpError(403, "You are not authorized to update this book"),
      );
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return next(createHttpError(400, "Title cannot be empty"));
      }
      book.title = title.trim();
    }

    if (genre !== undefined) {
      if (typeof genre !== "string" || !genre.trim()) {
        return next(createHttpError(400, "Genre cannot be empty"));
      }
      book.genre = genre.trim();
    }

    const cover = files?.coverImage?.[0];
    const pdf = files?.file?.[0];

    // Replace cover image only if a new one was uploaded.
    if (cover) {
      coverPath = path.resolve(uploadDirectory, cover.filename);

      const result = await uploadCover(
        coverPath,
        path.parse(cover.filename).name,
      );

      const oldPublicId = book.coverImagePublicId;

      book.coverImage = result.secure_url;
      book.coverImagePublicId = result.public_id;

      // Remove the old image after the new image uploads.
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId, {
            resource_type: "image",
          });
        } catch (error) {
          console.error("Old cover cleanup failed:", error);
        }
      }
    }

    // Replace PDF only if a new PDF was uploaded.
    if (pdf) {
      pdfPath = path.resolve(uploadDirectory, pdf.filename);

      const result = await uploadPdf(
        pdfPath,
        path.parse(pdf.filename).name,
      );

      const oldPublicId = book.filePublicId;

      book.file = result.secure_url;
      book.filePublicId = result.public_id;

      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId, {
            resource_type: "raw",
          });
        } catch (error) {
          console.error("Old PDF cleanup failed:", error);
        }
      }
    }

    await book.save();

    return res.status(200).json({
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    return next(error);
  } finally {
    await Promise.all([
      removeLocalFile(coverPath),
      removeLocalFile(pdfPath),
    ]);
  }
};

// DELETE BOOK
const deleteBook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookId } = req.params;
    const authReq = req as AuthRequest;

    if (!mongoose.isValidObjectId(bookId)) {
      return next(createHttpError(400, "Invalid book ID"));
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    if (book.author.toString() !== authReq.userId) {
      return next(
        createHttpError(403, "You are not authorized to delete this book"),
      );
    }

    // Delete the MongoDB document first.
    await Book.findByIdAndDelete(bookId);

    // Delete the associated Cloudinary resources.
    const cleanupResults = await Promise.allSettled([
      book.coverImagePublicId
        ? cloudinary.uploader.destroy(book.coverImagePublicId, {
            resource_type: "image",
          })
        : Promise.resolve(null),

      book.filePublicId
        ? cloudinary.uploader.destroy(book.filePublicId, {
            resource_type: "raw",
          })
        : Promise.resolve(null),
    ]);

    cleanupResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Cloudinary cleanup failed:", result.reason);
      }
    });

    return res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export {
  createBook,
  listBooks,
  getSingleBook,
  updateBook,
  deleteBook,
};
