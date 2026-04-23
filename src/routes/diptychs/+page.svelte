<script lang="ts">
	import { onMount } from 'svelte';
	import { observations } from '$lib/stores/observations';

	export let data;

	const images = data.images;
	let activeTab: 'make' | 'see' = 'see';
	
	// Make tab state
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

	function formatDate(timestamp: number) {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	onMount(() => {
		observations.init();
		refreshBoth();
	});
</script>

<svelte:head>
	<title>Diptychs</title>
</svelte:head>

<main>
	<div class="sidebar">
		<div class="sidebar-header">
			<h1 class="sidebar-title">Diptychs</h1>
			<div class="tabs-header">
				<button
					class="tab-button"
					class:active={activeTab === 'see'}
					on:click={() => (activeTab = 'see')}
				>
					see
				</button>
				<span class="tab-divider">/</span>
				<button
					class="tab-button"
					class:active={activeTab === 'make'}
					on:click={() => (activeTab = 'make')}
				>
					make
				</button>
			</div>
		</div>

		<div class="sidebar-divider"></div>

		<div class="sidebar-content">
			{#if activeTab === 'see'}
				<div class="see-instructions">
					<p>Diptychs reveal how juxtaposition creates meaning. By placing two images side by side, a third meaning emerges—one that neither image holds alone. This is the space between them.</p>
				</div>
			{:else}
				<div class="make-controls">
					<div class="make-instructions">
						<p>Compare two images and save your observations</p>
					</div>
					<h2 class="sidebar-title">analysis</h2>
					<div class="note-input-wrapper">
						<textarea
							id="note-input"
							placeholder="add your analysis..."
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
					<div class="refresh-section">
						<div class="refresh-label">refresh</div>
						<div class="controls">
							<button on:click={refreshLeft} class="refresh-side-btn">left</button>
							<button on:click={refreshBoth} class="refresh-both-btn">both</button>
							<button on:click={refreshRight} class="refresh-side-btn">right</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if activeTab === 'see'}
		{#if $observations.length === 0}
			<div class="observations-container empty">
				<p>no observations yet</p>
			</div>
		{:else}
			<div class="observations-container">
				{#each $observations as obs (obs.id)}
					<div class="observation-card">
						<div class="pair-container">
							<img src={obs.leftImage.thumbnail} alt={obs.leftImage.filename} />
							<img src={obs.rightImage.thumbnail} alt={obs.rightImage.filename} />
						</div>
						<p class="card-note">{obs.note}</p>
						<p class="card-date">{formatDate(obs.timestamp)}</p>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	{#if activeTab === 'make'}
		<div class="image-pair-wrapper">
			<div class="image-wrapper">
				{#if leftImage}
					<img src={leftImage.thumbnail} alt={leftImage.filename} title={leftImage.filename} />
				{/if}
			</div>
			<div class="image-wrapper">
				{#if rightImage}
					<img src={rightImage.thumbnail} alt={rightImage.filename} title={rightImage.filename} />
				{/if}
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		width: 100%;
		height: calc(100vh - 4rem);
		display: flex;
		padding: 0 4rem;
		margin: 0;
		overflow: hidden;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		box-sizing: border-box;
	}

	main > * {
		flex: 0 0 auto;
	}

	.sidebar {
		width: min(42.5vw, 42.5vh);
		aspect-ratio: 3 / 4;
		height: auto;
		max-height: 100%;
		border: 1px solid #e5e5e5;
		background: white;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		z-index: 5;
	}

	.sidebar-header {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
		text-align: center;
		border-bottom: 1px solid #e5e5e5;
		background: white;
	}

	.sidebar-title {
		margin: 0;
		padding: 0;
		font-size: 1rem;
		font-weight: normal;
		font-style: italic;
		color: #333;
		letter-spacing: 0.5px;
		width: 100%;
	}

	.sidebar-divider {
		height: 1px;
		background: #e5e5e5;
	}

	.tabs-header {
		display: flex;
		gap: 0.5rem;
		padding: 0;
		align-items: center;
		justify-content: center;
	}

	.tab-button {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.7rem;
		font-style: italic;
		font-family: Georgia, serif;
		color: #999;
		transition: all 0.2s ease;
		padding: 0;
		margin: 0;
		position: relative;
	}

	.tab-button:hover {
		color: #666;
	}

	.tab-button.active {
		color: #333;
		filter: blur(4px);
	}

	.tab-divider {
		color: #999;
		font-size: 0.7rem;
		font-style: italic;
		font-family: Georgia, serif;
		margin: 0 0.3rem;
	}

	.sidebar-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0.75rem;
		gap: 0.75rem;
		overflow-y: auto;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.sidebar-content::-webkit-scrollbar {
		display: none;
	}

	.make-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
	}

	.see-instructions {
		padding: 0.5rem 0;
		margin: 0;
	}

	.see-instructions p {
		margin: 0;
		font-size: 0.8rem;
		font-style: italic;
		color: #999;
		line-height: 1.4;
	}

	.make-instructions {
		padding: 0.5rem 0;
		margin: 0;
	}

	.make-instructions p {
		margin: 0;
		font-size: 0.8rem;
		font-style: italic;
		color: #999;
		line-height: 1.4;
	}

	.note-input-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.note-input {
		width: 100%;
		flex: 1;
		min-height: 80px;
		padding: 0.5rem;
		font-family: inherit;
		font-size: 0.75rem;
		font-style: italic;
		border: 1px solid #e5e5e5;
		background: white;
		resize: none;
		overflow-y: auto;
		box-sizing: border-box;
	}

	.note-input:focus {
		outline: none;
		border-color: #666;
	}

	.save-btn {
		padding: 0.35rem 0.5rem;
		font-size: 0.65rem;
		font-style: italic;
		border: 1px solid #e5e5e5;
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

	.refresh-label {
		font-size: 0.65rem;
		font-style: italic;
		color: #666;
	}

	.refresh-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: auto;
	}

	.controls {
		display: flex;
		gap: 0.3rem;
	}

	.refresh-side-btn {
		flex: 1;
		padding: 0.35rem;
		font-size: 0.65rem;
		font-style: italic;
		border: 1px solid #e5e5e5;
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
		padding: 0.35rem;
		font-size: 0.65rem;
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

	.main-content {
		display: none;
	}

	.observations-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
		justify-content: flex-start;
		background: white;
		width: calc(min(42.5vw, 42.5vh) * 2 + 1.5rem);
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 0;
		padding-top: calc((100vh - 4rem - min(56.67vw, 56.67vh)) / 2);
		box-sizing: border-box;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.observations-container::-webkit-scrollbar {
		display: none;
	}

	.observations-container.empty {
		align-items: center;
		justify-content: center;
		color: #999;
		font-size: 0.75rem;
		font-style: italic;
	}

	.image-pair-wrapper {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		justify-content: center;
		background: #f9f9f9;
		width: calc(min(42.5vw, 42.5vh) * 2 + 1.5rem);
		height: calc(min(42.5vw, 42.5vh) * 4 / 3);
	}

	.image-pair-wrapper .image-wrapper {
		width: calc(min(42.5vw, 42.5vh) / 2);
		height: calc(min(42.5vw, 42.5vh) * 4 / 3);
		aspect-ratio: 3 / 4;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.image-pair-wrapper .image-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		aspect-ratio: 3 / 4;
		border-radius: 0;
		background: white;
	}

	.pair-container {
		display: flex;
		gap: 1.5rem;
		width: calc(min(42.5vw, 42.5vh) * 2 + 1.5rem);
		height: calc(min(42.5vw, 42.5vh) * 4 / 3);
		background: #f9f9f9;
		align-items: center;
		justify-content: center;
	}

	.pair-container img {
		width: calc(min(42.5vw, 42.5vh) / 2);
		height: calc(min(42.5vw, 42.5vh) * 4 / 3);
		aspect-ratio: 3 / 4;
		object-fit: cover;
		background: white;
	}

	.observation-card {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0;
		background: transparent;
		border: none;
		align-items: center;
		flex-shrink: 0;
		box-sizing: border-box;
	}

	.observation-card .pair-container {
		background: white;
		width: 100%;
		height: auto;
		box-sizing: border-box;
		display: flex;
		gap: 1.5rem;
		align-items: center;
		justify-content: center;
	}

	.observation-card .pair-container img {
		flex: 1;
		height: calc(min(42.5vw, 42.5vh) * 4 / 3);
		aspect-ratio: 3 / 4;
		object-fit: cover;
		background: white;
	}

	.card-note {
		margin: 0;
		font-size: 0.75rem;
		color: #666;
		font-style: italic;
		line-height: 1.4;
		text-align: center;
		max-width: calc(min(42.5vw, 42.5vh) * 2 + 1.5rem);
	}

	.card-date {
		margin: 0;
		font-size: 0.65rem;
		color: #999;
		font-style: italic;
		text-align: center;
		max-width: calc(min(42.5vw, 42.5vh) * 2 + 1.5rem);
	}

	.image-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 400px;
	}

	.image-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		aspect-ratio: 3 / 4;
		border-radius: 4px;
		background: #f5f5f5;
	}
</style>
