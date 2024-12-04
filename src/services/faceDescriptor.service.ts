import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import fs from 'fs';

import { FaceDescriptorModel } from '../models/faceDescriptor.model';
import { MATCH_THRESHOLD, WEIGHTS_PATH } from '../config/env';
import logger from '../utils/logger';

// Monkey-patch face-api.js for Node.js compatibility
faceapi.env.monkeyPatch({
  Canvas: Canvas as any,
  Image: Image as any,
  ImageData: ImageData as any,
});

export const loadModels = async () => {
  const modelsPath = WEIGHTS_PATH;
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
  logger.info('FaceAPI models loaded.');
};

export const extractDescriptors = async (
  imagePath: string
): Promise<Float32Array[]> => {
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
    const descriptors = await extractDescriptors(file.path);

    if (descriptors.length) {
      allDescriptors.push(...descriptors);
      storedFilePaths.push(file.path); // Save the file path for the database
    } else {
      // Delete files without faces
      fs.unlinkSync(file.path);
      throw new Error('No faces detected in the image.');
    }
  }

  const serializedDescriptors = allDescriptors.map((descriptor) =>
    Array.from(descriptor)
  );

  // Save descriptors and file paths in the database
  await FaceDescriptorModel.updateOne(
    { name },
    {
      $push: {
        descriptors: { $each: serializedDescriptors },
        filePaths: { $each: storedFilePaths }, // Store file paths
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
