import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errors } from 'celebrate';

import { connectMongoDB } from './db/connectMongoDB.js';
import logger from './middleware/logger.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';
import notesRoutes from './routes/notesRoutes.js';

dotenv.config();

const app = express();
const { PORT = 3000 } = process.env;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/notes', notesRoutes);

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