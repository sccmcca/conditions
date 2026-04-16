<script lang="ts">
	import { onMount } from 'svelte';

	export let filteredImages: any[] = [];

	let mapContainer: HTMLDivElement;
	let map: any;
	let hoveredImageFilename: string | null = null;
	let popupPos = { x: 0, y: 0 };
	let layerInitialized = false;

	onMount(async () => {
		const { Map, ScaleControl } = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');

		// Initialize map
		map = new Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			center: [-79.3957, 43.6629],
			zoom: 10,
			pitch: 0,
			bearing: 0,
			attributionControl: false,
			dragRotate: false
		});

		// Add scale control
		map.addControl(new ScaleControl({ maxWidth: 100, unit: 'metric' }));

		// Wait for style to load
		map.once('style.load', () => {
			console.log('Map style loaded');
			updateMap();
		});
	});

	function updateMap() {
		if (!map) return;

		const geotaggedImages = filteredImages.filter(img => img.geolocation);
		console.log('updateMap: Found', geotaggedImages.length, 'geotagged images');
		
		if (geotaggedImages.length > 0) {
			console.log('First image location:', geotaggedImages[0].geolocation);
		}

		// Create GeoJSON
		const geojson = {
			type: 'FeatureCollection',
			features: geotaggedImages.map((img: any) => ({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [img.geolocation.longitude, img.geolocation.latitude]
				},
				properties: {
					filename: img.filename
				}
			}))
		};

		// Add or update source
		if (!map.getSource('images')) {
			console.log('Creating new source');
			map.addSource('images', {
				type: 'geojson',
				data: geojson
			});

			// Add layer
			map.addLayer({
				id: 'image-points',
				type: 'circle',
				source: 'images',
				paint: {
					'circle-radius': 6,
					'circle-color': '#333',
					'circle-opacity': 0.8
				}
			});

			// Add hover layer highlight
			map.addLayer({
				id: 'image-points-hover',
				type: 'circle',
				source: 'images',
				paint: {
					'circle-radius': 9,
					'circle-color': '#333',
					'circle-opacity': 0
				},
				filter: ['boolean', ['feature-state', 'hover'], false]
			});

			// Mark layer as initialized first, then setup hover
			layerInitialized = true;
			setupHoverEvents();
		} else {
			console.log('Updating existing source');
			map.getSource('images').setData(geojson);
		}

		// Fit bounds if there are points
		if (geotaggedImages.length > 0) {
			// Don't auto-fit bounds - keep user's current zoom level
		} else {
			map.flyTo({ center: [-79.3957, 43.6629], zoom: 10 });
		}
	}

	function setupHoverEvents() {
		if (!map) return;

		console.log('Setting up hover events for image-points layer');

		map.on('mouseenter', 'image-points', (e: any) => {
			if (e.features.length > 0) {
				const filename = e.features[0].properties.filename;
				console.log('Hovering over:', filename);
				hoveredImageFilename = filename;
				
				updatePopupPosition(e);
				map.getCanvas().style.cursor = 'pointer';
				
				// Set feature state for highlight
				map.setFeatureState(
					{ source: 'images', id: e.features[0].id },
					{ hover: true }
				);
			}
		});

		map.on('mouseleave', 'image-points', () => {
			console.log('Left point');
			hoveredImageFilename = null;
			map.getCanvas().style.cursor = '';
		});

		map.on('mousemove', 'image-points', (e: any) => {
			if (hoveredImageFilename && e.features.length > 0) {
				updatePopupPosition(e);
			}
		});
	}

	function updatePopupPosition(e: any) {
		const rect = map.getCanvas().getBoundingClientRect();
		const mouseX = e.originalEvent.clientX - rect.left;
		const mouseY = e.originalEvent.clientY - rect.top;
		
		// Offset popup so it appears above and to the right of cursor
		let x = mouseX + 10;
		let y = mouseY - 130;
		
		// Constrain to map bounds
		const popupWidth = 90;
		const popupHeight = 130;
		
		if (x + popupWidth > rect.width) {
			x = mouseX - popupWidth - 10;
		}
		if (y < 0) {
			y = mouseY + 10;
		}
		
		popupPos = { x, y };
	}

	// Watch map initialization and filtered images - update when filters change
	$: if (map && layerInitialized && filteredImages.length >= 0) {
		updateMap();
	}

	export function flyToLocation(latitude: number, longitude: number) {
		if (map) {
			map.flyTo({
				center: [longitude, latitude],
				zoom: 15,
				duration: 3000
			});
		}
	}
</script>

<div class="map-wrapper">
	<div class="map-container" bind:this={mapContainer}></div>
	
	{#if hoveredImageFilename}
		<div class="hover-popup" style="left: {popupPos.x}px; top: {popupPos.y}px;">
			<img 
				src="/thumbnails/{hoveredImageFilename.split('.')[0]}.jpg" 
				alt={hoveredImageFilename}
			/>
		</div>
	{/if}
</div>

<style>
	.map-wrapper {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
	}

	.map-container {
		width: 100%;
		height: 100%;
		border: 1px solid #ddd;
		border-radius: 2px;
	}

	.hover-popup {
		position: absolute;
		pointer-events: none;
		z-index: 1000;
		background: white;
		border: 1px solid #999;
		border-radius: 3px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
		transition: opacity 0.15s ease;
	}

	.hover-popup img {
		display: block;
		width: 90px;
		height: 120px;
		object-fit: cover;
	}

	:global(.maplibregl-ctrl-scale) {
		opacity: 0.5 !important;
		margin: 5px 10px !important;
		border: 1px solid rgba(0, 0, 0, 0.1) !important;
		background: rgba(255, 255, 255, 0.3) !important;
	}
</style>

