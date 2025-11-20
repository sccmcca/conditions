import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import { base } from '$app/paths';

export const load = async () => {
  const imgRawDir = path.join(process.cwd(), 'img-raw');
  
  let geotaggedImages: Array<{
    filename: string;
    thumbnail: string;
    latitude: number;
    longitude: number;
  }> = [];
  
  try {
    if (fs.existsSync(imgRawDir)) {
      const files = fs.readdirSync(imgRawDir);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      });
      
      // Process each image to extract GPS data
      for (const file of imageFiles) {
        try {
          const filePath = path.join(imgRawDir, file);
          
          // Extract GPS data using exifr
          const gps = await exifr.gps(filePath);
          
          if (gps && gps.latitude && gps.longitude) {
            const thumbnailFilename = file.replace(/\.(png|gif|jpeg)$/i, '.jpg');
            
            geotaggedImages.push({
              filename: file,
              thumbnail: `${base}/thumbnails/${thumbnailFilename}`,
              latitude: gps.latitude,
              longitude: gps.longitude
            });
          }
        } catch (err) {
          // Skip files without GPS data or that cause errors
          console.error(`Error processing ${file}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('Error reading images:', error);
  }
  
  return {
    geotaggedImages
  };
};
