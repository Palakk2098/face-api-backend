import dotenv from 'dotenv';

dotenv.config();

export const MONGO_URL =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/faceRecognitionDB';
export const PORT = process.env.PORT || 8080;
export const MATCH_THRESHOLD = 0.55;
export const UPLOAD_PATH = process.env.UPLOAD_PATH || '/tmp/';
export const WEIGHTS_PATH = process.env.WEIGHTS_PATH || '../weights';
export const WEBSITE_URL = process.env.WEBSITE_URL || 'http://localhost:3000';
