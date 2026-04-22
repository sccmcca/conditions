<script lang="ts">
	import { onMount } from 'svelte';
	import { observations } from '$lib/stores/observations';

	let expandedId: string | null = null;

	function deleteObservation(id: string) {
		if (confirm('Delete this observation?')) {
			observations.remove(id);
		}
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
	});
</script>

<svelte:head>
	<title>Diptych Observations</title>
</svelte:head>

<main>
	{#if $observations.length === 0}
		<div class="empty-state">
			<p>no observations yet</p>
			<p>
				visit <a href="/diptych-random">diptych random</a> to create some
			</p>
		</div>
	{:else}
		<div class="observations-grid">
			{#each $observations as obs (obs.id)}
				<div class="observation-card">
					<div class="image-pair" on:click={() => toggleExpanded(obs.id)} role="button" tabindex="0">
						<div class="image-item">
							<img src={obs.leftImage.thumbnail} alt={obs.leftImage.filename} />
						</div>
						<div class="image-item">
							<img src={obs.rightImage.thumbnail} alt={obs.rightImage.filename} />
						</div>
					</div>
					<div class="observation-content">
						<p class="observation-note">{obs.note}</p>
						<div class="timestamp-delete">
							<p class="observation-timestamp">{formatDate(obs.timestamp)}</p>
							<button class="delete-btn" on:click={() => deleteObservation(obs.id)} title="Delete">
								x
							</button>
						</div>
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
</main>

<style>
	main {
		padding: 2rem 0 2rem 1rem;
		max-width: 100%;
		margin: 0;
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

	.empty-state a {
		color: #333;
		text-decoration: underline;
	}

	.observations-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-content: flex-start;
	}

	.observation-card {
		background: white;
		border: 1px solid #e5e5e5;
		display: flex;
		flex-direction: column;
		position: relative;
		width: 300px;
	}

	.image-pair {
		display: flex;
		width: fit-content;
		background: #f9f9f9;
		gap: 0.5rem;
		cursor: pointer;
		transition: opacity 0.2s ease;
		align-items: center;
		justify-content: center;
	}

	.image-pair:hover {
		opacity: 0.8;
	}

	.observation-card:has(.delete-btn:hover) .image-pair {
		filter: blur(4px);
	}

	.image-item {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		width: 150px;
		height: 200px;
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
		font-size: 0.95rem;
		line-height: 1.5;
		color: #999;
		font-style: italic;
	}

	.observation-timestamp {
		margin: 0;
		font-size: 0.75rem;
		color: #999;
		font-style: italic;
		margin-top: auto;
	}

	.timestamp-delete {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.delete-btn {
		width: auto;
		height: auto;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		color: #999;
		transition: color 0.2s ease;
		padding: 0;
	}

	.delete-btn:hover {
		color: #333;
		background: none;
		border-color: transparent;
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
		max-width: 100%;
	}

	.expanded-pair img {
		max-width: 50%;
		max-height: 70vh;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}

	.expanded-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.expanded-note {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.5;
		color: #999;
		max-width: 100%;
		font-style: italic;
	}
</style>
