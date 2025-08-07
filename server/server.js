import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import aiRouter from './route/aiRoutes.js'; // Fixed: default import with .js extension
import connectCloudinary  from './config/cloudinary.js'; // Fixed: correct import path
import userRouter from './route/userRoutes.js';

const app = express();
await connectCloudinary();
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get('/', (req, res) => {
    res.send('Server is Live!');
});

// Remove this incorrect line:
app.get(requireAuth());

app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


