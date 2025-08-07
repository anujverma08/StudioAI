import express from 'express';
import { auth } from "../middlewares/auth.js";
import { generateArticle, generateBlogTitle, generateImage, removeImageBackground,removeImageObject, resumeReview } from '../controllers/aiController.js'; // Added .js extension
import upload from '../config/multer.js';

const aiRouter = express.Router();

aiRouter.post('/generate-article', auth, generateArticle);

aiRouter.post('/generate-image', auth, generateImage);
 // Added generateImage route

aiRouter.post('/generate-blog-title', auth, generateBlogTitle); // Added generateBlogTitle route

aiRouter.post('/remove-image-background',upload.single('image'), auth, removeImageBackground); // Added route for removing image background

aiRouter.post('/remove-image-object', upload.single('image'), auth, removeImageObject); // Added route for removing image object

aiRouter.post('/review-resume', upload.single('resume'), auth, resumeReview); // Added route for reviewing resume


export default aiRouter;
