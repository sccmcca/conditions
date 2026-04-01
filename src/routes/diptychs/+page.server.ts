import fs from 'fs';
import path from 'path';
import { base } from '$app/paths';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Read thumbnails as before (if needed elsewhere)
  const thumbnailsDir = path.join(process.cwd(), 'static', 'thumbnails');
  let thumbnails: string[] = [];
  try {
    if (fs.existsSync(thumbnailsDir)) {
      const files = fs.readdirSync(thumbnailsDir);
      thumbnails = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        })
        .map(file => `${base}/thumbnails/${file}`);
    }
  } catch (error) {
    console.error('Error reading thumbnails:', error);
  }

  // Read all images from static/img-dip
  const imgDipDir = path.join(process.cwd(), 'static', 'img-dip');
  let imgDipList: string[] = [];
  try {
    if (fs.existsSync(imgDipDir)) {
      const files = fs.readdirSync(imgDipDir);
      imgDipList = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        })
        .sort((a, b) => {
          // Natural sort for numbers in filenames
          return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        })
        .map(file => `/img-dip/${file}`);
    }
  } catch (error) {
    console.error('Error reading img-dip:', error);
  }

  return {
    thumbnails,
    imgDipList
  };
};
