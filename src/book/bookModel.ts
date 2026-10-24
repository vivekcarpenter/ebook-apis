import mongoose from "mongoose";
import type { IBook } from "./bookTypes.js";

const bookSchema = new mongoose.Schema<IBook>({
    title:{
        type:String,
        required:true
    },
    author : {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    file:{
        type:String,
        required:true
    },
    genre:{
        type:String,
        required:true
    },
    coverImage: {
        type:String,
        required:true
    }


},{
    timestamps:true
})

export const Book = mongoose.model<IBook>("Book",bookSchema)