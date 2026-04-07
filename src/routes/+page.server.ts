import fs from 'fs';
import path from 'path';
import { base } from '$app/paths';

export const load = async () => {
  const thumbnailsDir = path.join(process.cwd(), 'static', 'thumbnails');
  const metadataFile = path.join(process.cwd(), 'static', 'metadata.json');
  
  let images: any[] = [];
  let metadata: any = {};
  
  try {
    // Load metadata
    if (fs.existsSync(metadataFile)) {
      const metadataArray = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
      metadataArray.forEach((item: any) => {
        metadata[item.filename] = item;
      });
    }
    
    // Load thumbnails
    if (fs.existsSync(thumbnailsDir)) {
      const files = fs.readdirSync(thumbnailsDir);
      images = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(filename => {
          const filenameWithoutExt = filename.split('.')[0];
          const meta = metadata[filenameWithoutExt] || {};
          return {
            filename,
            thumbnail: `${base}/thumbnails/${filename}`,
            date: meta.date || null,
            author: meta.author || null,
            geolocation: meta.geolocation || null
          };
        })
        .sort((a, b) => {
          // Parse dates and sort newest first
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // Newest first
        });
    }
  } catch (error) {
    console.error('Error reading files:', error);
  }
  
  return { images };
};
