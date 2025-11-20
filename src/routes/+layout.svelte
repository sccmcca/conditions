<script lang="ts">
	import { page } from "$app/stores";
	import { base } from "$app/paths";
	import favicon from "$lib/assets/favicon.svg";
	import { filters, activeFilters, toggleFilter } from "$lib/stores/filters";

	let { children } = $props();
	
	// Check if we're on the gallery page
	let isGalleryPage = $derived($page.url.pathname === base || $page.url.pathname === `${base}/`);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="layout">
	<header>
		<a href={base || "/"}>
			<h1>Conditions of Observation</h1>
		</a>
		<!-- <p>photographic research method</p> -->
		
		{#if isGalleryPage}
			<!-- filter buttons removed -->
		{/if}
	</header>

	<main>
		{@render children?.()}
	</main>

		<footer>
			<a
				href="https://www.instagram.com/slow.practice/"
				target="_blank"
				rel="noopener noreferrer"
				class="footer-instagram blur"
			>
				@slow.practice
			</a>
		</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: Times, 'Times New Roman', serif;
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

	header a {
		text-decoration: none !important;
		color: inherit;
		transition: filter 0.05s;
		will-change: filter;
		-webkit-backface-visibility: hidden;
		-webkit-transform: translateZ(0);
	}

	header a:hover {
		filter: blur(4px);
		-webkit-filter: blur(4px);
	}

	/* @media (max-width: 499px) {
		header a:hover {
			filter: none;
		}
	} */

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 500;
	}

	p {
		margin: 0;
	}
	
	.filter-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		padding: 1rem 1rem 0;
		max-width: 100%;
	}
	
	.filter-buttons button {
		padding: 0.25rem 0.5rem;
		background: white;
		border: 1px solid #e0e0e0;
		color: #333;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
		font-style: italic;
		opacity: 1;
		transition: opacity 0.1s, filter 0.1s;
	}
	
	.filter-buttons button:hover {
		opacity: 0.7;
	}
	
	.filter-buttons button:not(.active) {
		opacity: 0.3;
		filter: blur(2px);
	}

	main {
		flex: 1;
		padding-top: 4rem;
		padding-bottom: 0 !important;
	}

		footer {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 1rem;
			background-color: white;
			border-top: 1px solid #e0e0e0;
			font-style: italic;
			height: 10px;
			z-index: 100;
		}
			.footer-instagram {
				font-size: 0.9rem;
				font-style: italic;
				text-align: center;
				transition: filter 0.05s;
				will-change: filter;
				-webkit-backface-visibility: hidden;
				-webkit-transform: translateZ(0);
			}
		.footer-instagram:hover {
			filter: blur(4px);
			-webkit-filter: blur(4px);
		}

	a {
		color: inherit;
		text-decoration: none;
		transition: filter 0.05s;
	}

		a:hover {
			/* filter: blur(2px); */
			text-decoration: none;
		}
</style>
