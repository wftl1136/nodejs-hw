import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { errors } from 'celebrate';

import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import notesRoutes from './routes/notesRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const { PORT = 3000 } = process.env;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(logger);

// Routes (без префиксов)
app.use(notesRoutes);
app.use(userRoutes);
app.use(authRoutes);

// Not found middleware
app.use(notFoundHandler);

// Celebrate validation errors
app.use(errors());

// Global error handler
app.use(errorHandler);

// Start server with MongoDB connection
const startServer = async () => {
  await connectMongoDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();