import 'dotenv/config'
// Require the cloudinary library
import { v2 as cloudinary } from 'cloudinary'


if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || typeof process.env.CLOUDINARY_API_SECRET === 'undefined') {
    throw new Error('Missing required Cloudinary environment variables');
}

// Return "https" URLs by setting secure: true
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET,
    secure : true
});

/////////////////////////
// Uploads an image file
/////////////////////////
const uploadImage = async (imagePath) => {

    // Use the uploaded file's name as the asset's public ID and 
    // allow overwriting the asset with new versions
    const options = {
      asset_folder: "cloth_store",
      quality: 'auto'
    };
    

    try {
      // Upload the image
      const result = await cloudinary.uploader.upload(imagePath, options);
      console.log(result);
      return result;
    } catch (error) {
      console.error(error);
    }
};

export default uploadImage
// (async () => {

//     // Set the image to upload
//     const imagePath = '/Users/emmanuel/Documents/cloth-store/api/cloudinary/beautiful_scene.jpg';

//     // Upload the image
//     const imageUrl = await uploadImage(imagePath);

//     console.log("image url", imageUrl)

// })();
