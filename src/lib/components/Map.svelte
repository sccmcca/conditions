<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { mapExpanded, mapCenter, mapZoom } from '$lib/stores/metadata';

	export let filteredImages: any[] = [];
	export let expanded: boolean = false;
	export let showThumbnails: boolean = false;

	let mapContainer: HTMLDivElement;
	let map: any;
	let hoveredImageFilename: string | null = null;
	let selectedImageFilename: string | null = null;
	let expandedImageFilename: string | null = null;
	let popupPos = { x: 0, y: 0 };
	let layerInitialized = false;
	let isFirstUpdate = true;
	let thumbnailMarkers: any[] = [];

	declare global {
		interface Window {
			maplibreMarker: any;
		}
	}

	// Handle map resize when expanding/collapsing
	$: if (map && $mapExpanded !== undefined) {
		setTimeout(() => {
			map.resize();
		}, 50);
	}

	onMount(async () => {
		const maplibregl = await import('maplibre-gl');
		const { Map, ScaleControl, Marker } = maplibregl.default || maplibregl;
		await import('maplibre-gl/dist/maplibre-gl.css');

		// Store Marker in window for use in renderThumbnails
		window.maplibreMarker = Marker;

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
			updateThumbnailsVisibility();
		});

		// Wait for style to load
		map.once('style.load', () => {
			console.log('Map style loaded');
			updateMap(expanded);
			updateThumbnailsVisibility();
		});

		// Add global keydown listener for Escape key
		const handleGlobalKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && expandedImageFilename) {
				expandedImageFilename = null;
			}
		};
		document.addEventListener('keydown', handleGlobalKeydown);

		// Cleanup on unmount
		return () => {
			document.removeEventListener('keydown', handleGlobalKeydown);
		};
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
					'circle-radius': 4.5,
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
					'circle-radius': 7,
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

	function updateThumbnailsVisibility() {
		if (!map) return;
		const zoom = map.getZoom();
		
		// Above zoom 12, show thumbnails and hide circles
		if (zoom >= 12) {
			if (map.getLayer('image-points')) {
				map.setLayoutProperty('image-points', 'visibility', 'none');
			}
			if (map.getLayer('image-points-hover')) {
				map.setLayoutProperty('image-points-hover', 'visibility', 'none');
			}
			renderThumbnails();
		} else {
			// Below zoom 12, show circles and hide thumbnails
			if (map.getLayer('image-points')) {
				map.setLayoutProperty('image-points', 'visibility', 'visible');
			}
			if (map.getLayer('image-points-hover')) {
				map.setLayoutProperty('image-points-hover', 'visibility', 'visible');
			}
			clearThumbnails();
		}
	}

	function renderThumbnails() {
		const geotaggedImages = filteredImages.filter(img => img.geolocation);
		const bounds = map.getBounds();
		
		// Clear existing markers
		clearThumbnails();
		
		let rendered = 0;
		const maxThumbnails = 30;

		geotaggedImages.forEach((img: any) => {
			if (rendered >= maxThumbnails) return;

			const { longitude, latitude } = img.geolocation;
			
			// Check if within bounds
			if (
				longitude >= bounds.getWest() &&
				longitude <= bounds.getEast() &&
				latitude >= bounds.getSouth() &&
				latitude <= bounds.getNorth()
			) {
				const el = document.createElement('div');
				el.style.width = '60px';
				el.style.height = '80px';
				el.style.cursor = 'pointer';
				el.style.borderRadius = '2px';
				el.style.overflow = 'hidden';
				el.style.border = '1px solid #ccc';
				el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
				
				const img_el = document.createElement('img');
				img_el.src = img.thumbnail;
				img_el.style.width = '100%';
				img_el.style.height = '100%';
				img_el.style.objectFit = 'cover';
				img_el.style.display = 'block';
				img_el.loading = 'lazy';
				
				el.appendChild(img_el);
				
				el.addEventListener('mouseenter', () => {
					el.style.opacity = '0.7';
					el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
				});
				
				el.addEventListener('mouseleave', () => {
					el.style.opacity = '1';
					el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
				});

				el.addEventListener('click', () => {
					// Expand the thumbnail image
					expandedImageFilename = img.filename;
				});

				const marker = new (window.maplibreMarker as any)({ element: el })
					.setLngLat([longitude, latitude])
					.addTo(map);
				
				thumbnailMarkers.push(marker);
				rendered++;
			}
		});
	}

	function clearThumbnails() {
		thumbnailMarkers.forEach(marker => marker.remove());
		thumbnailMarkers = [];
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
				// Don't show preview for circles anymore
				selectedImageFilename = null;
				hoveredImageFilename = null;
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
			// No-op for circles now
		});

		// Click handler on points layer - flyto on click
		map.on('click', 'image-points', (e: any) => {
			if (e.features.length > 0) {
				const feature = e.features[0];
				const [longitude, latitude] = feature.geometry.coordinates;
				console.log('Clicked on point, flying to:', latitude, longitude);
				
				justClickedPoint = true;
				
				// Flyto the clicked point
				map.flyTo({
					center: [longitude, latitude],
					zoom: 15,
					duration: 4000
				});
			}
		});

		// Click elsewhere on map to close popup and clear hover
		map.on('click', (e: any) => {
			// Only process if we didn't just click a point
			if (!justClickedPoint && selectedImageFilename) {
				console.log('Clicked on map background, closing popup');
				selectedImageFilename = null;
			}
			// Clear hovered image
			hoveredImageFilename = null;
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
		updateThumbnailsVisibility();
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
	
	{#if hoveredImageFilename}
		<div class="hover-popup" style="left: {popupPos.x}px; top: {popupPos.y}px;">
			<img 
				src="{base}/thumbnails/{hoveredImageFilename.split('.')[0]}.jpg" 
				alt={hoveredImageFilename}
			/>
		</div>
	{/if}

	{#if expandedImageFilename}
		{@const expandedImage = filteredImages.find(img => img.filename === expandedImageFilename)}
		{#if expandedImage}
			<div class="expanded-overlay" on:click={() => expandedImageFilename = null}>
				<div class="expanded-content">
					<img src={expandedImage.thumbnail} alt={expandedImage.filename} />
				</div>
			</div>
		{/if}
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

	.expanded-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.expanded-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.expanded-content img {
		width: 60%;
		height: auto;
		aspect-ratio: 3 / 4;
		object-fit: cover;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}
</style>

