<script lang="ts">
	import { onMount } from 'svelte';

	let dailyImage: any = null;
	let loading = true;
	let currentDate = '';

	// Format date as "Month Day, Year"
	function formatDate(date: Date): string {
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		return date.toLocaleDateString('en-US', options);
	}

	// Get a deterministic daily seed based on today's date
	function getDailySeed(): number {
		const today = new Date();
		const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
		
		// Simple hash function to convert date string to a number
		let hash = 0;
		for (let i = 0; i < dateString.length; i++) {
			const char = dateString.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}

	async function loadDailyImage() {
		try {
			const response = await fetch('/metadata.json');
			const metadata = await response.json();
			
			if (metadata && metadata.length > 0) {
				const seed = getDailySeed();
				const index = seed % metadata.length;
				dailyImage = metadata[index];
			}
		} catch (error) {
			console.error('Error loading metadata:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		currentDate = formatDate(new Date());
		loadDailyImage();
	});
</script>

<div class="prompt-page">
	<div class="prompt-header">
		<p>Your prompt for <span>{currentDate}</span></p>
	</div>
	{#if loading}
		<div class="loading">loading...</div>
	{:else if dailyImage}
		<div class="image-container">
			<img
				src="/thumbnails/{dailyImage.filename}.jpg"
				alt={dailyImage.filename}
			/>
		</div>
	{:else}
		<div class="error">no image available</div>
	{/if}
</div>

<style>
	.prompt-page {
		width: 100%;
		min-height: calc(100vh - 200px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: white;
		gap: 2rem;
		padding-top: 2rem;
	}

	.prompt-header {
		font-family: Georgia, serif;
		font-size: 1rem;
		color: #333;
		text-align: center;
		font-style: italic;
	}

	.prompt-header span {
		font-weight: bold;
	}

	.image-container {
		width: min(70vw, 70vh);
		height: min(70vw, 70vh);
		min-height: 70vh;
		aspect-ratio: 3 / 4;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.image-container img {
		max-width: 100%;
		max-height: 100%;
		object-fit: cover;
	}

	.loading,
	.error {
		font-family: Georgia, serif;
		font-size: 1rem;
		color: #666;
	}
</style>
