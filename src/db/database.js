// --- START OF FILE db/database.js (CORRECTED) ---

import mongoose from 'mongoose';
import admin from 'firebase-admin';

// ✅ NEW, COMPATIBLE WAY TO IMPORT JSON
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../serviceAccountKey.json');


const connectDb = async () => {
  try {
    // Initialize Firebase Admin only if it hasn't been initialized already
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin SDK initialized successfully.");
    }

    // Connect to MongoDB
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "projectdare"
    });
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
    return connectionInstance;
  } catch (error) {
    console.error('Error during initialization: ', error.message);
    process.exit(1);
  }
};

export default connectDb;