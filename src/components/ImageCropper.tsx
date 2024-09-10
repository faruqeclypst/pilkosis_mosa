// src/components/ImageCropper.tsx
import React, { useState, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const onCropChange = (newCrop: Crop) => {
    setCrop(newCrop);
  };

  const onCropCompleteHandler = (pixelCrop: PixelCrop) => {
    setCompletedCrop(pixelCrop);
  };

  const getCroppedImg = useCallback((image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 1);
    });
  }, []);

  const handleCropImage = useCallback(async () => {
    if (completedCrop) {
      const image = new Image();
      image.src = imageSrc;
      image.onload = async () => {
        try {
          const croppedImageBlob = await getCroppedImg(image, completedCrop);
          onCropComplete(croppedImageBlob);
        } catch (e) {
          console.error('Error creating crop', e);
        }
      };
    }
  }, [completedCrop, imageSrc, getCroppedImg, onCropComplete]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <ReactCrop
        crop={crop}
        onChange={onCropChange}
        onComplete={onCropCompleteHandler}
        aspect={1}
      >
        <img src={imageSrc} alt="Crop me" style={{ maxHeight: '300px' }} />
      </ReactCrop>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onCancel}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2"
        >
          Cancel
        </button>
        <button
          onClick={handleCropImage}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Crop
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;