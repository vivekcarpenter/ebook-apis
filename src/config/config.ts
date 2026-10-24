import {config as conf} from "dotenv";
conf();

const _config = {
    port: process.env.PORT,
    databaseUrl: process.env.MONGO_URL,
    env:process.env.NODE_ENV,
    jwtSecret:process.env.JWT_SECRET,
    cloudinaryCloud: process.env.CLOUDINARYCLOUDNAME,
    cloudinaryApiKey:process.env.CLOUDINARYCLOUDAPIKEY,
    cloudinarySecret:process.env.CLOUDINARYSECRETKEY,
}

export const config = Object.freeze(_config);