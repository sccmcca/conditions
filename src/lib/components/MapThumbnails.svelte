<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	let { filteredImages = [] } = $props();

	let mapContainer: HTMLDivElement;
	let thumbnailsContainer: HTMLDivElement;
	let map: any;
	let isFirstUpdate = true;

	onMount(async () => {
		const { Map, ScaleControl } = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');

		// Initialize map
		map = new Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			center: [0, 0],
			zoom: 2,
			minZoom: 0,
			maxZoom: 18,
			pitch: 0,
			bearing: 0,
			attributionControl: false,
			dragRotate: false
		});

		// Add scale control
		map.addControl(new ScaleControl({ maxWidth: 100, unit: 'metric' }));

		// Update thumbnails on map movement
		map.on('move', () => {
			renderThumbnails();
		});

		// Wait for style to load
		map.once('style.load', () => {
			updateMap();
		});
	});

	function updateMap() {
		if (!map) return;

		const geotaggedImages = filteredImages.filter(img => img.geolocation);

		if (geotaggedImages.length > 0) {
			// Fit bounds to all images
			const bounds = geotaggedImages.reduce(
				(acc: any, img: any) => {
					return {
						minLng: Math.min(acc.minLng, img.geolocation.longitude),
						maxLng: Math.max(acc.maxLng, img.geolocation.longitude),
						minLat: Math.min(acc.minLat, img.geolocation.latitude),
						maxLat: Math.max(acc.maxLat, img.geolocation.latitude)
					};
				},
				{ minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
			);

			const duration = isFirstUpdate ? 0 : 2000;
			map.fitBounds(
				[[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
				{ padding: 50, duration }
			);
			isFirstUpdate = false;
		}

		renderThumbnails();
	}

	function renderThumbnails() {
		if (!map || !thumbnailsContainer) return;

		const geotaggedImages = filteredImages.filter(img => img.geolocation);
		const zoom = map.getZoom();

		// Clear existing thumbnails
		thumbnailsContainer.innerHTML = '';

		// Only render thumbnails at zoom 5+
		if (zoom < 5) {
			return;
		}

		// Get visible bounds
		const bounds = map.getBounds();

		let rendered = 0;
		const maxThumbnails = 50; // Cap at 50 thumbnails

		geotaggedImages.forEach((img: any) => {
			if (rendered >= maxThumbnails) return; // Stop if we've hit the cap

			const { longitude, latitude } = img.geolocation;

			// Check if within bounds
			if (
				longitude >= bounds.getWest() &&
				longitude <= bounds.getEast() &&
				latitude >= bounds.getSouth() &&
				latitude <= bounds.getNorth()
			) {
				const point = map.project([longitude, latitude]);

				const wrapper = document.createElement('div');
				wrapper.style.position = 'absolute';
				wrapper.style.left = point.x + 'px';
				wrapper.style.top = point.y + 'px';
				wrapper.style.transform = 'translate(-50%, -50%)';
				wrapper.style.width = '60px';
				wrapper.style.height = '80px';
				wrapper.style.cursor = 'pointer';
				wrapper.style.borderRadius = '2px';
				wrapper.style.overflow = 'hidden';
				wrapper.style.border = '1px solid #ccc';
				wrapper.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
				wrapper.style.backgroundColor = '#f0f0f0';

				const img_el = document.createElement('img');
				img_el.src = img.thumbnail;
				img_el.style.width = '100%';
				img_el.style.height = '100%';
				img_el.style.objectFit = 'cover';
				img_el.style.display = 'block';
				img_el.loading = 'lazy';

				wrapper.appendChild(img_el);

				wrapper.addEventListener('mouseenter', () => {
					wrapper.style.opacity = '0.7';
					wrapper.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
				});

				wrapper.addEventListener('mouseleave', () => {
					wrapper.style.opacity = '1';
					wrapper.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
				});

				wrapper.addEventListener('click', () => {
					console.log('Clicked:', img.filename);
				});

				thumbnailsContainer.appendChild(wrapper);
				rendered++;
			}
		});
	}

	// Watch filtered images and re-render when they change
	$effect(() => {
		if (map && filteredImages.length >= 0) {
			updateMap();
		}
	});
</script>

<div class="map-thumbnails-container">
	<div bind:this={mapContainer} class="map-container"></div>
	<div bind:this={thumbnailsContainer} class="thumbnails-container"></div>
</div>

<style>
	.map-thumbnails-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.map-container {
		width: 100%;
		height: 100%;
	}

	.thumbnails-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	:global(.thumbnails-container > div) {
		pointer-events: auto;
	}
</style>

