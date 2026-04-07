import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Exifr from 'exifr/dist/full.esm.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMG_RAW_DIR = path.join(__dirname, '..', 'img-raw');
const OUTPUT_FILE = path.join(__dirname, '..', 'static', 'metadata.json');

async function extractGeolocation(filepath) {
  try {
    const data = await Exifr.parse(filepath, true);
    if (data?.latitude && data?.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude
      };
    }
  } catch (error) {
    // No EXIF data or error reading it
  }
  return null;
}

function formatDate(dateObj) {
  if (!dateObj) return null;
  try {
    const date = new Date(dateObj);
    if (isNaN(date.getTime())) return null;
    
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    return null;
  }
}

async function extractDateAndAuthor(filepath) {
  try {
    const data = await Exifr.parse(filepath, true);
    
    let date = null;
    if (data?.DateTimeOriginal) {
      date = formatDate(data.DateTimeOriginal);
    } else if (data?.DateTime) {
      date = formatDate(data.DateTime);
    }
    
    const author = data?.Artist || null;
    
    return { date, author };
  } catch (error) {
    return { date: null, author: null };
  }
}

async function generateMetadata() {
  try {
    if (!fs.existsSync(IMG_RAW_DIR)) {
      console.error('img-raw directory does not exist');
      return;
    }

    const files = fs.readdirSync(IMG_RAW_DIR)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && file !== '.DS_Store';
      })
      .sort(); // Ascending order

    console.log(`Found ${files.length} images`);

    const metadata = [];

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const filenameNoExt = path.parse(filename).name; // Remove extension
      const filepath = path.join(IMG_RAW_DIR, filename);
      
      console.log(`Processing ${i + 1}/${files.length}: ${filename}`);
      
      const geolocation = await extractGeolocation(filepath);
      const { date, author } = await extractDateAndAuthor(filepath);

      metadata.push({
        filename: filenameNoExt,
        tags: [],
        material: [],
        condition: [],
        date,
        author: author || 'Scott Christian McCallum',
        geolocation
      });
    }

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2));
    console.log(`\nMetadata generated successfully: ${OUTPUT_FILE}`);
    console.log(`Total images: ${metadata.length}`);
    
    const withLocation = metadata.filter(m => m.geolocation).length;
    console.log(`Images with geolocation: ${withLocation}`);

  } catch (error) {
    console.error('Error generating metadata:', error);
  }
}

generateMetadata();
