import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';

if (!config.cloudinaryCloud || !config.cloudinaryApiKey || !config.cloudinarySecret) {
    throw new Error('Cloudinary configuration is incomplete');
}

cloudinary.config({
    cloud_name: config.cloudinaryCloud,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinarySecret,
    secure: true // Good practice: forces HTTPS links
});

export default cloudinary;
