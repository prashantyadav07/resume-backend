import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js';
import pdfRoute from './routes/pdfRoute.js';
import geminiRoute from './routes/geminiRoute.js';


import { config } from 'dotenv';
import { corsOptions } from './origin/corsOptions.js';

// Correct usage of dotenv config
config({ path: './.env' });

const app = express();

// Enable CORS with custom options
app.use(cors(corsOptions));

// Middleware setup
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Route setup
app.use('/api/v1/users', userRoute);  
app.use('/api/v1/admin', userRoute);  
app.use('/api/v1/pdf',pdfRoute);
app.use('/api/v1/gemini', geminiRoute);


// Export the app for external use
export { app };