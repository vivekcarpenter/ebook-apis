
import { Router } from "express";
import {
  createBook,
  listBooks,
  getSingleBook,
  updateBook,
  deleteBook,
} from "./bookController.js";
import  protect from "../middlewares/authenticate.js";

import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import createHttpError from "http-errors";

const uploadDirectory = path.resolve(
  import.meta.dirname,
  "../../public/data/uploads",
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB per file
  },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "coverImage") {
      if (!file.mimetype.startsWith("image/")) {
        return cb(createHttpError(400, "Cover must be an image"));
      }
      return cb(null, true);
    }

    if (file.fieldname === "file") {
      if (file.mimetype !== "application/pdf") {
        return cb(createHttpError(400, "Book must be a PDF"));
      }
      return cb(null, true);
    }

    return cb(createHttpError(400, "Unexpected file field"));
  },
});




const router = Router();

// Public routes
router.get("/", listBooks);
router.get("/:bookId", getSingleBook);

// Protected routes
router.post(
  "/",
  protect,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook,
);

router.patch(
  "/:bookId",
  protect,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateBook,
);

router.delete("/:bookId", protect, deleteBook);

export default router;
