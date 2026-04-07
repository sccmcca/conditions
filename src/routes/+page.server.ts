import fs from 'fs';
import path from 'path';
import { base } from '$app/paths';

export const load = async () => {
  const thumbnailsDir = path.join(process.cwd(), 'static', 'thumbnails');
  
  let images: any[] = [];
  
  try {
    if (fs.existsSync(thumbnailsDir)) {
      const files = fs.readdirSync(thumbnailsDir);
      images = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(filename => ({
          filename,
          thumbnail: `${base}/thumbnails/${filename}`
        }));
    }
  } catch (error) {
    console.error('Error reading thumbnails:', error);
  }
  
  return { images };
};
