import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UPLOAD_PATH } from '../config/env';
import { addFaceData, recognizeFace } from '../services/faceDescriptor.service';
import logger from '../utils/logger';

const router = Router();

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = UPLOAD_PATH;
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadMultiple = multer({ storage }).array('images', 5); // Field name: 'images', max 5 files
const uploadSingle = multer({ storage }).single('image'); // Field name: 'image'

// Add face data route
router.post('/add-face', uploadMultiple, async (req, res) => {
  logger.info('ADD FACE API CALLED');

  try {
    const { name } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!name || !files || files.length === 0) {
      logger.warn('Invalid request to add face data.');
      return res.status(400).send({ error: 'Invalid request data.' });
    }

    const result = await addFaceData(name, files);
    res.send({ message: result });
  } catch (error) {
    logger.error('Error in add-face API:', error);
    res.status(500).send({ error: 'Failed to add face data.' });
  }
});

// Recognize face route
router.post('/recognize-face', uploadSingle, async (req, res) => {
  logger.info('RECOGNIZE FACE API CALLED');

  try {
    const file = req.file as Express.Multer.File;

    if (!file) {
      logger.warn('No image provided for face recognition.');
      return res.status(400).send({ error: 'Image file is required.' });
    }

    const result = await recognizeFace(file);
    res.send(result);
  } catch (error) {
    logger.error('Error in recognize-face API:', error);
    res.status(500).send({ error: 'Failed to recognize face.' });
  }
});

export default router;
