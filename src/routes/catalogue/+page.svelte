<script lang="ts">
	import { onMount } from 'svelte';
	import {
		metadataStore,
		selectedFiltersStore,
		filteredImages,
		hasActiveFilters,
		expandedCategories,
		expandedImageIndex,
		hoveredMapImage,
		type Category
	} from '$lib/stores/metadata';
	import Map from '$lib/components/Map.svelte';

	export let data;

	const categories: Category[] = ['material', 'form', 'element', 'interaction', 'phenomena'];
	
	let mapComponent: any;
	let mapCollapsed = false;
	let viewMode: 'grid' | 'list' = 'grid';
	let randomizedImages: any[] = [];
	let isMobile = false;
	let conditionsExpanded = true;

	// Shuffle function
	function shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	// Load metadata on mount
	$: if (data?.images) {
		metadataStore.loadData(data);
	}

	onMount(() => {
		// Detect mobile
		isMobile = window.innerWidth < 768;
		
		// Set defaults for mobile
		if (isMobile) {
			mapCollapsed = true;
			viewMode = 'list';
			conditionsExpanded = false;
			// Collapse all filter categories on mobile
			expandedCategories.collapseAll();
		}
		
		// Subscribe to filtered images changes
		const unsubscribe = filteredImages.subscribe((images) => {
			randomizedImages = shuffleArray(images);
			// Reset expanded index if out of bounds
			if ($expandedImageIndex !== null && $expandedImageIndex >= randomizedImages.length) {
				expandedImageIndex.set(randomizedImages.length > 0 ? randomizedImages.length - 1 : null);
			}
		});
		return unsubscribe;
	});
	
	function nextImage() {
		if (isMobile) return;
		const current = $expandedImageIndex ?? -1;
		$expandedImageIndex = (current + 1) % randomizedImages.length;
	}
	
	function prevImage() {
		if (isMobile) return;
		const current = $expandedImageIndex ?? 0;
		$expandedImageIndex = (current - 1 + randomizedImages.length) % randomizedImages.length;
	}
	
	function closeExpanded() {
		if (isMobile) return;
		expandedImageIndex.set(null);
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if ($expandedImageIndex === null || isMobile) return;
		if (e.key === 'ArrowRight') nextImage();
		else if (e.key === 'ArrowLeft') prevImage();
		else if (e.key === 'Escape') closeExpanded();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<main>
	<div class="filters-panel">
		<button 
			type="button"
			class="filters-title-button"
			on:click={() => conditionsExpanded = !conditionsExpanded}
		>
			<h1 class="filters-title">conditions</h1>
			<span class="conditions-chevron" class:expanded={conditionsExpanded}>›</span>
		</button>
		{#if conditionsExpanded}
		<div class="filters-scroll">
			{#each categories as category}
				<section class="filter-group">
					<button 
						type="button"
						class="filter-group-header"
						on:click={() => expandedCategories.toggle(category)}
					>
						<h2>{category}</h2>
						<span class="chevron" class:expanded={$expandedCategories[category]}>›</span>
					</button>
					{#if $expandedCategories[category]}
						<div class="filter-tags">
							{#each data.filterOptions[category] as value}
								<button
									type="button"
									class="filter-tag"
									class:active={$selectedFiltersStore[category]?.includes(value) ?? false}
									on:click={() => selectedFiltersStore.toggle(category, value)}
								>
									{value}
								</button>
							{/each}
						</div>
					{/if}
				</section>
			{/each}
		</div>
		{/if}

		<div class="filter-summary">
			<button 
				type="button"
				class="map-toggle"
				on:click={() => mapCollapsed = !mapCollapsed}
				title={mapCollapsed ? 'show map' : 'hide map'}
			>
				<span class="map-label">map</span>
			<span class="map-chevron" class:collapsed={mapCollapsed}>›</span>
			</button>
			{#if !mapCollapsed}
				<Map bind:this={mapComponent} filteredImages={$filteredImages} />
			{/if}
			<div class="summary-footer">
				<p>{$filteredImages.length} / {data.images.length}</p>
				<button type="button" class="reset-all" on:click={() => selectedFiltersStore.clear()} disabled={!$hasActiveFilters}>reset all</button>
			</div>
		</div>
	</div>
	
			<div class="view-toggle">
			<button 
				type="button"
				class="toggle-btn"
				class:active={viewMode === 'grid'}
				on:click={() => viewMode = 'grid'}
			>
				grid
			</button>
			<button 
				type="button"
				class="toggle-btn"
				class:active={viewMode === 'list'}
				on:click={() => viewMode = 'list'}
			>
				list
			</button>
		</div>

	<div class="image-container" class:list-view={viewMode === 'list'}>
		{#each randomizedImages as image, index (image.filename)}
			<div class="image-item-wrapper" id={image.filename}>
				<div class="image-item-container">
					<button type="button" class="image-item" on:click={(e) => {
						if (isMobile) return;
						const target = e.target as HTMLElement;
						if (!target.closest('.info-geolocation')) {
							expandedImageIndex.set(index);
						}
					}}>
						<img src={image.thumbnail} alt={image.filename} title={image.filename} loading="lazy" />
					</button>
					<div class="image-hover-info">

						{#if image.author}<p class="info-author">{image.author}</p>{/if}
						{#if image.date}<p class="info-date">{image.date}</p>{/if}
						{#if image.tags?.length}<p class="info-tags">{image.tags.join(', ')}</p>{/if}
						{#if image.caption}<p class="info-caption">{image.caption}</p>{/if}
						{#if image.geolocation}<button type="button" class="info-geolocation" on:click={(e) => { e.stopPropagation(); mapComponent?.flyToLocation(image.geolocation!.latitude, image.geolocation!.longitude); }}>{image.geolocation!.latitude.toFixed(4)}, {image.geolocation!.longitude.toFixed(4)}</button>{/if}
					</div>
				</div>
				<div class="image-metadata">
				</div>
			</div>
		{/each}
	</div>
	
	{#if $expandedImageIndex !== null}
		<div class="modal-overlay" role="button" tabindex="0" on:click={closeExpanded} on:keydown={(e) => e.key === 'Escape' && closeExpanded()}>
			<div class="modal-content" on:click={(e) => e.stopPropagation()} role="presentation">
				<button type="button" class="modal-image" on:click={closeExpanded}>
					<img src={randomizedImages[$expandedImageIndex].thumbnail} alt={randomizedImages[$expandedImageIndex].filename} />
				</button>
				<button class="nav-btn prev-btn" type="button" on:click={prevImage}>‹</button>
				<button class="nav-btn next-btn" type="button" on:click={nextImage}>›</button>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		padding: 3rem 1rem 3rem 3rem;
		max-width: 100%;
		margin-left: max(25vw, 320px);
	}

	.view-toggle {
		position: fixed;
		top: 4rem;
		right: 1rem;
		display: flex;
		gap: 1rem;
		z-index: 10;
	}

	.toggle-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #999;
		font-size: 0.85rem;
		font-family: inherit;
		font-style: italic;
		transition: color 0.2s ease;
		padding: 0;
		margin: 0;
	}

	.toggle-btn:hover {
		color: #333;
	}

	.toggle-btn.active {
		color: #333;
		font-weight: 500;
	}

	.filters-panel {
		position: fixed;
		left: 0;
		top: 4rem;
		bottom: 3rem;
		z-index: 5;
		width: max(25vw, 320px);
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

	.filters-title-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		background: none;
		border: none;
		border-bottom: 1px solid #f0f0f0;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.82rem;
		font-style: italic;
		font-weight: 500;
		padding: 0.7rem 0.9rem;
		margin: 0;
		width: 100%;
	}

	.filters-title {
		margin: 0;
		padding: 0;
		font-size: 0.82rem;
		font-weight: 500;
		font-style: italic;
		text-transform: lowercase;
		text-align: left;
	}

	.conditions-chevron {
		display: inline-block;
		font-size: 1.2rem;
		transition: transform 0.2s ease;
		color: #666;
	}

	.conditions-chevron.expanded {
		transform: rotate(90deg);
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
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
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
		flex-shrink: 1;
		min-height: 0;
		margin-top: auto;
	}

	.map-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.82rem;
		font-style: italic;
		font-weight: 500;
		padding: 0.25rem 0;
		margin: 0;
	}

	.map-label {
		flex: 1;
		text-align: left;
	}

	.map-chevron {
		display: inline-block;
		font-size: 1.2rem;
		transition: transform 0.2s ease;
		color: #666;
	}

	.map-chevron:not(.collapsed) {
		transform: rotate(90deg);
	}

	.filter-summary :global(.map-wrapper) {
		flex: 1;
		min-height: 200px;
		width: 100%;
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
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 0.75rem;
		align-items: start;
		justify-items: start;
	}

	.image-container.list-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
		justify-content: flex-start;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: none;
		-ms-overflow-style: none;
		margin: 0 auto;
		width: 90%;
	}

	.image-container.list-view::-webkit-scrollbar {
		display: none;
	}

	.image-item-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
	}

	.image-container.list-view .image-item-wrapper {
		width: 100%;
		max-width: min(55vw, 55vh);
		padding-top: 1.5rem;
		padding-bottom: 1.5rem;
	}



	.image-item-container {
		position: relative;
		width: 100%;
		padding-bottom: 133.33%;
		overflow: hidden;
	}

	.image-container.list-view .image-item-container {
		position: relative;
		width: 100%;
		padding-bottom: 133.33%;
		overflow: hidden;
	}

	.image-item {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		cursor: pointer;
		background: #f8f8f8;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
	}

	.image-hover-info {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		color: #fff;
		padding: 0.75rem;
		overflow-y: auto;
		opacity: 0;
		transition: opacity 0.15s ease;
		pointer-events: none;
		font-size: 0.75rem;
		font-style: italic;
		line-height: 1.3;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
	}

	.image-item-container:hover .image-hover-info {
		opacity: 1;
		pointer-events: auto;
	}

	@media (max-width: 768px) {
		.image-item-container:hover .image-hover-info {
			opacity: 0 !important;
			pointer-events: none !important;
		}
	}

	.image-hover-info p {
		margin: 0;
		padding: 0;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.image-hover-info .info-author,
	.image-hover-info .info-date {
		margin-bottom: 0.25rem;
	}

	.image-hover-info .info-tags {
		margin-top: 0.25rem;
	}

	.image-hover-info .info-caption {
		margin-top: 0.4rem;
		padding-top: 0.4rem;
		border-top: 1px solid rgba(255, 255, 255, 0.3);
		font-weight: 500;
	}

	.image-hover-info .info-geolocation {
		display: block;
		background: none;
		border: none;
		padding: 0;
		margin: 0.4rem 0 0 0;
		font: inherit;
		color: #fff;
		text-decoration: underline;
		text-decoration-color: rgba(255, 255, 255, 0.5);
		text-decoration-style: dotted;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
		cursor: pointer;
		transition: text-decoration-color 0.15s ease;
	}

	.image-hover-info .info-geolocation:hover {
		text-decoration-color: #fff;
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

	.geolocation {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		color: #666;
		text-decoration: underline;
		text-decoration-color: #999;
		text-decoration-style: dotted;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
		transition: color 0.15s ease, text-decoration-color 0.15s ease;
		cursor: pointer;
	}

	.geolocation:hover {
		color: #333;
		text-decoration-color: #333;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.image-item-container:hover img {
		filter: blur(4px);
	}

	@media (max-width: 768px) {
		.image-item-container:hover img {
			filter: blur(0) !important;
		}
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

	@media (max-width: 768px) {
		.modal-overlay {
			display: none;
		}
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
	
	.modal-image {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
		background: #f8f8f8;
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

	@media (max-width: 768px) {
		.nav-btn {
			display: none;
		}
	}
	
	.prev-btn {
		left: -60px;
	}
	
	.next-btn {
		right: -60px;
	}

	@media (max-width: 767px) {
		main {
			padding: 1rem;
			margin-left: 0;
			margin-bottom: 50dvh;
		}

		.view-toggle {
			display: none;
		}

		.filters-title-button {
			border-bottom: none;
			padding: 0.7rem 0.9rem 0.7rem 0.5rem;
			font-weight: bold;
			color: #666;
		}

		.filters-panel {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			top: auto;
			z-index: 5;
			width: 100%;
			height: auto;
			max-height: 50dvh;
			padding: 0;
			border-right: none;
			border-top: 1px solid #e5e5e5;
			background: rgba(255, 255, 255, 0.98);
			backdrop-filter: blur(4px);
			display: flex;
			flex-direction: column;
			gap: 0;
			overflow: hidden;
		}

		.filters-title {
			margin: 0;
			padding: 0 0 0 0.5rem;
			font-size: 0.82rem;
			font-weight: bold;
			font-style: italic;
			text-transform: lowercase;
			text-align: left;
			color: #666;
		}

		.filters-scroll {
			flex: 1;
			overflow-y: auto;
			padding: 1rem 0.9rem;
			display: flex;
			flex-direction: column;
			gap: 0.7rem;
		}

		.filter-summary {
			display: flex;
			flex-direction: column;
			gap: 0.7rem;
			font-size: 0.7rem;
			font-style: italic;
			color: #666;
			padding: 0.7rem 0.9rem;
			border-top: 1px solid #f0f0f0;
			flex-shrink: 1;
			min-height: 0;
			margin-top: auto;
		}

		.filter-summary :global(.map-wrapper) {
			min-height: 350px;
			padding-bottom: 2rem;
		}

		.map-toggle {
			font-weight: bold;
			color: #666;
		}

		.filter-tags {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 0.35rem;
		}

		.image-container {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			align-items: center;
			justify-content: flex-start;
			overflow-y: auto;
			overflow-x: hidden;
			scrollbar-width: none;
			-ms-overflow-style: none;
			margin: 0 auto;
			width: 100%;
		}

		.image-container::-webkit-scrollbar {
			display: none;
		}

		.image-container.list-view {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			align-items: center;
			justify-content: flex-start;
			overflow-y: auto;
			overflow-x: hidden;
			scrollbar-width: none;
			-ms-overflow-style: none;
			margin: 0 auto;
			width: 100%;
		}

		.image-item-wrapper {
			width: 100%;
			max-width: 80vw;
			padding-top: 1rem;
			padding-bottom: 1rem;
		}

		.image-container.list-view .image-item-wrapper {
			max-width: 80vw;
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
			max-width: 90vw;
			max-height: 80vh;
			aspect-ratio: 3 / 4;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
</style>
