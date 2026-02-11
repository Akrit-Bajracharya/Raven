import { v2 as cloudinary} from "cloudinary";
import { ENV } from "./env.js";

cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    cloud_key_: ENV.CLOUDINARY_API_KEY,
    cloud_secret_: ENV.CLOUDINARY_API_SECRET,
});


export default cloudinary;