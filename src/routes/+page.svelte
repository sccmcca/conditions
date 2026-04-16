<script lang="ts">
	import { selectedFilters, hasActiveFilters, toggleFilter, clearFilters, createImageFilterFunction } from '$lib/stores/filters';
	import { onMount } from 'svelte';

	export let data;

	type Category = 'material' | 'tectonic' | 'interaction' | 'phenomena';
	const categories: Category[] = ['material', 'tectonic', 'interaction', 'phenomena'];

	// Create derived store for filtered images
	let filteredImages = createImageFilterFunction(data.images);
	
	// Track which categories are expanded
	let expandedCategories: Record<Category, boolean> = {
		material: false,
		tectonic: false,
		interaction: false,
		phenomena: false
	};
	
	let imageSize = 200; // Default image height in pixels
	let mapContainer: HTMLDivElement;
	let map: any;
	
	let expandedIndex: number | null = null;
	
	onMount(async () => {
		// Dynamically import MapLibre to avoid SSR issues
		const { Map } = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');

		// Initialize map
		map = new Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			center: [0, 0],
			zoom: 2
		});

		// Wait for style to load before updating
		map.once('style.load', () => {
			updateMapWithFilteredImages($filteredImages);
		});
	});

	function updateMapWithFilteredImages(images: any[]) {
		if (!map) return;

		// Get all geotagged images
		const geotaggedImages = images.filter(img => img.geolocation);

		// If no geotagged images, show world view
		if (geotaggedImages.length === 0) {
			map.flyTo({ center: [0, 0], zoom: 2 });
			return;
		}

		// Create GeoJSON
		const geojson = {
			type: 'FeatureCollection' as const,
			features: geotaggedImages.map((img: any) => ({
				type: 'Feature' as const,
				geometry: {
					type: 'Point' as const,
					coordinates: [img.geolocation.longitude, img.geolocation.latitude]
				},
				properties: {
					filename: img.filename
				}
			}))
		};

		// Initialize source and layer if they don't exist
		if (!map.getSource('location-source')) {
			map.addSource('location-source', {
				type: 'geojson',
				data: geojson
			});

			map.addLayer({
				id: 'location-points',
				type: 'circle',
				source: 'location-source',
				paint: {
					'circle-radius': 4,
					'circle-color': '#333',
					'circle-opacity': 0.6
				}
			});
		} else {
			// Update existing source
			(map.getSource('location-source') as any).setData(geojson);
		}

		// Calculate bounds
		const bounds = geotaggedImages.reduce((acc: any, img: any) => {
			return {
				minLng: Math.min(acc.minLng, img.geolocation.longitude),
				maxLng: Math.max(acc.maxLng, img.geolocation.longitude),
				minLat: Math.min(acc.minLat, img.geolocation.latitude),
				maxLat: Math.max(acc.maxLat, img.geolocation.latitude)
			};
		}, {
			minLng: Infinity,
			maxLng: -Infinity,
			minLat: Infinity,
			maxLat: -Infinity
		});

		// Fit map to bounds with padding
		if (isFinite(bounds.minLng)) {
			map.fitBounds(
				[
					[bounds.minLng, bounds.minLat],
					[bounds.maxLng, bounds.maxLat]
				],
				{ padding: 20, duration: 0 }
			);
		}
	}

	function toggleCategoryExpanded(category: Category) {
		expandedCategories[category] = !expandedCategories[category];
	}
	
	function openImage(index: number) {
		expandedIndex = index;
	}
	
	function closeExpanded() {
		expandedIndex = null;
	}
	
	function nextImage() {
		if (expandedIndex !== null && expandedIndex < $filteredImages.length - 1) {
			expandedIndex = expandedIndex + 1;
		}
	}
	
	function prevImage() {
		if (expandedIndex !== null && expandedIndex > 0) {
			expandedIndex = expandedIndex - 1;
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (expandedIndex === null) return;
		if (e.key === 'ArrowRight') {
			nextImage();
		} else if (e.key === 'ArrowLeft') {
			prevImage();
		} else if (e.key === 'Escape') {
			closeExpanded();
		}
	}

	$: if (expandedIndex !== null && expandedIndex >= $filteredImages.length) {
		expandedIndex = $filteredImages.length > 0 ? $filteredImages.length - 1 : null;
	}

	$: if (map) {
		updateMapWithFilteredImages($filteredImages);
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<main>
	<div class="filters-panel">
		<div class="filters-scroll">
			{#each categories as category}
				<section class="filter-group">
					<button 
						type="button"
						class="filter-group-header"
						on:click={() => toggleCategoryExpanded(category)}
					>
						<h2>{category}</h2>
						<span class="chevron" class:expanded={expandedCategories[category]}>›</span>
					</button>
					{#if expandedCategories[category]}
						<div class="filter-tags">
							{#each data.filterOptions[category] as value}
								<button
									type="button"
									class="filter-tag"
									class:active={$selectedFilters[category].includes(value)}
									on:click={() => toggleFilter(category, value)}
								>
									{value}
								</button>
							{/each}
						</div>
					{/if}
				</section>
			{/each}
		</div>

		<div class="filter-summary">
			<div class="location-map" bind:this={mapContainer}></div>
			<div class="size-slider">
				<label for="image-size">image size</label>
				<input 
					id="image-size"
					type="range" 
					min="100" 
					max="460" 
					bind:value={imageSize}
				/>
			</div>
			<div class="summary-footer">
				<p>{$filteredImages.length} / {data.images.length}</p>
				<button type="button" class="reset-all" on:click={() => clearFilters()} disabled={!$hasActiveFilters}>reset all</button>
			</div>
		</div>
	</div>
	
	<div class="image-container" style="--image-size: {imageSize}px;">
		{#each $filteredImages as image, index (image.filename)}
			<div class="image-item-wrapper" id={image.filename}>
				<div class="image-item" on:click={() => openImage(index)}>
					<img src={image.thumbnail} alt={image.filename} title={image.filename} />
					<div class="filename-overlay" aria-hidden="true">{image.filename}</div>
				</div>
				<div class="image-metadata">
					{#if image.author}<p class="author">{image.author}</p>{/if}
					{#if image.date}<p class="date">{image.date}</p>{/if}
					{#if image.tags?.length}<p class="tags">{image.tags.join(', ')}</p>{/if}
					{#if image.geolocation}<p class="geolocation">{image.geolocation.latitude.toFixed(4)}, {image.geolocation.longitude.toFixed(4)}</p>{/if}
					{#if image.caption}<p class="caption">{image.caption}</p>{/if}
				</div>
			</div>
		{/each}
	</div>
	
	{#if expandedIndex !== null}
		<div class="modal-overlay" on:click={closeExpanded}>
			<div class="modal-content" on:click={(e) => e.stopPropagation()}>
				<img src={`/thumbnails/${$filteredImages[expandedIndex].filename}`} alt={$filteredImages[expandedIndex].filename} on:click={closeExpanded} />
				<button class="nav-btn prev-btn" on:click={prevImage} disabled={expandedIndex === 0}>‹</button>
				<button class="nav-btn next-btn" on:click={nextImage} disabled={expandedIndex === $filteredImages.length - 1}>›</button>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		padding: 2rem 1rem 2rem 3rem;
		max-width: 100%;
		margin-left: max(20vw, 250px);
		padding-top: calc(2rem + 4rem);
	}

	.filters-panel {
		position: fixed;
		left: 0;
		top: 4rem;
		bottom: 3rem;
		z-index: 5;
		width: max(20vw, 250px);
		padding: 0;
		margin-top: 1rem;
		border-right: 1px solid #e5e5e5;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(4px);
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow: hidden;
	}

	.filters-scroll {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		border-bottom: 1px solid #f0f0f0;
		padding-bottom: 0.55rem;
	}

	.filter-group:last-of-type {
		border-bottom: none;
		padding-bottom: 0;
	}

	.filter-group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font-family: inherit;
	}

	.filter-group-header h2 {
		margin: 0;
		font-size: 0.82rem;
		font-style: italic;
		font-weight: 500;
		text-transform: lowercase;
		text-align: left;
	}

	.chevron {
		display: inline-block;
		font-size: 1.2rem;
		transition: transform 0.2s ease;
		color: #666;
	}

	.chevron.expanded {
		transform: rotate(90deg);
	}

	.filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.filter-tag,
	.reset-all {
		font-family: inherit;
		font-size: 0.75rem;
		font-style: italic;
		border: 1px solid #dfdfdf;
		background: white;
		padding: 0.2rem 0.45rem;
		cursor: pointer;
	}

	.filter-tag.active {
		background: #333;
		color: white;
		border-color: #333;
	}

	.filter-summary {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		font-size: 0.75rem;
		font-style: italic;
		color: #666;
		padding: 0.7rem 0.9rem;
		border-top: 1px solid #f0f0f0;
		flex-shrink: 0;
	}

	.location-map {
		width: 100%;
		aspect-ratio: 1;
		border: 1px solid #e5e5e5;
		border-radius: 2px;
		background: #f9f9f9;
	}

	:global(.location-map .maplibregl-control) {
		display: none;
	}

	.size-slider {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		align-items: flex-start;
	}

	.size-slider label {
		font-size: 0.75rem;
		font-style: italic;
		color: #666;
	}

	.size-slider input[type="range"] {
		width: 100%;
		cursor: pointer;
		height: 24px;
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		border: none;
		border-radius: 0;
	}

	.size-slider input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		background: white;
		cursor: pointer;
		border: 1px solid #999;
		border-radius: 50%;
		margin-top: -4px;
	}

	.size-slider input[type="range"]::-moz-range-thumb {
		width: 12px;
		height: 12px;
		background: white;
		cursor: pointer;
		border: 1px solid #999;
		border-radius: 50%;
	}

	.size-slider input[type="range"]::-webkit-slider-runnable-track {
		background: #ddd;
		height: 4px;
		border-radius: 2px;
	}

	.size-slider input[type="range"]::-moz-range-track {
		background: transparent;
		border: none;
	}

	.size-slider input[type="range"]::-moz-range-progress {
		background: #bbb;
		height: 4px;
		border-radius: 2px;
	}

	.summary-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-summary p {
		margin: 0;
	}

	.reset-all:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.image-container {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		align-items: flex-start;
		justify-content: flex-start;
	}

	.image-item-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: calc(var(--image-size) * 0.75);
	}

	.image-item {
		position: relative;
		width: calc(var(--image-size) * 0.75);
		height: var(--image-size);
		overflow: hidden;
		cursor: pointer;
		background: #f8f8f8;
	}

	.filename-overlay {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 0.35rem 0.5rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0));
		color: #fff;
		font-size: 0.75rem;
		font-style: italic;
		opacity: 0;
		transition: opacity 0.15s ease;
		pointer-events: none;
	}

	.image-item:hover .filename-overlay {
		opacity: 1;
	}

	.image-metadata {
		font-size: 0.85rem;
		color: #666;
		line-height: 1.4;
		font-style: italic;
	}

	.image-metadata p {
		margin: 0;
		padding: 0;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-content {
		position: relative;
		max-width: 85vw;
		max-height: 700px;
		aspect-ratio: 3 / 4;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.modal-content img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
		background: #f8f8f8;
		cursor: pointer;
	}
	
	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.8);
		border: none;
		color: #333;
		font-size: 2rem;
		cursor: pointer;
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
		z-index: 10;
	}
	
	.nav-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.95);
	}
	
	.nav-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	
	.prev-btn {
		left: -60px;
	}
	
	.next-btn {
		right: -60px;
	}
</style>
