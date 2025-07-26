// src/db/database.js

import mongoose from 'mongoose';
import admin from 'firebase-admin';

// ✅ createRequire is REQUIRED for importing JSON with ES Modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// ✅ Render ke according correct JSON path
const serviceAccount = require('/etc/secrets/serviceAccountKey.json');

const connectDb = async () => {
  try {
    // Firebase Admin Initialize (Only Once)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized');
    }

    // MongoDB Connect
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'projectdare', // Change this if needed
    });

    console.log(`✅ MongoDB connected: ${connectionInstance.connection.host}`);
    return connectionInstance;
  } catch (error) {
    console.error('❌ Initialization error:', error.message);
    process.exit(1);
  }
};

export default connectDb;
