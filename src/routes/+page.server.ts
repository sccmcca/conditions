import fs from 'fs';
import path from 'path';
import { base } from '$app/paths';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const thumbnailsDir = path.join(process.cwd(), 'static', 'thumbnails');
  
  let thumbnails: string[] = [];
  
  try {
    // Check if thumbnails directory exists
    if (fs.existsSync(thumbnailsDir)) {
      // Read all files from thumbnails directory
      const files = fs.readdirSync(thumbnailsDir);
      
      // Filter for image files (all of them, not just 100)
      thumbnails = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        })
        .map(file => `${base}/thumbnails/${file}`);
    } else {
      console.warn('Thumbnails directory does not exist yet. Run the compression script first.');
    }
  } catch (error) {
    console.error('Error reading thumbnails:', error);
  }
  
  return {
    thumbnails
  };
};
