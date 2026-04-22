<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { mapExpanded, mapCenter, mapZoom } from '$lib/stores/metadata';

	export let filteredImages: any[] = [];
	export let expanded: boolean = false;

	let mapContainer: HTMLDivElement;
	let map: any;
	let hoveredImageFilename: string | null = null;
	let selectedImageFilename: string | null = null;
	let popupPos = { x: 0, y: 0 };
	let layerInitialized = false;
	let isFirstUpdate = true;

	// Handle map resize when expanding/collapsing
	$: if (map && $mapExpanded !== undefined) {
		setTimeout(() => {
			map.resize();
		}, 50);
	}

	onMount(async () => {
		const { Map, ScaleControl } = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');

		// Initialize map
		map = new Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			center: $mapCenter,
			zoom: $mapZoom,
			minZoom: 0,
			maxZoom: 18,
			pitch: 0,
			bearing: 0,
			attributionControl: false,
			dragRotate: false
		});

		// Add scale control
		map.addControl(new ScaleControl({ maxWidth: 100, unit: 'metric' }));

		// Sync map state to stores
		map.on('move', () => {
			mapCenter.set(map.getCenter());
			mapZoom.set(map.getZoom());
		});

		// Wait for style to load
		map.once('style.load', () => {
			console.log('Map style loaded');
			updateMap(expanded);
		});
	});

	function updateMap(skipFitBounds: boolean = false) {
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
					'circle-opacity': 1
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

		// Fit bounds if there are points (skip if flag is set)
		if (!skipFitBounds && geotaggedImages.length > 0) {
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

			const duration = isFirstUpdate ? 0 : 4000;
			map.fitBounds(
				[[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
				{ padding: 50, duration }
			);
			isFirstUpdate = false;
		} else if (!skipFitBounds) {
			map.flyTo({ center: [0, 0], zoom: 0, duration: 4000 });
			isFirstUpdate = false;
		}
	}

	function setupHoverEvents() {
		if (!map) return;

		console.log('Setting up hover and click events for image-points layer');

		// Track if we just clicked a point to prevent map click handler from firing
		let justClickedPoint = false;

		// Hover to preview image
		map.on('mouseenter', 'image-points', (e: any) => {
			if (e.features.length > 0) {
				const filename = e.features[0].properties.filename;
				// Hovering over any point clears selection and shows preview
				selectedImageFilename = null;
				hoveredImageFilename = filename;
				updatePopupPosition(e);
			}
			map.getCanvas().style.cursor = 'pointer';
		});

		// Stop hovering - clear preview
		map.on('mouseleave', 'image-points', () => {
			hoveredImageFilename = null;
			map.getCanvas().style.cursor = '';
		});

		// Move mouse while hovering to keep popup positioned correctly
		map.on('mousemove', 'image-points', (e: any) => {
			if (hoveredImageFilename && e.features.length > 0) {
				updatePopupPosition(e);
			}
		});

		// Click handler on points layer - toggle selection on/off
		map.on('click', 'image-points', (e: any) => {
			if (e.features.length > 0) {
				const filename = e.features[0].properties.filename;
				console.log('Clicked/tapped on point:', filename);
				
				justClickedPoint = true;
				
				// Toggle selection
				if (selectedImageFilename === filename) {
					selectedImageFilename = null;
				} else {
					selectedImageFilename = filename;
					hoveredImageFilename = null;
					updatePopupPosition(e);
				}
			}
		});

		// Click elsewhere on map to close popup
		map.on('click', (e: any) => {
			// Only process if we didn't just click a point
			if (!justClickedPoint && selectedImageFilename) {
				console.log('Clicked on map background, closing popup');
				selectedImageFilename = null;
			}
			justClickedPoint = false;
		});

		// Close when pressing escape key
		document.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Escape' && selectedImageFilename) {
				console.log('Escape pressed, closing popup');
				selectedImageFilename = null;
				hoveredImageFilename = null;
			}
		});
	}

	function updatePopupPosition(e: any) {
		const rect = map.getCanvas().getBoundingClientRect();
		const mouseX = e.originalEvent.clientX - rect.left;
		const mouseY = e.originalEvent.clientY - rect.top;
		
		// Actual popup dimensions
		const popupWidth = 120;
		const popupHeight = 160;
		const padding = 10;
		
		// Try to position above and to the right
		let x = mouseX + padding;
		let y = mouseY - popupHeight - padding;
		
		// Constrain to map bounds with fallback positions
		if (x + popupWidth > rect.width - padding) {
			// Move to left of cursor if it would overflow right
			x = mouseX - popupWidth - padding;
		}
		
		if (x < padding) {
			// If still off-screen on left, center horizontally
			x = Math.max(padding, (rect.width - popupWidth) / 2);
		}
		
		if (y < padding) {
			// Move below cursor if above doesn't fit
			y = mouseY + padding;
		}
		
		if (y + popupHeight > rect.height - padding) {
			// If below overflows, center vertically
			y = Math.max(padding, (rect.height - popupHeight) / 2);
		}
		
		popupPos = { x, y };
	}

	// Watch map initialization and filtered images - update when filters change
	$: if (map && layerInitialized && filteredImages.length >= 0) {
		updateMap(expanded);
	}

	export function flyToLocation(latitude: number, longitude: number) {
		if (map) {
			map.flyTo({
				center: [longitude, latitude],
				zoom: 15,
				duration: 4000
			});
		}
	}

	export function getMapState() {
		if (map) {
			return {
				center: map.getCenter(),
				zoom: map.getZoom()
			};
		}
		return null;
	}

	export function setMapState(center: any, zoom: number) {
		if (map) {
			map.setCenter(center);
			map.setZoom(zoom);
		}
	}

	export function expandMap() {
		if (map) {
			// Capture current state
			mapCenter.set([map.getCenter().lng, map.getCenter().lat]);
			mapZoom.set(map.getZoom());
			// Trigger expansion
			mapExpanded.set(true);
		}
	}
