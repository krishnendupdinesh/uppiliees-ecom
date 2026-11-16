import { v2 as cloudinary } from "cloudinary";

// Configure the Cloudinary v2 SDK using server-only environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
export default cloudinary;

