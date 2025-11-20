import fs from 'fs';
import path from 'path';
import { base } from '$app/paths';

export const load = async () => {
  const colorDataFile = path.join(process.cwd(), 'static', 'color-data.json');
  
  let colorSortedImages: Array<{
    filename: string;
    thumbnail: string;
    hue: number;
    saturation: number;
    lightness: number;
  }> = [];
  
  try {
    if (fs.existsSync(colorDataFile)) {
      const colorData = JSON.parse(fs.readFileSync(colorDataFile, 'utf-8'));
      
      // Sort by hue, then saturation, then lightness for better color grouping
      colorSortedImages = colorData
        .sort((a: any, b: any) => {
          // Primary sort: hue (color spectrum)
          if (Math.abs(a.hue - b.hue) > 5) {
            return a.hue - b.hue;
          }
          // Secondary sort: saturation (more vibrant colors together)
          if (Math.abs(a.saturation - b.saturation) > 10) {
            return b.saturation - a.saturation; // Higher saturation first
          }
          // Tertiary sort: lightness
          return a.lightness - b.lightness;
        })
        .map((item: any) => ({
          filename: item.filename,
          thumbnail: `${base}/thumbnails/${item.filename}`,
          hue: item.hue,
          saturation: item.saturation,
          lightness: item.lightness
        }));
    }
  } catch (error) {
    console.error('Error reading color data:', error);
  }
  
  return {
    images: colorSortedImages
  };
};