</script>

{#if $mapExpanded}
	<!-- expanded map is now rendered at layout level -->
{/if}

<div class="map-wrapper" class:expanded>
	<div class="map-container" bind:this={mapContainer}></div>
	{#if !expanded}
		<button class="expand-button" on:click={expandMap} title="Expand map">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
			</svg>
		</button>
	{/if}
	
	{#if hoveredImageFilename || selectedImageFilename}
		<div class="hover-popup" style="left: {popupPos.x}px; top: {popupPos.y}px;">
			<img 
				src="{base}/thumbnails/{(selectedImageFilename || hoveredImageFilename).split('.')[0]}.jpg" 
				alt={selectedImageFilename || hoveredImageFilename}
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

	.map-wrapper.expanded {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(90vw, 90vh);
		height: min(90vw, 90vh);
		z-index: 10001;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.map-container {
		width: 100%;
		height: 100%;
		border: 1px solid #ddd;
	}

	.expand-button {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 24px;
		height: 24px;
		padding: 4px;
		background: white;
		border: 1px solid #ddd;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		color: #666;
		opacity: 1;
		transition: background-color 0.2s, border-color 0.2s;
	}

	.expand-button:hover {
		background-color: #f5f5f5;
		border-color: #999;
	}

	.hover-popup {
		position: absolute;
		pointer-events: none;
		z-index: 1000;
		background: white;
		border: 1px solid #999;
		border-radius: 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
		transition: opacity 0.15s ease;
	}

	.hover-popup img {
		display: block;
		width: 120px;
		height: 160px;
		object-fit: cover;
	}

	.map-wrapper.expanded .hover-popup img {
		width: min(40vw, 40vh);
		height: auto;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}

	:global(.maplibregl-ctrl-scale) {
		opacity: 0.5 !important;
		margin: 5px 10px !important;
		border: 1px solid rgba(0, 0, 0, 0.1) !important;
		background: rgba(255, 255, 255, 0.3) !important;
	}
</style>

