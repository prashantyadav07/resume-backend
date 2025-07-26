// --- START OF FILE server.js ---

import { config } from 'dotenv';
// YEH LINE SABSE ZAROORI HAI: dotenv ko sabse pehle load karna
config({ path: './.env' });

import { app } from './app.js';
import dbConnect from './db/database.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({  
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
  api_key: process.env.CLOUDINARY_API_KEY,  
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Connect to database
dbConnect()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  });