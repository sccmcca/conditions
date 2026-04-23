<script lang="ts">
	import { onMount } from 'svelte';
	import { observations } from '$lib/stores/observations';

	export let data;

	const images = data.images;
	let activeTab: 'make' | 'see' = 'see';
	let expandedObsId: string | null = null;
	let sidebarCollapsed = false;
	
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

	function getCurrentIndex() {
		return $observations.findIndex(obs => obs.id === expandedObsId);
	}

	function goToPrevious() {
		const currentIndex = getCurrentIndex();
		if (currentIndex > 0) {
			expandedObsId = $observations[currentIndex - 1].id;
		}
	}

	function goToNext() {
		const currentIndex = getCurrentIndex();
		if (currentIndex < $observations.length - 1) {
			expandedObsId = $observations[currentIndex + 1].id;
		}
	}

	function handleObservationClick(obsId: string) {
		// Disable expand on mobile
		if (window.innerWidth < 769) return;
		expandedObsId = obsId;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!expandedObsId) return;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			goToPrevious();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			goToNext();
		}
	}

	onMount(() => {
		observations.init();
		refreshBoth();
		
		// Set sidebar collapsed state based on screen size
		const isMobile = window.innerWidth < 769;
		sidebarCollapsed = isMobile;
		
		// Ensure sidebar stays expanded on desktop when resizing
		const handleResize = () => {
			if (window.innerWidth >= 769) {
				sidebarCollapsed = false;
			}
		};
		
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<svelte:head>
	<title>Conditions of Observation</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<main>
	<div class="sidebar" class:collapsed={sidebarCollapsed}>
		<div class="sidebar-header">
			<div class="header-top">
				<h1 class="sidebar-title">Diptychs</h1>
				<button class="toggle-btn" on:click={() => (sidebarCollapsed = !sidebarCollapsed)} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
				<span class="toggle-chevron" class:expanded={!sidebarCollapsed}>›</span>
				</button>
			</div>
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

		{#if !sidebarCollapsed}
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
		{/if}
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
							<img src={obs.leftImage.thumbnail} alt={obs.leftImage.filename} title={obs.leftImage.filename} />
							<img src={obs.rightImage.thumbnail} alt={obs.rightImage.filename} title={obs.rightImage.filename} />
						</div>
						<p class="card-note">{obs.note}</p>
						<p class="card-date">{formatDate(obs.timestamp)}</p>
					</div>
				{/each}
			</div>
		{/if}

		{#if expandedObsId}
			{@const expandedObs = $observations.find(obs => obs.id === expandedObsId)}
			{@const currentIndex = getCurrentIndex()}
			{@const canGoPrev = currentIndex > 0}
			{@const canGoNext = currentIndex < $observations.length - 1}
			{#if expandedObs}
				<div class="expanded-overlay" on:click={() => expandedObsId = null}>
					<button class="nav-btn prev-btn" on:click={(e) => { e.stopPropagation(); goToPrevious(); }} disabled={!canGoPrev} title="Previous (←)" aria-label="Previous observation">‹</button>
					<div class="expanded-content" on:click={(e) => e.stopPropagation()}>
						<div class="expanded-pair">
							<div class="expanded-image-wrapper">
								<img src={expandedObs.leftImage.thumbnail} alt={expandedObs.leftImage.filename} title={expandedObs.leftImage.filename} />
							</div>
							<div class="expanded-image-wrapper">
								<img src={expandedObs.rightImage.thumbnail} alt={expandedObs.rightImage.filename} title={expandedObs.rightImage.filename} />
							</div>
						</div>
						<div class="carousel-counter">{currentIndex + 1} / {$observations.length}</div>
					</div>
					<button class="nav-btn next-btn" on:click={(e) => { e.stopPropagation(); goToNext(); }} disabled={!canGoNext} title="Next (→)" aria-label="Next observation">›</button>
				</div>
			{/if}
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
		font-family: Georgia, serif;
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
		font-family: Georgia, serif;
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
		font-family: Georgia, serif;
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
		font-family: Georgia, serif;
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
		font-family: Georgia, serif;
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
		font-family: Georgia, serif;
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

	.header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 0.5rem;
	}

	.toggle-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin: 0;
		margin-right: 0.5rem;
		font-family: inherit;
	}

	.toggle-chevron {
		display: inline-block;
		font-size: 1.2rem;
		transition: transform 0.2s ease;
		color: #666;
	}

	.toggle-chevron.expanded {
		transform: rotate(90deg);
	}

	.sidebar.collapsed {
		width: auto;
		aspect-ratio: auto;
		max-height: auto;
	}

	.sidebar.collapsed .sidebar-header {
		padding: 0.5rem;
		border-bottom: none;
	}

	@media (min-width: 769px) {
		.toggle-btn {
			display: none;
		}

		.sidebar-divider,
		.sidebar-content {
			display: flex !important;
		}
	}

	.main-content {
		display: none;
	}

	.observations-container {
		display: flex;
		flex-direction: column;
		gap: 6.5rem;
		align-items: center;
		justify-content: flex-start;
		background: white;
		width: calc(min(42.5vw, 42.5vh) * 2 + 1.5rem);
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 0;
		padding-top: calc((100vh - 4rem - min(56.67vw, 56.67vh)) / 2 - 1rem);
		padding-bottom: calc((100vh - 4rem - min(56.67vw, 56.67vh)) / 2 - 4rem);
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
		padding: 1rem;
		background: transparent;
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
		font-family: Georgia, serif;
		line-height: 1.4;
		text-align: center;
		max-width: calc(min(42.5vw, 42.5vh) * 2 + 1.5rem);
	}

	.card-date {
		margin: 0;
		font-size: 0.65rem;
		color: #999;
		font-style: italic;
		font-family: Georgia, serif;
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

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		cursor: pointer;
	}

	.modal-content {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		cursor: default;
	}

	.expanded-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
	}

	.expanded-pair {
		display: flex;
		gap: 2rem;
		align-items: center;
		justify-content: center;
		background: white;
		padding: 2rem;
	}

	.expanded-pair img {
		height: 50vh;
		aspect-ratio: 3 / 4;
		object-fit: cover;
		background: white;
	}

	.expanded-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
		text-align: center;
		color: white;
	}

	.expanded-note {
		margin: 0;
		font-size: 1rem;
		font-style: italic;
		font-family: Georgia, serif;
		line-height: 1.5;
		max-width: 600px;
	}

	.expanded-date {
		margin: 0;
		font-size: 0.8rem;
		font-style: italic;
		font-family: Georgia, serif;
		color: #ccc;
	}

	.expanded-counter {
		margin: 0;
		font-size: 0.75rem;
		font-style: italic;
		font-family: Georgia, serif;
		color: #999;
	}

	.nav-btn {
		position: absolute;
		background: none;
		border: none;
		color: white;
		font-size: 4rem;
		cursor: pointer;
		padding: 2rem;
		transition: opacity 0.2s ease;
		z-index: 101;
		opacity: 0.6;
		top: 50%;
		transform: translateY(-50%);
	}

	.nav-btn:hover:not(:disabled) {
		opacity: 1;
	}

	.nav-btn:disabled {
		opacity: 0.2;
		cursor: not-allowed;
	}

	.prev-btn {
		left: 2rem;
	}

	.next-btn {
		right: 2rem;
	}

	@media (max-width: 768px) {
		main {
			flex-direction: column;
			padding: 1rem;
			padding-bottom: 32dvh;
			padding-top: 0;
			height: auto;
			min-height: calc(100dvh - 4rem);
			gap: 0;
			align-items: stretch;
			justify-content: flex-start;
			overflow: hidden;
		}

		.sidebar {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			height: auto;
			max-height: 40dvh;
			aspect-ratio: auto;
			z-index: 10;
			border-top: 1px solid #e5e5e5;
			background: white;
			overflow-y: auto;
			flex: none;
			padding-bottom: 4rem;
			box-sizing: border-box;
		}

		.observations-container {
			width: 100%;
			gap: 2rem;
			padding: 2rem 0;
			padding-bottom: 32dvh;
			flex: 1;
			overflow-y: auto;
			margin: 0;
		}

		.observation-card {
			padding: 0.5rem 0;
		}

		.pair-container {
			width: 100%;
			height: auto;
			background: white;
			margin-bottom: 0.5rem;
		}

		.pair-container img {
			flex: 1;
			height: auto;
			max-height: 40vh;
		}

		.card-note {
			font-size: 0.7rem;
			max-width: 100%;
		}

		.card-date {
			font-size: 0.6rem;
		}

		.expanded-pair img {
			height: 50vh;
		}

		.expanded-pair {
			flex-direction: column;
		}

		.expanded-content {
			max-height: 300px;
		}

		.nav-btn {
			font-size: 2rem;
			padding: 1rem;
		}

		.prev-btn {
			left: 1rem;
		}

		.next-btn {
			right: 1rem;
		}

		.image-pair-wrapper {
			width: 100%;
			height: auto;
			gap: 1.5rem;
			background: white;
			padding: 2.5rem 0.5rem 1rem 0.5rem;
			box-sizing: border-box;
			flex: 1;
			overflow-y: auto;
		}

		.image-pair-wrapper .image-wrapper {
			width: 50%;
			height: auto;
			max-height: 60vh;
		}

		.image-pair-wrapper .image-wrapper img {
			width: 100%;
			height: auto;
			max-height: 60vh;
			aspect-ratio: 3 / 4;
			object-fit: cover;
		}
	}

	.observation-card {
		cursor: pointer;
	}

	.expanded-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: stretch;
		justify-content: center;
		padding: 2rem 0;
		box-sizing: border-box;
		z-index: 3000;
	}

	.expanded-content {
		position: relative;
		max-width: 90%;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 1rem;
		overflow-y: auto;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.expanded-content::-webkit-scrollbar {
		display: none;
	}

	.expanded-pair {
		display: flex;
		gap: 3rem;
		align-items: center;
		justify-content: center;
		background: white;
		padding: 2rem;
		flex: 1;
	}

	.expanded-image-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.expanded-image-wrapper img {
		width: min(50vw, 50vh);
		height: auto;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}

	.expanded-info {
		text-align: center;
		max-width: 80vw;
	}

	.expanded-note {
		margin: 0;
		font-size: 0.95rem;
		font-style: italic;
	}

	.expanded-date {
		margin: 0.5rem 0 0 0;
		font-size: 0.8rem;
		color: #666;
	}

	.carousel-counter {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
		font-style: italic;
		font-family: Georgia, serif;
		text-align: center;
	}
</style>
