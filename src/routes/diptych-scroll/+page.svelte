<script lang="ts">
	import { onMount } from 'svelte';
	import { observations } from '$lib/stores/observations';

	export let data;

	const images = data.images;
	let noteText = '';
	let leftImage: any = null;
	let rightImage: any = null;
	let leftColumn: HTMLElement;
	let rightColumn: HTMLElement;

	function updateCurrentPair() {
		// Get the image closest to the center of the left column
		if (leftColumn && rightColumn) {
			const leftItems = leftColumn.querySelectorAll('.image-item');
			const rightItems = rightColumn.querySelectorAll('.image-item');

			if (leftItems.length > 0 && rightItems.length > 0) {
				const leftRect = leftColumn.getBoundingClientRect();
				const rightRect = rightColumn.getBoundingClientRect();
				const centerY = window.innerHeight / 2;

				let closestLeft = { item: null, distance: Infinity, index: 0 };
				let closestRight = { item: null, distance: Infinity, index: 0 };

				leftItems.forEach((item, index) => {
					const rect = item.getBoundingClientRect();
					const distance = Math.abs(rect.top + rect.height / 2 - centerY);
					if (distance < closestLeft.distance) {
						closestLeft = { item, distance, index };
					}
				});

				rightItems.forEach((item, index) => {
					const rect = item.getBoundingClientRect();
					const distance = Math.abs(rect.top + rect.height / 2 - centerY);
					if (distance < closestRight.distance) {
						closestRight = { item, distance, index };
					}
				});

				if (closestLeft.index < images.length) {
					leftImage = images[closestLeft.index];
				}
				if (closestRight.index < images.length) {
					rightImage = images[images.length - 1 - closestRight.index];
				}
			}
		}
	}

	async function saveObservation() {
		if (!leftImage || !rightImage || !noteText.trim()) return;

		await observations.add({
			leftImage: {
				filename: leftImage.filename,
				thumbnail: leftImage.thumbnail
			},
			rightImage: {
				filename: rightImage.filename,
				thumbnail: rightImage.thumbnail
			},
			note: noteText.trim()
		});

		noteText = '';
	}

	onMount(() => {
		observations.init();
		updateCurrentPair();

		const handleScroll = () => {
			updateCurrentPair();
		};

		leftColumn?.addEventListener('scroll', handleScroll);
		rightColumn?.addEventListener('scroll', handleScroll);

		return () => {
			leftColumn?.removeEventListener('scroll', handleScroll);
			rightColumn?.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<svelte:head>
	<title>Diptych Scroll</title>
</svelte:head>

<main>
	<div class="sidebar">
		<div class="sidebar-content">
			<h1 class="sidebar-title">diptych scroll</h1>
			<div class="note-section">
				<label for="note-input" class="note-label">analysis</label>
				<div class="note-input-wrapper">
					<textarea
						id="note-input"
						placeholder="add analysis..."
						bind:value={noteText}
						class="note-input"
					></textarea>
				</div>
				<button
					on:click={saveObservation}
					class="save-btn"
					disabled={!leftImage || !rightImage || !noteText.trim()}
				>
					save
				</button>
			</div>
		</div>
	</div>

	<div class="content">
		<div class="split-container">
			<div class="column left-column" bind:this={leftColumn}>
				{#each images as image, index (image.filename)}
					<div class="image-item">
						<img src={image.thumbnail} alt={image.filename} title={image.filename} loading="lazy" />
					</div>
				{/each}
			</div>

			<div class="divider"></div>

			<div class="column right-column" bind:this={rightColumn}>
				{#each [...images].reverse() as image, index (image.filename)}
					<div class="image-item">
						<img src={image.thumbnail} alt={image.filename} title={image.filename} loading="lazy" />
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>

<style>
	main {
		width: 100%;
		height: calc(100vh - 4rem);
		display: flex;
		padding: 0;
		margin: 0;
		overflow: hidden;
	}

	.sidebar {
		position: fixed;
		left: 0;
		top: 4rem;
		bottom: 0;
		z-index: 5;
		width: max(20vw, 250px);
		padding: 0 0 2rem 0;
		margin-top: 1rem;
		border-right: 1px solid #e5e5e5;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(4px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1.5rem 0.9rem;
		gap: 1rem;
		overflow-y: auto;
	}

	.sidebar-title {
		margin: 0;
		padding: 0.3rem 0;
		font-size: 0.8rem;
		font-weight: 600;
		font-style: italic;
		text-transform: lowercase;
		color: #333;
		border-bottom: 1px solid #f0f0f0;
		padding-bottom: 0.5rem;
	}

	.note-label {
		display: block;
		font-size: 0.7rem;
		font-style: italic;
		color: #666;
		margin-bottom: 0.3rem;
	}

	.note-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0 0.5rem;
	}

	.content {
		margin-left: max(20vw, 250px);
		flex: 1;
		height: calc(100vh - 4rem);
		overflow: hidden;
	}

	.split-container {
		display: flex;
		width: 100%;
		height: 100%;
		gap: 0;
	}

	.column {
		flex: 1;
		overflow-y: scroll;
		overflow-x: hidden;
		padding: 0;
		scroll-behavior: smooth;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.column::-webkit-scrollbar {
		display: none;
	}

	.left-column {
	}

	.right-column {
		border-left: 0.5px solid #ccc;
	}

	.image-item {
		width: calc(100% - 2rem);
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: white;
		position: relative;
		margin: 0 auto;
		padding: 0;
		border-radius: 4px;
		overflow: hidden;
	}

	.image-item img {
		width: auto;
		height: 600px;
		object-fit: contain;
		background: white;
	}

	.divider {
		width: 0.5px;
		background: #ccc;
	}

	.note-input {
		width: 100%;
		max-width: 400px;
		min-height: 100px;
		max-height: 180px;
		padding: 1.75rem 0.5rem 0.5rem 0.5rem;
		font-family: inherit;
		font-size: 0.8rem;
		font-style: italic;
		border: 1px solid #dfdfdf;
		background: white;
		resize: vertical;
		overflow-y: auto;
		box-sizing: border-box;
	}

	.note-input-wrapper {
		position: relative;
		display: block;
		width: 100%;
		max-width: 400px;
		box-sizing: border-box;
	}

	.note-input:focus {
		outline: none;
		border-color: #666;
	}

	.save-btn {
		padding: 0.4rem 0.5rem;
		font-size: 0.7rem;
		font-style: italic;
		border: 1px solid #dfdfdf;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save-btn:hover:not(:disabled) {
		background: #333;
		color: white;
		border-color: #333;
	}

	.save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
