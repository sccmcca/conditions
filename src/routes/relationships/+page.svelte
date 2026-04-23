<script lang="ts">
	export let data;

	const network = data.network;
	const width = 1080;
	const height = 760;
	const cx = width / 2;
	const cy = height / 2;
	const radius = Math.min(width, height) * 0.38;

	const colorByCategory: Record<string, string> = {
		material: '#1f6feb',
		element: '#0d7b4f',
		form: '#2d9d6f',
		interaction: '#8f4a00',
		phenomena: '#7a3db8',
		mixed: '#5b5b5b'
	};

	const positionedNodes = network.nodes.map((node: any, i: number) => {
		const angle = (i / Math.max(1, network.nodes.length)) * Math.PI * 2 - Math.PI / 2;
		return {
			...node,
			x: cx + radius * Math.cos(angle),
			y: cy + radius * Math.sin(angle),
			r: Math.max(4, Math.min(16, 4 + Math.log2(Math.max(1, node.count)) * 2.5))
		};
	});

	const nodePos = new Map(positionedNodes.map((node: any) => [node.id, node]));
	const maxEdge = network.edges.length ? Math.max(...network.edges.map((edge: any) => edge.weight)) : 1;
</script>

<svelte:head>
	<title>Tag Relationships</title>
</svelte:head>

<main class="relationships-page">
	<section class="intro">
		<h2>tag co-occurrence network</h2>
		<p>
			built from material, element, form, interaction, and phenomena in metadata.json.
			edges connect tags that appear on the same image.
		</p>
		<p>
			showing top {network.params.top} tags, min edge weight {network.params.minEdge}, clustering threshold {network.params.clusterEdge}.
		</p>
	</section>

	<section class="network-wrap">
		<svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tag co-occurrence network">
			{#each network.edges as edge}
				{@const source = nodePos.get(edge.source)}
				{@const target = nodePos.get(edge.target)}
				{#if source && target}
					<line
						x1={source.x}
						y1={source.y}
						x2={target.x}
						y2={target.y}
						stroke="#b0b0b0"
						stroke-opacity={0.12 + (edge.weight / maxEdge) * 0.45}
						stroke-width={0.6 + (edge.weight / maxEdge) * 3}
					/>
				{/if}
			{/each}

			{#each positionedNodes as node}
				<g transform={`translate(${node.x}, ${node.y})`}>
					<circle r={node.r} fill={colorByCategory[node.category] ?? colorByCategory.mixed} fill-opacity="0.9" />
					<text y={-node.r - 6} text-anchor="middle">{node.id}</text>
				</g>
			{/each}
		</svg>
	</section>

	<section class="legend">
		<div><span class="chip material"></span>material</div>
		<div><span class="chip element"></span>element</div>
		<div><span class="chip form"></span>form</div>
		<div><span class="chip interaction"></span>interaction</div>
		<div><span class="chip phenomena"></span>phenomena</div>
		<div><span class="chip mixed"></span>mixed</div>
	</section>

	<section class="clusters">
		<h3>clusters</h3>
		{#each network.clusters as cluster}
			<div class="cluster-item">
				<div class="cluster-title">cluster {cluster.cluster} ({cluster.size})</div>
				<p>{cluster.nodes.map((n: any) => `${n.id} (${n.count})`).join(', ')}</p>
			</div>
		{/each}
	</section>
</main>

<style>
	.relationships-page {
		max-width: 1180px;
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.intro h2,
	.clusters h3 {
		margin: 0;
		font-size: 1.15rem;
		font-style: italic;
		font-weight: 500;
		text-transform: lowercase;
	}

	.intro p {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		font-style: italic;
		color: #444;
	}

	.network-wrap {
		border: 1px solid #e5e5e5;
		background: #fff;
		overflow-x: auto;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		min-width: 900px;
	}

	text {
		font-family: Times, 'Times New Roman', serif;
		font-style: italic;
		font-size: 11px;
		fill: #2d2d2d;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.82rem;
		font-style: italic;
	}

	.legend div {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.chip {
		width: 10px;
		height: 10px;
		display: inline-block;
		border-radius: 999px;
	}

	.chip.material { background: #1f6feb; }
	.chip.element { background: #0d7b4f; }
	.chip.form { background: #2d9d6f; }
	.chip.interaction { background: #8f4a00; }
	.chip.phenomena { background: #7a3db8; }
	.chip.mixed { background: #5b5b5b; }

	.clusters {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding-bottom: 2rem;
	}

	.cluster-item {
		border-top: 1px solid #ececec;
		padding-top: 0.45rem;
	}

	.cluster-title {
		font-size: 0.86rem;
		font-style: italic;
		color: #333;
	}

	.cluster-item p {
		margin: 0.3rem 0 0;
		font-size: 0.82rem;
		line-height: 1.35;
		color: #555;
	}
</style>