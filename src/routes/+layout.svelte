<script lang="ts">
	import { page } from '$app/stores';
	import favicon from "$lib/assets/favicon.svg";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="layout">
	<header>
		<h1>Conditions of Observation</h1>
		<!-- <p>photographic research method</p> -->
	</header>

	<main>
		{@render children?.()}
	</main>

	<footer>
		{#if $page.url.pathname === '/info'}
			<a href="/">gallery</a>
		{:else}
			<a href="/info">info</a>
		{/if}
		<a href="https://www.instagram.com/slow.practice/" target="_blank" rel="noopener noreferrer">
			@slow.practice
		</a>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
	}

	.layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		background-color: white;
		border-bottom: 1px solid #e0e0e0;
		font-style: italic;
		z-index: 10;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 500;
	}

	p {
		margin: 0;
	}

	main {
		flex: 1;
		padding-top: 4rem;
		padding-bottom: 2rem;
	}

	footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: white;
		border-top: 1px solid #e0e0e0;
		font-style: italic;
		height: 10px;
	}

	a {
		color: inherit;
		text-decoration: none;
		transition: filter 0s ease;
	}

	a:hover {
		/* filter: blur(2px); */
		text-decoration: underline;
	}
</style>
