import type { IUser } from "../user/userTypes.js";

export interface IBook {
    _id:string;
    title:string;
    author:IUser;
    genre:string;
    coverImage:string;
    file:string;
    createdAt:Date;
    updatedAt:Date;

}