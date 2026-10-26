import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coverImage: {
    type: String,
    required: true,
  },
  file: {
    type: String,
    required: true,
  },

  // Add these two fields
  coverImagePublicId: {
    type: String,
    required: true,
  },
  filePublicId: {
    type: String,
    required: true,
  },
});

export const Book = mongoose.model("Book", bookSchema);