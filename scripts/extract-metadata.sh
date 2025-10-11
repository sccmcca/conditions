#!/bin/bash

# Photo Metadata Extractor and MapLibre Map Generator
# Extracts GPS coordinates and dates from photos and creates an interactive map

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="./img-raw"
OUTPUT_DIR="./static"
METADATA_FILE="$OUTPUT_DIR/photo-metadata.json"
MAP_FILE="$OUTPUT_DIR/photo-map.html"
THUMB_DIR="./img-optimized/thumbnails"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if exiftool is installed
if ! command -v exiftool &> /dev/null; then
    print_error "exiftool is not installed. Please install it with: brew install exiftool"
    exit 1
fi

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    print_error "Source directory '$SOURCE_DIR' does not exist."
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"
print_status "Created output directory: $OUTPUT_DIR"

print_status "Extracting metadata from images in $SOURCE_DIR..."

# Extract metadata using exiftool
exiftool -json \
    -filename \
    -DateTimeOriginal \
    -CreateDate \
    -ModifyDate \
    -GPSLatitude \
    -GPSLongitude \
    -GPSLatitudeRef \
    -GPSLongitudeRef \
    -ImageWidth \
    -ImageHeight \
    -r "$SOURCE_DIR" > "$METADATA_FILE.tmp"

if [ $? -ne 0 ]; then
    print_error "Failed to extract metadata"
    exit 1
fi

print_success "Raw metadata extracted to temporary file"

# Process the JSON to clean up and add calculated fields
python3 -c "
import json
import sys
from datetime import datetime
import os

def convert_gps_to_decimal(coord, ref):
    '''Convert GPS coordinates from degrees/minutes/seconds to decimal'''
    if not coord or not ref:
        return None
    
    # Handle both string and numeric formats
    if isinstance(coord, str):
        # Parse degrees, minutes, seconds format like '37 deg 23\' 15.123\" N'
        import re
        parts = re.findall(r'([\d.]+)', coord)
        if len(parts) >= 1:
            decimal = float(parts[0])
            if len(parts) >= 2:
                decimal += float(parts[1]) / 60
            if len(parts) >= 3:
                decimal += float(parts[2]) / 3600
        else:
            return None
    else:
        decimal = float(coord)
    
    # Apply direction (negative for South/West)
    if ref in ['S', 'W']:
        decimal = -decimal
    
    return decimal

def get_best_date(item):
    '''Get the best available date from the metadata'''
    for date_field in ['DateTimeOriginal', 'CreateDate', 'ModifyDate']:
        if date_field in item and item[date_field]:
            try:
                # Parse various date formats
                date_str = item[date_field]
                # Common format: '2021:04:08 08:20:59'
                if ':' in date_str and len(date_str) >= 19:
                    return datetime.strptime(date_str[:19], '%Y:%m:%d %H:%M:%S').isoformat()
                # Try other formats
                elif '-' in date_str:
                    return datetime.strptime(date_str[:19], '%Y-%m-%d %H:%M:%S').isoformat()
            except:
                continue
    return None

# Load and process the metadata
try:
    with open('$METADATA_FILE.tmp', 'r') as f:
        raw_data = json.load(f)
except Exception as e:
    print(f'Error reading metadata file: {e}', file=sys.stderr)
    sys.exit(1)

processed_data = []
photos_with_gps = 0
photos_with_dates = 0

for item in raw_data:
    filename = item.get('FileName', 'unknown')
    
    # Convert GPS coordinates
    lat = convert_gps_to_decimal(
        item.get('GPSLatitude'), 
        item.get('GPSLatitudeRef')
    )
    lng = convert_gps_to_decimal(
        item.get('GPSLongitude'), 
        item.get('GPSLongitudeRef')
    )
    
    # Get best available date
    date_taken = get_best_date(item)
    
    # Create processed entry
    photo_data = {
        'filename': filename,
        'path': f'images/thumbnails/{filename}',
        'mediumPath': f'images/medium/{filename}',
        'largePath': f'images/large/{filename}',
        'dateTaken': date_taken,
        'coordinates': {
            'lat': lat,
            'lng': lng
        } if lat is not None and lng is not None else None,
        'dimensions': {
            'width': item.get('ImageWidth'),
            'height': item.get('ImageHeight')
        }
    }
    
    processed_data.append(photo_data)
    
    if photo_data['coordinates']:
        photos_with_gps += 1
    if photo_data['dateTaken']:
        photos_with_dates += 1

