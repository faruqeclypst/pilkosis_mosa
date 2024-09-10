// src/utils/fileUtils.ts

export const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  export const handleImageSelection = async (
    file: File,
    setImageSrc: (src: string) => void,
    setIsCropping: (isCropping: boolean) => void
  ): Promise<void> => {
    if (file) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        setImageSrc(dataUrl);
        setIsCropping(true);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  };