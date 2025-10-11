#!/bin/bash

# Image Optimization Script
# Resizes and optimizes images for web use

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="./img-raw"
OUTPUT_DIR="./img-optimized"
FORMATS="jpg,jpeg,JPG,JPEG,png,PNG"

# Different sizes for different use cases
THUMB_SIZE=300        # Small thumbnails for grid view
MEDIUM_SIZE=800       # Medium size for modal/lightbox
LARGE_SIZE=1920       # Full size for detailed view

# Quality settings
THUMB_QUALITY=80      # Lower quality for small thumbnails
MEDIUM_QUALITY=85     # Good quality for medium size
LARGE_QUALITY=90      # High quality for full size

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

# Function to format file sizes
format_size() {
    local size=$1
    if [ $size -gt 1048576 ]; then
        echo "$(( size / 1048576 ))MB"
    elif [ $size -gt 1024 ]; then
        echo "$(( size / 1024 ))KB"
    else
        echo "${size}B"
    fi
}

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    print_error "ImageMagick is not installed. Please install it with: brew install imagemagick"
    exit 1
fi

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    print_error "Source directory '$SOURCE_DIR' does not exist."
    exit 1
fi

# Create output directories
mkdir -p "$OUTPUT_DIR/thumbnails"
mkdir -p "$OUTPUT_DIR/medium"
mkdir -p "$OUTPUT_DIR/large"
print_status "Created output directories: $OUTPUT_DIR/{thumbnails,medium,large}"

# Find all image files
print_status "Scanning for images in $SOURCE_DIR..."
image_files=()
for ext in ${FORMATS//,/ }; do
    while IFS= read -r -d '' file; do
        image_files+=("$file")
    done < <(find "$SOURCE_DIR" -name "*.$ext" -print0 2>/dev/null)
done

total_files=${#image_files[@]}
if [ $total_files -eq 0 ]; then
    print_error "No image files found in $SOURCE_DIR"
    exit 1
fi

print_status "Found $total_files images to process"

# Initialize counters
processed=0
skipped=0
errors=0
total_original_size=0
total_optimized_size=0
start_time=$(date +%s)

# Process each image
for file in "${image_files[@]}"; do
    filename=$(basename "$file")
    
    # Get original file size
    original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    total_original_size=$((total_original_size + original_size))
    
    # Skip if already processed (check if large version exists)
    large_file="$OUTPUT_DIR/large/$filename"
    if [ -f "$large_file" ]; then
        print_warning "Skipping $filename (already exists)"
        skipped=$((skipped + 1))
        continue
    fi
    
    # Process the image
    processed=$((processed + 1))
    print_status "Processing [$processed/$total_files]: $filename"
    
    # Create thumbnail (300px max, 80% quality) - preserve date/GPS
    thumb_file="$OUTPUT_DIR/thumbnails/$filename"
    if magick "$file" \
        -auto-orient \
        -resize "${THUMB_SIZE}x${THUMB_SIZE}>" \
        -quality $THUMB_QUALITY \
        -interlace Plane \
        "$thumb_file" 2>/dev/null; then
        print_success "✓ Thumbnail: $filename"
    else
        print_error "✗ Failed to create thumbnail for $filename"
        errors=$((errors + 1))
    fi
    
    # Create medium size (800px max, 85% quality) - preserve date/GPS
    medium_file="$OUTPUT_DIR/medium/$filename"
    if magick "$file" \
        -auto-orient \
        -resize "${MEDIUM_SIZE}x${MEDIUM_SIZE}>" \
        -quality $MEDIUM_QUALITY \
        -interlace Plane \
        "$medium_file" 2>/dev/null; then
        print_success "✓ Medium: $filename"
    else
        print_error "✗ Failed to create medium size for $filename"
        errors=$((errors + 1))
    fi
    
    # Create large size (1920px max, 90% quality) - preserve date/GPS
    large_file="$OUTPUT_DIR/large/$filename"
    if magick "$file" \
        -auto-orient \
        -resize "${LARGE_SIZE}x${LARGE_SIZE}>" \
        -quality $LARGE_QUALITY \
        -interlace Plane \
        "$large_file" 2>/dev/null; then
        
        # Get file sizes for all versions
        thumb_size=$(stat -f%z "$thumb_file" 2>/dev/null || stat -c%s "$thumb_file" 2>/dev/null || echo 0)
        medium_size=$(stat -f%z "$medium_file" 2>/dev/null || stat -c%s "$medium_file" 2>/dev/null || echo 0)
        large_size=$(stat -f%z "$large_file" 2>/dev/null || stat -c%s "$large_file" 2>/dev/null || echo 0)
        
        total_optimized_size=$((total_optimized_size + thumb_size + medium_size + large_size))
        
        print_success "✓ Large: $filename - $(format_size $original_size) → $(format_size $large_size)"
        print_success "  Created: Thumb($(format_size $thumb_size)) + Medium($(format_size $medium_size)) + Large($(format_size $large_size))"
    else
        print_error "✗ Failed to create large size for $filename"
        errors=$((errors + 1))
        # Clean up any partial files
        [ -f "$thumb_file" ] && rm "$thumb_file"
        [ -f "$medium_file" ] && rm "$medium_file"
        [ -f "$large_file" ] && rm "$large_file"
    fi
    
    # Show progress every 10 files
    if [ $((processed % 10)) -eq 0 ]; then
        elapsed=$(($(date +%s) - start_time))
        rate=$(echo "scale=1; $processed / $elapsed" | bc -l 2>/dev/null || echo "N/A")
        remaining=$((total_files - processed - skipped))
        if [ "$rate" != "N/A" ] && [ "${rate%.*}" -gt 0 ]; then
            eta=$(echo "scale=0; $remaining / $rate" | bc -l)
            eta_formatted=$(printf "%02d:%02d" $((eta/60)) $((eta%60)))
            print_status "Progress: $processed/$total_files processed, $rate files/sec, ETA: ${eta_formatted}"
        else
            print_status "Progress: $processed/$total_files processed"
        fi
    fi
done

# Final statistics
end_time=$(date +%s)
elapsed=$((end_time - start_time))
elapsed_formatted=$(printf "%02d:%02d" $((elapsed/60)) $((elapsed%60)))

echo
print_success "=== OPTIMIZATION COMPLETE ==="
echo "Total files found: $total_files"
echo "Successfully processed: $processed"
echo "Skipped (already exist): $skipped"
echo "Errors: $errors"
echo "Time elapsed: $elapsed_formatted"

if [ $processed -gt 0 ]; then
    total_savings=$((total_original_size - total_optimized_size))
    savings_percent=$((total_savings * 100 / total_original_size))
    
    echo "Original total size: $(format_size $total_original_size)"
    echo "Optimized total size: $(format_size $total_optimized_size)"
    echo "Total space saved: $(format_size $total_savings) (${savings_percent}%)"
    
    average_rate=$(echo "scale=1; $processed / $elapsed" | bc -l 2>/dev/null || echo "N/A")
    if [ "$average_rate" != "N/A" ]; then
        echo "Average processing rate: $average_rate files/second"
    fi
fi

echo
if [ $errors -eq 0 ]; then
    print_success "All images processed successfully!"
    print_status "Optimized images are in: $OUTPUT_DIR"
    print_status "Next step: Move optimized images to static/ folder for SvelteKit"
else
    print_warning "Completed with $errors errors. Check the output above for details."
fi