<script lang="ts">
	export let data;

	const images = data.images;
</script>

<svelte:head>
	<title>Diptych Scroll</title>
</svelte:head>

<main>
	<div class="split-container">
		<div class="column left-column">
			{#each images as image, index (image.filename)}
				<div class="image-item">
					<img src={image.thumbnail} alt={image.filename} title={image.filename} />
				</div>
			{/each}
		</div>

		<div class="divider"></div>

		<div class="column right-column">
			{#each [...images].reverse() as image, index (image.filename)}
				<div class="image-item">
					<img src={image.thumbnail} alt={image.filename} title={image.filename} />
				</div>
			{/each}
		</div>
	</div>
</main>

<style>
	main {
		width: 100%;
		height: 100vh;
		overflow: hidden;
		padding: 0;
		margin: 0;
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
</style>
