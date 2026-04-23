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
		<div class="tabs-header">
			<button
				class="tab-button"
				class:active={activeTab === 'see'}
				on:click={() => (activeTab = 'see')}
			>
				see
			</button>
			<button
				class="tab-button"
				class:active={activeTab === 'make'}
				on:click={() => (activeTab = 'make')}
			>
				make
			</button>
		</div>

		<div class="sidebar-content">
			{#if activeTab === 'see'}
				<p class="sidebar-title observations-title">observations</p>
			{:else}
				<div class="make-controls">
					<h2 class="sidebar-title">analysis</h2>
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

	<div class="main-content">
		{#if activeTab === 'see'}
			{#if $observations.length === 0}
				<div class="empty-pair-state">
					<p>no observations yet</p>
				</div>
			{:else}
				<div class="observations-scroll">
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
		{:else}
			<div class="split-screen">
				<div class="pair-container">
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
			</div>
		{/if}
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
		width: max(20vw, 250px);
		height: 100%;
		border-right: 1px solid #e5e5e5;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(4px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		z-index: 5;
	}

	.tabs-header {
		display: flex;
		gap: 0;
		padding: 0;
		border-bottom: 1px solid #e5e5e5;
		background: white;
	}

	.tab-button {
		flex: 1;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.75rem;
		font-style: italic;
		color: #999;
		transition: all 0.2s ease;
		padding: 0.5rem 0;
		margin: 0;
		border-right: 1px solid #e5e5e5;
		position: relative;
	}

	.tab-button:last-child {
		border-right: none;
	}

	.tab-button:hover {
		color: #666;
		background: #fafafa;
	}

	.tab-button.active {
		color: #333;
		font-weight: 500;
		background: white;
	}

	.sidebar-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		gap: 1rem;
		overflow-y: auto;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.sidebar-content::-webkit-scrollbar {
		display: none;
	}

	.sidebar-title {
		margin: 0;
		padding: 0;
		font-size: 0.7rem;
		font-weight: 600;
		font-style: italic;
		text-transform: lowercase;
		color: #333;
	}

	.make-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
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
		flex: 1;
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		background: white;
		padding: 0;
	}

	.main-content:has(.split-screen) {
		justify-content: center;
	}

	.pair-container {
		display: flex;
		gap: 1.5rem;
		width: 100%;
		max-width: 1000px;
		height: auto;
		max-height: 80vh;
	}

	.pair-container img {
		flex: 1;
		max-width: 400px;
		height: auto;
		aspect-ratio: 3 / 4;
		object-fit: cover;
		border-radius: 4px;
		background: #f5f5f5;
	}

	.observations-scroll {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0;
		align-items: center;
		padding: 0;
	}

	.observation-card {
		width: min(85vw, 85vh);
		max-height: 95vh;
		display: flex;
		flex-direction: column;
		gap: 0;
		padding: 0;
		background: white;
		border: none;
		border-radius: 0;
		transition: none;
		box-sizing: border-box;
	}

	.observation-card:hover {
		border-color: inherit;
		box-shadow: inherit;
	}

	.observation-card .pair-container {
		margin: 0;
		max-width: 100%;
		width: 100%;
		height: auto;
		max-height: none;
		gap: 0.5rem;
		background: #f9f9f9;
		padding: 0;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.observation-card .pair-container img {
		max-width: none;
		height: auto;
		width: calc(50% - 0.25rem);
		aspect-ratio: 3 / 4;
		object-fit: cover;
		border-radius: 0;
		background: white;
	}

	.card-note {
		margin: 0;
		padding: 1.25rem;
		font-size: 0.85rem;
		color: #999;
		font-style: italic;
		line-height: 1.5;
		width: 100%;
		box-sizing: border-box;
	}

	.card-date {
		margin: 0;
		padding: 0 1.25rem 1.25rem 1.25rem;
		font-size: 0.75rem;
		color: #999;
		font-style: italic;
		width: 100%;
		box-sizing: border-box;
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

	.split-screen {
		display: flex;
		gap: 0.5rem;
		width: 100%;
		height: auto;
		align-items: center;
		justify-content: center;
		background: #f9f9f9;
		max-width: min(85vw, 85vh);
	}

	.split-screen .pair-container {
		width: 100%;
		height: auto;
		gap: 0.5rem;
		max-height: none;
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: transparent;
	}

	.split-screen .image-wrapper {
		width: calc(50% - 0.25rem);
		height: auto;
		max-width: none;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.split-screen .image-wrapper img {
		width: 100%;
		height: auto;
		object-fit: cover;
		aspect-ratio: 3 / 4;
		border-radius: 0;
		background: white;
	}

	.empty-pair-state {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: #999;
		font-style: italic;
		font-size: 0.9rem;
	}

	.empty-pair-state p {
		margin: 0;
	}
</style>
