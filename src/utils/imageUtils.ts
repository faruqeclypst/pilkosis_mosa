// src/utils/imageUtils.ts

import imageCompression from 'browser-image-compression';

export async function compressAndConvertToWebP(file: File): Promise<File> {
  const targetSizeMB = 1; // Target size in MB
  const minDimension = 800; // Increased minimum dimension
  let maxDimension = 2400; // Start with a larger max dimension
  let compressedFile: Blob | File = file;

  const options = {
    maxSizeMB: targetSizeMB,
    useWebWorker: true,
    fileType: 'webp' as const,
    quality: 0.9, // Slightly reduced quality, still very good
    initialQuality: 0.9
  };

  while (maxDimension >= minDimension) {
    try {
      compressedFile = await imageCompression(file, {
        ...options,
        maxWidthOrHeight: maxDimension
      });

      console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB at max dimension ${maxDimension}`);
      
      if (compressedFile.size <= targetSizeMB * 1024 * 1024) {
        break;
      }

      maxDimension -= 200; // Reduce max dimension in larger steps
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }

  if (compressedFile.size > targetSizeMB * 1024 * 1024) {
    console.warn(`Could not compress image below ${targetSizeMB} MB. Final size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
  }

  return new File([compressedFile], `${file.name.split('.')[0]}.webp`, { type: 'image/webp' });
}