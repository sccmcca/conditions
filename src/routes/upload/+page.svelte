<script lang="ts">
	// Replace with your real Tally form URL when ready.
	const tallyFormUrl = 'https://tally.so/r/obVJ91';
</script>

<iframe
	title="Tally upload form"
	src={tallyFormUrl}
	loading="lazy"
	referrerpolicy="strict-origin-when-cross-origin"
	allow="clipboard-read; clipboard-write"
></iframe>

<style>
	:global(body) {
		margin: 0;
	}

	iframe {
		display: block;
		width: 100%;
		height: calc(100vh - 4rem - 60px);
		border: none;
	}
</style>
