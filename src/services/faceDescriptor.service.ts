import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { FaceDescriptorModel } from '../models/faceDescriptor.model';
import { MATCH_THRESHOLD, MONGO_URL, WEIGHTS_PATH } from '../config/env';
import logger from '../utils/logger';

// Monkey-patch face-api.js for Node.js compatibility
faceapi.env.monkeyPatch({
  Canvas: Canvas as any,
  Image: Image as any,
  ImageData: ImageData as any,
});

export const loadModels = async () => {
  const modelsPath = path.join(__dirname, '../../' + WEIGHTS_PATH);
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);

  logger.info('FaceAPI models loaded.');
};

export const extractSingleDescriptors = async (
  imagePath: string
): Promise<Float32Array | null> => {
  const result = await loadModels();

  const image = await loadImage(imagePath);

  // Detect all faces in the image
  const detections = await faceapi
    .detectAllFaces(image as any, new faceapi.SsdMobilenetv1Options())
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) {
    throw new Error('No face detected in the image.');
  }

  if (detections.length > 1) {
    throw new Error('More than one face detected in the image.');
  }

  // Return the descriptor for the single face
  return detections[0].descriptor;
};

export const extractDescriptors = async (
  imagePath: string
): Promise<Float32Array[]> => {
  await loadModels();

  const image = await loadImage(imagePath);
  const detections = await faceapi
    .detectAllFaces(image as any, new faceapi.SsdMobilenetv1Options())
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections.map((detection) => detection.descriptor);
};

export const addFaceData = async (
  name: string,
  files: Express.Multer.File[]
) => {
  const allDescriptors: Float32Array[] = [];
  const storedFilePaths: string[] = [];

  for (const file of files) {
    const descriptor = await extractSingleDescriptors(file.path);

    if (!descriptor) {
      // Delete files without valid faces
      fs.unlinkSync(file.path);
      throw new Error(
        'No face detected or more than one face detected in an image.'
      );
    }

    // Add the descriptor and file path to the lists
    allDescriptors.push(descriptor);
    storedFilePaths.push(file.path);
  }

  // Serialize the descriptors for database storage
  const serializedDescriptors = allDescriptors.map((descriptor) =>
    Array.from(descriptor)
  );

  // Save descriptors and file paths in the database
  await FaceDescriptorModel.updateOne(
    { name },
    {
      $push: {
        descriptors: { $each: serializedDescriptors }, // Append new descriptors
        filePaths: { $each: storedFilePaths }, // Append new file paths
      },
    },
    { upsert: true }
  );

  return `Face data for ${name} added successfully.`;
};

export const recognizeFace = async (file: Express.Multer.File) => {
  const descriptors = await extractDescriptors(file.path);

  // Clean up the temporary uploaded file
  fs.unlinkSync(file.path);

  if (descriptors.length === 0)
    throw new Error('No faces detected in the image.');

  const faces = await FaceDescriptorModel.find();
  if (!faces.length) throw new Error('No faces stored in the database.');

  const matches = [];

  descriptors.forEach((inputDescriptor) => {
    let bestMatch = null;
    let smallestDistance = MATCH_THRESHOLD;

    faces.forEach((entry) => {
      entry.descriptors.forEach((dbDescriptor) => {
        const distance = faceapi.euclideanDistance(
          Float32Array.from(inputDescriptor),
          Float32Array.from(dbDescriptor)
        );

        if (distance < smallestDistance) {
          smallestDistance = distance;

          bestMatch = {
            name: entry.name,
            distance,
            filePaths: entry.filePaths, // Include stored file paths for matched face
          };
        }
      });
    });

    if (bestMatch) matches.push(bestMatch);
  });

  return matches.length ? { matches } : { error: 'No matching faces found.' };
};
