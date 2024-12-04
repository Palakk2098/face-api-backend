import mongoose from 'mongoose';

export interface FaceDescriptorData {
  name: string;
  descriptors: number[][]; // Array of descriptors
  filePaths: string[];
}

const faceDescriptorSchema = new mongoose.Schema<FaceDescriptorData>({
  name: { type: String, required: true },
  descriptors: { type: [[Number]], required: true },
  filePaths: { type: [String], required: true },
});

export const FaceDescriptorModel = mongoose.model<FaceDescriptorData>(
  'Face',
  faceDescriptorSchema
);
