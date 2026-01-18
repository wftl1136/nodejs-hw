import mongoose from 'mongoose';

export const connectMongoDB = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connection established successfully');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};