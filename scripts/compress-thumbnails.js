import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMG_RAW_DIR = path.join(__dirname, '..', 'img-raw');
const THUMBNAILS_DIR = path.join(__dirname, '..', 'static', 'thumbnails');
const THUMBNAIL_WIDTH = 500;
const MAX_IMAGES = Infinity; // Process all images

// Create thumbnails directory if it doesn't exist
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

async function compressImages() {
  try {
    // Read all files from img-raw directory
    const files = fs.readdirSync(IMG_RAW_DIR);
    
    // Filter for image files (jpg, jpeg, png)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });
    
    // Take only the first 100 images
    const imagesToProcess = imageFiles.slice(0, MAX_IMAGES);
    
    console.log(`Found ${imageFiles.length} images. Processing ${imagesToProcess.length} images...`);
    
    // Process each image
    for (let i = 0; i < imagesToProcess.length; i++) {
      const file = imagesToProcess[i];
      const inputPath = path.join(IMG_RAW_DIR, file);
      const outputPath = path.join(THUMBNAILS_DIR, file);
      
      try {
        await sharp(inputPath)
          .rotate() // Automatically rotate based on EXIF orientation
          .resize(THUMBNAIL_WIDTH, null, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85, progressive: true })
          .toFile(outputPath.replace(/\.(png|gif|jpeg)$/i, '.jpg'));
        
        console.log(`✓ Compressed ${i + 1}/${imagesToProcess.length}: ${file}`);
      } catch (err) {
        console.error(`✗ Error processing ${file}:`, err.message);
      }
    }
    
    console.log('\n✅ Image compression complete!');
    console.log(`Thumbnails saved to: ${THUMBNAILS_DIR}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

compressImages();
