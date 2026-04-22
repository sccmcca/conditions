<script lang="ts">
	import { onMount } from 'svelte';
	import { observations } from '$lib/stores/observations';

	export let data;

	const images = data.images;
	let leftImage: any = null;
	let rightImage: any = null;
	let noteText = '';

	function getRandomImage() {
		return images[Math.floor(Math.random() * images.length)];
	}

	function refreshLeft() {
		leftImage = getRandomImage();
	}

	function refreshRight() {
		rightImage = getRandomImage();
	}

	function refreshBoth() {
		refreshLeft();
		refreshRight();
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
		refreshBoth();
	});
</script>

<svelte:head>
	<title>Diptych Random</title>
</svelte:head>

<main>
	<div class="sidebar">
		<div class="sidebar-content">
			<h1 class="sidebar-title">diptych random</h1>
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
			<div class="refresh-section">
				<div class="note-label refresh-label">refresh</div>
				<div class="controls">
					<button on:click={refreshLeft} class="refresh-side-btn">left</button>
					<button on:click={refreshBoth} class="refresh-both-btn">both</button>
					<button on:click={refreshRight} class="refresh-side-btn">right</button>
				</div>
			</div>
		</div>
	</div>

	<div class="content">
		<div class="split-container">
			<div class="column">
				<div class="image-wrapper">
					{#if leftImage}
						<img src={leftImage.thumbnail} alt={leftImage.filename} title={leftImage.filename} />
					{/if}
				</div>
			</div>

			<div class="column">
				<div class="image-wrapper">
					{#if rightImage}
						<img src={rightImage.thumbnail} alt={rightImage.filename} title={rightImage.filename} />
					{/if}
				</div>
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

	.refresh-label {
		margin-bottom: 0.5rem;
	}

	.refresh-section {
		display: flex;
		flex-direction: column;
		margin-top: auto;
		gap: 0.5rem;
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
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		position: relative;
		border-right: 0.5px solid #ccc;
	}

	.column:last-child {
		border-right: none;
	}

	.image-wrapper {
		width: 100%;
		max-width: 400px;
		aspect-ratio: 3 / 4;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: white;
	}

	.image-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
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

	.controls {
		display: flex;
		gap: 0.3rem;
		margin-top: auto;
	}

	.refresh-side-btn {
		flex: 1;
		padding: 0.4rem 0.3rem;
		font-size: 0.7rem;
		font-style: italic;
		border: 1px solid #dfdfdf;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.refresh-side-btn:hover {
		background: #f5f5f5;
		border-color: #999;
	}

	.refresh-both-btn {
		flex: 1;
		padding: 0.4rem 0.3rem;
		font-size: 0.7rem;
		font-style: italic;
		font-weight: 500;
		border: 1px solid #333;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.refresh-both-btn:hover {
		background: #333;
		color: white;
	}
</style>
