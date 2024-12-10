import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { MONGO_URL, PORT } from './config/env';
import faceDescriptorRoutes from './controllers/faceDescriptor.controller';
import { loadModels } from './services/faceDescriptor.service';
import logger from './utils/logger';

// Initialize Express app
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Load Routes
app.use('/api/faces', faceDescriptorRoutes);

app.use('/api/tmp', express.static(path.join(__dirname, '../tmp')));

app.use((req, res) => {
  res.status(404).send('404: Not Found');
});

// MongoDB Connection
mongoose.connect(MONGO_URL);
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});
mongoose.connection.once('open', () => logger.info('Connected to MongoDB'));
mongoose.set('debug', true);

app.listen(PORT, () => {
  // Preload models
  loadModels()
    .then(() => logger.info('Models loaded successfully'))
    .catch((error) => logger.error('Error loading models:', error));
  logger.info(`Server is running on http://localhost:${PORT}`);
});

export default app;
