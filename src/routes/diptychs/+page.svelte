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

	// See tab state
	let expandedId: string | null = null;
	let viewMode: 'grid' | 'list' = 'list';

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

	function toggleExpanded(id: string) {
		expandedId = expandedId === id ? null : id;
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

	{#if activeTab === 'see'}
		<div class="tab-content see-tab">
			{#if $observations.length === 0}
				<div class="empty-state">
					<p>no observations yet</p>
					<p>switch to <strong>make</strong> to make some</p>
				</div>
			{:else}
				<div class="view-toggle">
					<button
						type="button"
						class="toggle-btn"
						class:active={viewMode === 'grid'}
						on:click={() => (viewMode = 'grid')}
					>
						grid
					</button>
					<button
						type="button"
						class="toggle-btn"
						class:active={viewMode === 'list'}
						on:click={() => (viewMode = 'list')}
					>
						list
					</button>
				</div>

				<div class="observations-grid" class:list-view={viewMode === 'list'}>
					{#each $observations as obs (obs.id)}
						<div class="observation-card">
							<div
								class="image-pair"
								on:click={() => toggleExpanded(obs.id)}
								role="button"
								tabindex="0"
							>
								<div class="image-item">
									<img src={obs.leftImage.thumbnail} alt={obs.leftImage.filename} />
								</div>
								<div class="image-item">
									<img src={obs.rightImage.thumbnail} alt={obs.rightImage.filename} />
								</div>
							</div>
							<div class="observation-content">
								<p class="observation-note">{obs.note}</p>
								<p class="observation-timestamp">{formatDate(obs.timestamp)}</p>
							</div>
						</div>
					{/each}
				</div>

				{#if expandedId}
					<div class="modal-overlay" on:click={() => (expandedId = null)} role="button" tabindex="0">
						<div class="modal-content" on:click={(e) => e.stopPropagation()}>
							{#each $observations as obs (obs.id)}
								{#if obs.id === expandedId}
									<div class="expanded-container">
										<div class="expanded-pair">
											<img src={obs.leftImage.thumbnail} alt={obs.leftImage.filename} />
											<img src={obs.rightImage.thumbnail} alt={obs.rightImage.filename} />
										</div>
										<p class="expanded-note">{obs.note}</p>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	{:else}
		<div class="tab-content make-tab">
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
		</div>
	{/if}
</main>

<style>
	main {
		width: 100%;
		height: calc(100vh - 4rem);
		display: flex;
		flex-direction: column;
		padding: 0;
		margin: 0;
		overflow: hidden;
	}

	.tabs-header {
		display: flex;
		gap: 2rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e5e5;
		background: white;
		z-index: 10;
	}

	.tab-button {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-style: italic;
		color: #999;
		transition: color 0.2s ease;
		padding: 0.25rem 0;
		margin: 0;
		position: relative;
	}

	.tab-button:hover {
		color: #666;
	}

	.tab-button.active {
		color: #333;
		font-weight: 500;
	}

	.tab-button.active::after {
		content: '';
		position: absolute;
		bottom: -1rem;
		left: 0;
		right: 0;
		height: 1px;
		background: #333;
	}

	.tab-content {
		flex: 1;
		overflow: hidden;
		display: flex;
	}

	.make-tab {
		display: flex;
	}

	.see-tab {
		flex-direction: column;
		height: 100%;
		width: 100%;
		padding: 2rem 0 2rem 1rem;
		overflow-y: auto;
	}

	/* Make tab styles */

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
		flex: 1;
		height: 100%;
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

	/* See tab styles */
	.see-tab {
		overflow: hidden;
		flex-direction: column;
		padding: 2rem 0 2rem 1rem;
	}

	.view-toggle {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
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

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		color: #666;
	}

	.empty-state p {
		margin: 0.5rem 0;
		font-style: italic;
		font-size: 0.95rem;
	}

	.observations-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-content: flex-start;
		flex: 1;
		overflow-y: auto;
	}

	.observations-grid.list-view {
		flex-direction: column;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: flex-start;
	}

	.observations-grid.list-view .observation-card {
		width: min(85vw, 85vh);
		max-height: 95vh;
	}

	.observation-card {
		background: white;
		display: flex;
		flex-direction: column;
		position: relative;
		width: 300px;
	}

	.image-pair {
		display: flex;
		width: 100%;
		background: #f9f9f9;
		gap: 0.5rem;
		cursor: pointer;
		transition: opacity 0.2s ease;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.image-pair:hover {
		opacity: 0.8;
	}

	.image-item {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		width: calc(50% - 0.25rem);
		height: 200px;
		aspect-ratio: 3 / 4;
	}

	.observations-grid.list-view .image-pair {
		gap: 1rem;
	}

	.observations-grid.list-view .image-item {
		height: auto;
		width: 50vw;
	}

	.image-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: white;
	}

	.observation-content {
		padding: 1.25rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: auto;
		width: 100%;
		box-sizing: border-box;
	}

	.observation-note {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.5;
		color: #999;
		font-style: italic;
	}

	.observation-timestamp {
		margin: 0;
		font-size: 0.75rem;
		color: #999;
		font-style: italic;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		cursor: pointer;
	}

	.modal-content {
		background: white;
		padding: 2rem;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: default;
	}

	.expanded-pair {
		display: flex;
		gap: 1.5rem;
		width: 100%;
	}

	.expanded-pair img {
		max-width: calc(50% - 0.75rem);
		max-height: 70vh;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}

	.expanded-container {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
	}

	.expanded-note {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.5;
		color: #333;
		max-width: 100%;
		font-style: italic;
	}
</style>
