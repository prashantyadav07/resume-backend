// --- START OF FILE src/app.js ---

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import userRoute from './routes/userRoute.js';
import pdfRoute from './routes/pdfRoute.js';
import geminiRoute from './routes/geminiRoute.js';
import { corsOptions } from './origin/corsOptions.js';

const app = express();

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Route setup
app.use('/api/v1/users', userRoute);  
app.use('/api/v1/pdfs', pdfRoute);
app.use('/api/v1/gemini', geminiRoute);

// Export the app for external use
export { app };