<script lang="ts">
	export let data;

	type Category = 'material' | 'tectonic' | 'interaction' | 'phenomena';
	const categories: Category[] = ['material', 'tectonic', 'interaction', 'phenomena'];

	function getImagesForTag(category: Category, tag: string) {
		return data.images.filter((image: any) => Array.isArray(image?.[category]) && image[category].includes(tag));
	}
</script>

<svelte:head>
	<title>Category Tags</title>
</svelte:head>

<main class="category-page">
	<div class="page-intro">
		<p>Category tags grouped by material, tectonic, interaction, and phenomena.</p>
	</div>

	<div class="category-list">
		{#each categories as category}
			<section class="category-section">
				<h2>{category}</h2>
				<div class="tag-rows">
					{#each data.filterOptions[category] as tag}
						<div class="tag-row">
							<div class="tag-label">{tag}</div>
							<div class="tag-images">
								{#each getImagesForTag(category, tag) as image (image.filename)}
									<div class="tag-image">
										<img src={image.thumbnail} alt="" />
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</main>

<style>
	.category-page {
		padding: 2rem 1rem 3rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-intro {
		width: min(720px, 100%);
		margin: 0 auto 2rem;
		font-size: 0.95rem;
		line-height: 1.5;
		color: #444;
		font-style: italic;
	}

	.category-list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.category-section {
		border-top: 1px solid #e5e5e5;
		padding-top: 1rem;
	}

	.category-section h2 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		font-style: italic;
		font-weight: 500;
		text-transform: lowercase;
	}

	.tag-rows {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.tag-row {
		display: grid;
		grid-template-columns: 180px 1fr;
		gap: 1rem;
		align-items: start;
		padding-bottom: 1rem;
		border-bottom: 1px solid #f2f2f2;
	}

	.tag-label {
		font-size: 0.9rem;
		font-style: italic;
		color: #222;
		text-transform: lowercase;
	}

	.tag-images {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.tag-image {
		width: 110px;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.tag-image img {
		width: 100%;
		aspect-ratio: 3 / 4;
		object-fit: cover;
		display: block;
		background: #f8f8f8;
	}

	@media (max-width: 760px) {
		.tag-row {
			grid-template-columns: 1fr;
		}

		.tag-image {
			width: 92px;
		}
	}
</style>