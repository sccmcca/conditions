<script lang="ts">
	import {
		metadataStore,
		filteredImages
	} from '$lib/stores/metadata';
	import MapThumbnails from '$lib/components/MapThumbnails.svelte';

	export let data;

	// Load metadata on mount
	$: if (data?.images) {
		metadataStore.loadData(data);
	}
</script>

<main>
	<MapThumbnails filteredImages={$filteredImages} />
</main>

<style>
	main {
		width: 100%;
		height: calc(100vh - 4rem);
		padding-top: 4rem;
		margin: 0;
		padding: 0;
	}
</style>
