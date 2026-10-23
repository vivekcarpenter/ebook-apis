import mongoose from "mongoose";
import { config } from "./config.js";


const connectDB = async () => {
    try{
        mongoose.connection.on(
            "connected",()=>{
                console.log("Connected to database successfully.")
            }
        )

        mongoose.connection.on(
            'error',(err)=>{
                console.log("Failed to connect to database.", err);
            }
        )
        await mongoose.connect(config.databaseUrl as string);
    }catch(error){
        console.log("Failed to connect to database",error);
        process.exit(1);
    }


}

export default connectDB;