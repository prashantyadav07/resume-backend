// --- START OF FILE db/database.js ---

import mongoose from 'mongoose';
import admin from 'firebase-admin';

// Correct path to your service account key file
import serviceAccount from '../serviceAccountKey.json' assert { type: "json" };

const connectDb = async () => {
  try {
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");

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