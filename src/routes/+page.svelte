<script lang="ts">
	export let data;
	
	let expandedIndex: number | null = null;
	
	function openImage(index: number) {
		expandedIndex = index;
	}
	
	function closeExpanded() {
		expandedIndex = null;
	}
	
	function nextImage() {
		if (expandedIndex !== null && expandedIndex < data.images.length - 1) {
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
	<div class="image-container">
		{#each data.images as image, index (image.filename)}
			<div class="image-item" on:click={() => openImage(index)}>
				<img src={image.thumbnail} alt={image.filename} />
			</div>
		{/each}
	</div>
	
	{#if expandedIndex !== null}
		<div class="modal-overlay" on:click={closeExpanded}>
			<div class="modal-content" on:click={(e) => e.stopPropagation()}>
				<img src={`/thumbnails/${data.images[expandedIndex].filename}`} alt={data.images[expandedIndex].filename} on:click={closeExpanded} />
				<button class="nav-btn prev-btn" on:click={prevImage} disabled={expandedIndex === 0}>‹</button>
				<button class="nav-btn next-btn" on:click={nextImage} disabled={expandedIndex === data.images.length - 1}>›</button>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		padding: 2rem 1rem;
		max-width: 100%;
	}

	.image-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		align-items: center;
	}

	.image-item {
		width: 350px;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		cursor: pointer;
		background: #f8f8f8;
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