# Save processed data
with open('$METADATA_FILE', 'w') as f:
    json.dump(processed_data, f, indent=2)

print(f'Processed {len(processed_data)} photos')
print(f'Photos with GPS coordinates: {photos_with_gps}')
print(f'Photos with dates: {photos_with_dates}')
"

# Remove temporary file
rm "$METADATA_FILE.tmp"

print_success "Processed metadata saved to $METADATA_FILE"

# Read the stats from the Python output
STATS=$(python3 -c "
import json
with open('$METADATA_FILE', 'r') as f:
    data = json.load(f)
    
total = len(data)
with_gps = sum(1 for item in data if item['coordinates'])
with_dates = sum(1 for item in data if item['dateTaken'])

print(f'{total},{with_gps},{with_dates}')
")

IFS=',' read -r total_photos gps_photos date_photos <<< "$STATS"

print_status "Statistics:"
echo "  Total photos: $total_photos"
echo "  Photos with GPS: $gps_photos"
echo "  Photos with dates: $date_photos"

if [ "$gps_photos" -eq 0 ]; then
    print_warning "No photos have GPS coordinates. Map will be empty."
fi

# Generate MapLibre HTML map
print_status "Generating interactive map..."

cat > "$MAP_FILE" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Photo Locations Map</title>
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
    <script src="https://unpkg.com/maplibre-gl@4.5.2/dist/maplibre-gl.js"></script>
    <link href="https://unpkg.com/maplibre-gl@4.5.2/dist/maplibre-gl.css" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        
        .photo-popup {
            max-width: 300px;
            text-align: center;
        }
        
        .photo-popup img {
            width: 100%;
            max-width: 250px;
            height: auto;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .photo-info {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
        }
        
        .photo-links {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .photo-link {
            padding: 4px 8px;
            background: #007cbf;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 11px;
        }
        
        .photo-link:hover {
            background: #005a8b;
        }
        
        .stats {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        }
        
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div id="loading" class="loading">Loading photos...</div>
    <div id="map"></div>
    <div class="stats" id="stats">Loading...</div>

    <script>
        // Initialize map
        const map = new maplibregl.Map({
            container: 'map',
            style: 'https://demotiles.maplibre.org/style.json', // Free demo tiles
            center: [0, 0], // Will be updated based on photo locations
            zoom: 2
        });

        // Load photo metadata
        fetch('./photo-metadata.json')
            .then(response => response.json())
            .then(photos => {
                document.getElementById('loading').style.display = 'none';
                
                // Filter photos with coordinates
                const photosWithGPS = photos.filter(photo => photo.coordinates);
                
                // Update stats
                const statsDiv = document.getElementById('stats');
                statsDiv.innerHTML = `
                    <strong>Photo Statistics</strong><br>
                    Total Photos: ${photos.length}<br>
                    Photos with GPS: ${photosWithGPS.length}<br>
                    Photos with Dates: ${photos.filter(p => p.dateTaken).length}
                `;
                
                if (photosWithGPS.length === 0) {
                    statsDiv.innerHTML += '<br><em>No GPS data found in photos</em>';
                    return;
                }
                
                // Create GeoJSON for markers
                const geojsonData = {
                    type: 'FeatureCollection',
                    features: photosWithGPS.map(photo => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [photo.coordinates.lng, photo.coordinates.lat]
                        },
                        properties: {
                            filename: photo.filename,
                            dateTaken: photo.dateTaken,
                            thumbnailPath: photo.path,
                            mediumPath: photo.mediumPath,
                            largePath: photo.largePath
                        }
                    }))
                };
                
                // Calculate bounds to fit all photos
                const bounds = new maplibregl.LngLatBounds();
                photosWithGPS.forEach(photo => {
                    bounds.extend([photo.coordinates.lng, photo.coordinates.lat]);
                });
                
                // Add source and layer for photo markers
                map.on('load', () => {
                    map.addSource('photos', {
                        type: 'geojson',
                        data: geojsonData,
                        cluster: true,
                        clusterMaxZoom: 14,
                        clusterRadius: 50
                    });
                    
                    // Cluster circles
                    map.addLayer({
                        id: 'clusters',
                        type: 'circle',
                        source: 'photos',
                        filter: ['has', 'point_count'],
                        paint: {
                            'circle-color': [
                                'step',
                                ['get', 'point_count'],
                                '#51bbd6',
                                10,
                                '#f1f075',
                                30,
                                '#f28cb1'
                            ],
                            'circle-radius': [
                                'step',
                                ['get', 'point_count'],
                                20,
                                10,
                                30,
                                30,
                                40
                            ]
                        }
                    });
                    
                    // Cluster count labels
                    map.addLayer({
                        id: 'cluster-count',
                        type: 'symbol',
                        source: 'photos',
                        filter: ['has', 'point_count'],
                        layout: {
                            'text-field': '{point_count_abbreviated}',
                            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                            'text-size': 12
                        }
                    });
                    
                    // Individual photo markers
                    map.addLayer({
                        id: 'unclustered-point',
                        type: 'circle',
                        source: 'photos',
                        filter: ['!', ['has', 'point_count']],
                        paint: {
                            'circle-color': '#11b4da',
                            'circle-radius': 8,
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#fff'
                        }
                    });
                    
                    // Fit map to show all photos
                    if (photosWithGPS.length > 0) {
                        map.fitBounds(bounds, { padding: 50 });
                    }
                });
                
                // Click events for clusters
                map.on('click', 'clusters', (e) => {
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: ['clusters']
                    });
                    const clusterId = features[0].properties.cluster_id;
                    map.getSource('photos').getClusterExpansionZoom(
                        clusterId,
                        (err, zoom) => {
                            if (err) return;
                            map.easeTo({
                                center: features[0].geometry.coordinates,
                                zoom: zoom
                            });
                        }
                    );
                });
                
                // Click events for individual photos
                map.on('click', 'unclustered-point', (e) => {
                    const properties = e.features[0].properties;
                    const coordinates = e.features[0].geometry.coordinates.slice();
                    
                    // Format date
                    let dateStr = 'Date unknown';
                    if (properties.dateTaken) {
                        const date = new Date(properties.dateTaken);
                        dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    }
                    
                    const popupHTML = `
                        <div class="photo-popup">
                            <img src="${properties.thumbnailPath}" 
                                 alt="${properties.filename}"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='">
                            <div class="photo-info">
                                <strong>${properties.filename}</strong><br>
                                ${dateStr}
                            </div>
                            <div class="photo-links">
                                <a href="${properties.mediumPath}" target="_blank" class="photo-link">View Medium</a>
                                <a href="${properties.largePath}" target="_blank" class="photo-link">View Full Size</a>
                            </div>
                        </div>
                    `;
                    
                    new maplibregl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(popupHTML)
                        .addTo(map);
                });
                
                // Change cursor on hover
                map.on('mouseenter', 'clusters', () => {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'clusters', () => {
                    map.getCanvas().style.cursor = '';
                });
                map.on('mouseenter', 'unclustered-point', () => {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'unclustered-point', () => {
                    map.getCanvas().style.cursor = '';
                });
            })
            .catch(error => {
                console.error('Error loading photo metadata:', error);
                document.getElementById('loading').innerHTML = 'Error loading photos: ' + error.message;
            });
    </script>
</body>
</html>
EOF

print_success "Interactive map generated: $MAP_FILE"

echo
print_success "=== METADATA EXTRACTION COMPLETE ==="
echo "Metadata file: $METADATA_FILE"
echo "Interactive map: $MAP_FILE"
echo "Photos with GPS: $gps_photos/$total_photos"
echo "Photos with dates: $date_photos/$total_photos"
echo
print_status "To view the map:"
print_status "1. Start your SvelteKit dev server: npm run dev"
print_status "2. Visit: http://localhost:5173/photo-map.html"
echo
if [ "$gps_photos" -gt 0 ]; then
    print_success "Map will show $gps_photos photo locations with clustering and popups!"
else
    print_warning "No GPS data found. The map will be empty."
    print_status "Consider using photos with location data or manually adding coordinates."
fi