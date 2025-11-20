import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THUMBNAILS_DIR = path.join(__dirname, '..', 'static', 'thumbnails');
const COLOR_DATA_FILE = path.join(__dirname, '..', 'static', 'color-data.json');

// Convert RGB to HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

async function analyzeColors() {
  try {
    if (!fs.existsSync(THUMBNAILS_DIR)) {
      console.error('Thumbnails directory does not exist');
      return;
    }

    const files = fs.readdirSync(THUMBNAILS_DIR);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    });

    console.log(`Analyzing ${imageFiles.length} images...`);

    const colorData = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const filePath = path.join(THUMBNAILS_DIR, file);

      try {
        // Get image stats (dominant color from average)
        const { dominant } = await sharp(filePath)
          .resize(50, 50, { fit: 'cover' })
          .raw()
          .toBuffer({ resolveWithObject: true })
          .then(({ data, info }) => {
            let r = 0, g = 0, b = 0;
            const pixelCount = info.width * info.height;

            for (let i = 0; i < data.length; i += info.channels) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }

            r = Math.round(r / pixelCount);
            g = Math.round(g / pixelCount);
            b = Math.round(b / pixelCount);

            return { dominant: { r, g, b } };
          });

        const [hue, saturation, lightness] = rgbToHsl(dominant.r, dominant.g, dominant.b);

        colorData.push({
          filename: file,
          hue: Math.round(hue),
          saturation: Math.round(saturation),
          lightness: Math.round(lightness),
          rgb: dominant
        });

        if ((i + 1) % 10 === 0) {
          console.log(`Processed ${i + 1}/${imageFiles.length}...`);
        }
      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
      }
    }

    // Save color data
    fs.writeFileSync(COLOR_DATA_FILE, JSON.stringify(colorData, null, 2));
    console.log(`\n✅ Color analysis complete!`);
    console.log(`Data saved to: ${COLOR_DATA_FILE}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeColors();
