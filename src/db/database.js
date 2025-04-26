import mongoose from 'mongoose';

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "projectdare"  
    });
    console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
    return connectionInstance;
  } catch (error) {
    console.error('Error connecting to the database: ', error.message);
    // Handle the error more gracefully instead of exiting
    return null;
  }
};

export default connectDb