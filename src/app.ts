import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { PORT, MONGO_URL, WEBSITE_URL } from './config/env';
import faceDescriptorRoutes from './controllers/faceDescriptor.controller';
import { loadModels } from './services/faceDescriptor.service';
import logger from './utils/logger';

// Initialize Express app
const app = express();
app.use(express.json());

const allowedOrigins = [WEBSITE_URL]; // Add React frontend URL

app.use('/api/src/uploads', express.static(path.join(__dirname, '/uploads')));
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Allow credentials if needed
  })
);

// Load Routes
app.use('/api/faces', faceDescriptorRoutes);

// MongoDB Connection
mongoose.connect(MONGO_URL);
mongoose.connection.once('open', () => logger.info('Connected to MongoDB'));

(async () => {
  try {
    await loadModels();
    app.listen(PORT, () =>
      logger.info(`Server running at http://localhost:${PORT}`)
    );
  } catch (error) {
    logger.error('Error starting server:', error);
  }
})();
// Export app
export default app;
