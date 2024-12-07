import dotenv from 'dotenv';

dotenv.config();

export const MONGO_URL =
  process.env.MONGO_URL ||
  'mongodb+srv://mongo_user:mongo@123@cluster0.wy8og.mongodb.net/face_recognition';
export const PORT = process.env.PORT || 8080;
export const MATCH_THRESHOLD = 0.55;
export const UPLOAD_PATH = process.env.UPLOAD_PATH || 'src/uploads/';
export const WEIGHTS_PATH = process.env.WEIGHTS_PATH || 'src/weights';
export const WEBSITE_URL = process.env.WEBSITE_URL || 'http://localhost:3000';
