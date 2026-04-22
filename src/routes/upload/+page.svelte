<script lang="ts">
	// Replace with your real Tally form URL when ready.
	const tallyFormUrl = 'https://tally.so/r/your-form-id';
</script>

<section class="upload-page">
	<h2>Upload</h2>
	<p class="intro">Embed your Tally form below by updating the form URL in this page.</p>

	<div class="iframe-shell">
		<iframe
			title="Tally upload form"
			src={tallyFormUrl}
			loading="lazy"
			referrerpolicy="strict-origin-when-cross-origin"
			allow="clipboard-read; clipboard-write"
		></iframe>
	</div>
</section>

<style>
	.upload-page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.3rem;
		font-style: italic;
		font-weight: 500;
	}

	.intro {
		margin: 0 0 1rem;
		font-size: 0.95rem;
		opacity: 0.85;
		font-style: italic;
	}

	.iframe-shell {
		border: 1px solid #e0e0e0;
		background: #fff;
		height: min(78vh, 900px);
		min-height: 560px;
	}

	iframe {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}

	@media (max-width: 700px) {
		.upload-page {
			padding: 1rem 0.75rem 5rem;
		}

		.iframe-shell {
			min-height: 70vh;
			height: 70vh;
		}
	}
</style>
