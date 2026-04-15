<script lang="ts">
	export let data;

	type Category = 'material' | 'tectonic' | 'interaction' | 'phenomena';
	const categories: Category[] = ['material', 'tectonic', 'interaction', 'phenomena'];

	let selectedFilters: Record<Category, string[]> = {
		material: [],
		tectonic: [],
		interaction: [],
		phenomena: []
	};
	let filteredImages = data.images;
	let hasActiveFilters = false;
	
	let expandedIndex: number | null = null;

	function imageMatchesAllSelectedFilters(image: any) {
		const imageTags = Array.isArray(image?.tags) ? image.tags : [];

		for (const category of categories) {
			if (selectedFilters[category].length === 0) continue;
			
			let categoryMatch = false;
			for (const value of selectedFilters[category]) {
				if (imageTags.includes(value)) {
					categoryMatch = true;
					break;
				}
			}
			
			if (!categoryMatch) return false;
		}

		return true;
	}

	function toggleFilter(category: Category, value: string) {
		const currentValues = selectedFilters[category];
		const newValues = currentValues.includes(value)
			? currentValues.filter(v => v !== value)
			: [...currentValues, value];

		selectedFilters = {
			...selectedFilters,
			[category]: newValues
		};
	}

	function clearFilters(category?: Category) {
		if (category) {
			selectedFilters[category] = [];
			return;
		}

		selectedFilters = {
			material: [],
			tectonic: [],
			interaction: [],
			phenomena: []
		};
	}

	$: hasActiveFilters = categories.some((category) => selectedFilters[category].length > 0);
	$: console.log('selectedFilters:', selectedFilters, 'hasActiveFilters:', hasActiveFilters, 'filteredImages:', filteredImages.length);
	$: filteredImages = hasActiveFilters
		? data.images.filter((image: any) => imageMatchesAllSelectedFilters(image))
		: data.images;
	$: if (expandedIndex !== null && expandedIndex >= filteredImages.length) {
		expandedIndex = filteredImages.length > 0 ? filteredImages.length - 1 : null;
	}
	
	function openImage(index: number) {
		expandedIndex = index;
	}
	
	function closeExpanded() {
		expandedIndex = null;
	}
	
	function nextImage() {
		if (expandedIndex !== null && expandedIndex < filteredImages.length - 1) {
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
</script>

<svelte:window on:keydown={handleKeydown} />

<main>
	<div class="intro-box">
		<p><em><strong>Conditions of Observation</strong></em> is a photographic research tool developed for my Master of Architecture thesis at the University of Toronto. All photographs are my own, taken primarily with my iPhone between 2017 and 2025 as part of my ongoing practice of noticing.</p>
		<p>The thesis explores the role of contemporary vernacular materials and contingent urban conditions in shaping architectural culture. This work engages directly with contingent urban context through observation, documentation, and interpretive making to examine how overlooked artifacts of everyday life result from informal participation in the production of space.</p>
		<p>By treating discarded, provisional, and improvised material conditions as resources for architectural invention, this project highlights chance encounters and circumstantial geometries as productive forces in design.</p>
	</div>

	<div class="filters-panel">
		{#each categories as category}
			<section class="filter-group">
				<div class="filter-group-header">
					<h2>{category}</h2>
					{#if selectedFilters[category].length > 0}
						<button class="clear-category" type="button" on:click={() => clearFilters(category)}>clear</button>
					{/if}
				</div>
				<div class="filter-tags">
					{#each data.filterOptions[category] as value}
						<button
							type="button"
							class="filter-tag"
							class:active={selectedFilters[category].includes(value)}
							on:click={() => toggleFilter(category, value)}
						>
							{value}
						</button>
					{/each}
				</div>
			</section>
		{/each}

		<div class="filter-summary">
			<p>{filteredImages.length} / {data.images.length}</p>
			<button type="button" class="reset-all" on:click={() => clearFilters()} disabled={!hasActiveFilters}>reset all</button>
		</div>
	</div>
	
	<div class="image-container">
		{#each filteredImages as image, index (image.filename)}
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
				<img src={`/thumbnails/${filteredImages[expandedIndex].filename}`} alt={filteredImages[expandedIndex].filename} on:click={closeExpanded} />
				<button class="nav-btn prev-btn" on:click={prevImage} disabled={expandedIndex === 0}>‹</button>
				<button class="nav-btn next-btn" on:click={nextImage} disabled={expandedIndex === filteredImages.length - 1}>›</button>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		padding: 2rem 1rem;
		max-width: 100%;
		margin-left: 420px;
		padding-top: calc(2rem + 4rem);
	}

	.intro-box {
		width: 350px;
		margin: 0 auto 3rem;
		font-size: 0.95rem;
		line-height: 1.6;
		color: #333;
		text-align: justify;
	}

	.filters-panel {
		position: fixed;
		left: 0;
		top: 4rem;
		bottom: 3rem;
		z-index: 5;
		width: 400px;
		padding: 1.5rem 0.9rem;
		margin-top: 1rem;
		border-right: 1px solid #e5e5e5;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(4px);
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		overflow-y: auto;
	}

	.filter-group {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		border-bottom: 1px solid #f0f0f0;
		padding-bottom: 0.55rem;
	}

	.filter-group:last-of-type {
		border-bottom: none;
		padding-bottom: 0;
	}

	.filter-group-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		min-width: 86px;
	}

	.filter-group-header h2 {
		margin: 0;
		font-size: 0.82rem;
		font-style: italic;
		font-weight: 500;
		text-transform: lowercase;
	}

	.filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.filter-tag,
	.clear-category,
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
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		font-style: italic;
		color: #666;
	}

	.filter-summary p {
		margin: 0;
	}

	.reset-all:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.intro-box p {
		margin: 0;
		padding: 0;
	}

	.image-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		align-items: center;
	}

	.image-item-wrapper {
		width: 350px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.image-item {
		position: relative;
		width: 350px;
		aspect-ratio: 3 / 4;
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

	@media (max-width: 760px) {
		.filter-group {
			flex-direction: column;
			gap: 0.45rem;
		}

		.filter-group-header {
			min-width: auto;
		}
	}
</style>
