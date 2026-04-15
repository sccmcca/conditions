<script lang="ts">
	export let data;

	const network = data.network;
	const width = 1080;
	const height = 760;
	const padding = 64;
	const maxEdge = network.edges.length ? Math.max(...network.edges.map((edge: any) => edge.weight)) : 1;

	const colorByCategory: Record<string, string> = {
		material: '#1f6feb',
		tectonic: '#0d7b4f',
		interaction: '#8f4a00',
		phenomena: '#7a3db8',
		mixed: '#5b5b5b'
	};

	let hoveredNode: string | null = null;
	let svgElement: SVGSVGElement | null = null;
	let zoom = 1;
	let panX = 0;
	let panY = 0;
	let isPanning = false;
	let panStart = { x: 0, y: 0, panX: 0, panY: 0 };

	function hashString(value: string) {
		let hash = 2166136261;
		for (let i = 0; i < value.length; i += 1) {
			hash ^= value.charCodeAt(i);
			hash = Math.imul(hash, 16777619);
		}
		return hash >>> 0;
	}

	function makeRng(seedValue: string) {
		let seed = hashString(seedValue) || 1;
		return () => {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
			return seed / 4294967296;
		};
	}

	function curvePath(source: any, target: any, seed: string) {
		const mx = (source.x + target.x) / 2;
		const my = (source.y + target.y) / 2;
		const dx = target.x - source.x;
		const dy = target.y - source.y;
		const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
		const nx = -dy / len;
		const ny = dx / len;
		const bendSign = hashString(seed) % 2 === 0 ? 1 : -1;
		const bend = Math.min(46, Math.max(10, len * 0.08)) * bendSign;
		const cx2 = mx + nx * bend;
		const cy2 = my + ny * bend;
		return `M ${source.x} ${source.y} Q ${cx2} ${cy2} ${target.x} ${target.y}`;
	}

	function buildForceLayout(nodes: any[], edges: any[]) {
		if (!nodes.length) return [];

		const rng = makeRng(JSON.stringify(nodes.map((node) => [node.id, node.count])));
		const laidOut = nodes.map((node) => ({
			...node,
			fontSize: Math.max(9, Math.min(19, 9 + Math.log2(Math.max(1, node.count)) * 2.2)),
			x: padding + rng() * (width - padding * 2),
			y: padding + rng() * (height - padding * 2),
			vx: 0,
			vy: 0
		}));

		const idToIndex = new Map(laidOut.map((node, i) => [node.id, i]));
		const edgePairs = edges
			.map((edge) => ({
				source: idToIndex.get(edge.source),
				target: idToIndex.get(edge.target),
				weight: edge.weight
			}))
			.filter((edge) => edge.source !== undefined && edge.target !== undefined);

		const iterations = 260;
		const repulsion = 1500;
		const centerPull = 0.0009;
		const damping = 0.84;

		for (let step = 0; step < iterations; step += 1) {
			for (let i = 0; i < laidOut.length; i += 1) {
				for (let j = i + 1; j < laidOut.length; j += 1) {
					const a = laidOut[i];
					const b = laidOut[j];
					const dx = b.x - a.x;
					const dy = b.y - a.y;
					const d2 = dx * dx + dy * dy + 0.05;
					const d = Math.sqrt(d2);
					const force = repulsion / d2;
					const fx = (force * dx) / d;
					const fy = (force * dy) / d;

					a.vx -= fx;
					a.vy -= fy;
					b.vx += fx;
					b.vy += fy;
				}
			}

			for (const edge of edgePairs) {
				const source = laidOut[edge.source as number];
				const target = laidOut[edge.target as number];
				const dx = target.x - source.x;
				const dy = target.y - source.y;
				const d = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
				const ideal = 62 + (1 - Math.min(1, edge.weight / maxEdge)) * 60;
				const spring = (edge.weight / maxEdge) * 0.011;
				const force = (d - ideal) * spring;
				const fx = (force * dx) / d;
				const fy = (force * dy) / d;

				source.vx += fx;
				source.vy += fy;
				target.vx -= fx;
				target.vy -= fy;
			}

			for (const node of laidOut) {
				node.vx += (width / 2 - node.x) * centerPull;
				node.vy += (height / 2 - node.y) * centerPull;
				node.vx *= damping;
				node.vy *= damping;
				node.x = Math.max(padding, Math.min(width - padding, node.x + node.vx));
				node.y = Math.max(padding, Math.min(height - padding, node.y + node.vy));
			}
		}

		return laidOut;
	}

	const positionedNodes = buildForceLayout(network.nodes, network.edges);
	const nodeMap = new Map(positionedNodes.map((node: any) => [node.id, node]));
	const maxOpacity = network.edges.length ? Math.max(...network.edges.map((edge: any) => edge.weight)) : 1;

	$: positionedEdges = network.edges
		.map((edge: any) => {
			const source = nodeMap.get(edge.source);
			const target = nodeMap.get(edge.target);
			if (!source || !target) return null;

			const isHovered = hoveredNode !== null && (edge.source === hoveredNode || edge.target === hoveredNode);
			const isDimmed = hoveredNode !== null && !isHovered;

			return {
				key: `${edge.source}|${edge.target}`,
				source: edge.source,
				target: edge.target,
				d: curvePath(source, target, `${edge.source}|${edge.target}`),
				opacity: hoveredNode === null ? 0.1 + (edge.weight / maxOpacity) * 0.65 : isDimmed ? 0.025 : 0.18 + (edge.weight / maxOpacity) * 0.82,
				stroke: isHovered ? '#111' : '#444',
				width: 1 + (edge.weight / maxOpacity) * 2.2
			};
		})
		.filter(Boolean) as any[];

	function setHoveredNode(nodeId: string | null) {
		hoveredNode = nodeId;
	}

	function getSvgPoint(event: PointerEvent | WheelEvent) {
		if (!svgElement) return { x: 0, y: 0, width: 1, height: 1 };
		const bounds = svgElement.getBoundingClientRect();
		return {
			x: ((event.clientX - bounds.left) / bounds.width) * width,
			y: ((event.clientY - bounds.top) / bounds.height) * height,
			width: bounds.width,
			height: bounds.height
		};
	}

	function zoomAtPoint(event: WheelEvent) {
		event.preventDefault();
		const point = getSvgPoint(event);
		const zoomDelta = Math.exp(-event.deltaY * 0.0015);
		const nextZoom = Math.min(3.5, Math.max(0.6, zoom * zoomDelta));
		const worldX = (point.x - panX) / zoom;
		const worldY = (point.y - panY) / zoom;
		panX = point.x - worldX * nextZoom;
		panY = point.y - worldY * nextZoom;
		zoom = nextZoom;
	}

	function startPan(event: PointerEvent) {
		if (event.button !== 0) return;
		if (!svgElement) return;

		event.preventDefault();
		const point = getSvgPoint(event);
		isPanning = true;
		panStart = { x: point.x, y: point.y, panX, panY };

		const handleMove = (moveEvent: PointerEvent) => {
			if (!svgElement) return;
			const movePoint = getSvgPoint(moveEvent);
			panX = panStart.panX + (movePoint.x - panStart.x);
			panY = panStart.panY + (movePoint.y - panStart.y);
		};

		const handleUp = () => {
			isPanning = false;
			window.removeEventListener('pointermove', handleMove);
			window.removeEventListener('pointerup', handleUp);
		};

		window.addEventListener('pointermove', handleMove);
		window.addEventListener('pointerup', handleUp);
	}

	function resetView() {
		zoom = 1;
		panX = 0;
		panY = 0;
	}
</script>

<svelte:head>
	<title>2D Network</title>
</svelte:head>

<main class="relationships-page">
	<section class="intro">
		<h2>tag co-occurrence network, 2d</h2>
		<p>
			flat version of the network built from material, tectonic, interaction, and phenomena.
			edge thickness reflects number of connections.
		</p>
		<p>
			showing top {network.params.top} tags, min edge weight {network.params.minEdge}, clustering threshold {network.params.clusterEdge}.
		</p>
		<p>
			use the mouse wheel or trackpad to zoom and drag the empty space to pan. double-click to reset.
		</p>
	</section>

	<section class="network-wrap">
		<svg
			bind:this={svgElement}
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="2D tag network"
			on:wheel={zoomAtPoint}
			on:pointerdown={startPan}
			on:dblclick={resetView}
			class:is-panning={isPanning}
		>
			<rect x="0" y="0" width={width} height={height} fill="transparent" />
			<g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
				{#each positionedEdges as edge (edge.key)}
					<path
						d={edge.d}
						stroke={edge.stroke}
						stroke-opacity={0.02 + edge.opacity * 0.58}
						stroke-width="0.7"
						fill="none"
						vector-effect="non-scaling-stroke"
					/>
				{/each}

				{#each positionedNodes as node (node.id)}
					<text
						x={node.x}
						y={node.y}
						text-anchor="middle"
						dominant-baseline="middle"
						role="img"
						aria-label={`${node.id} (${node.count})`}
						fill={colorByCategory[node.category] ?? colorByCategory.mixed}
						style={`font-size:${Math.max(7, Math.min(16, node.fontSize * 0.72))}px`}
						on:mouseenter={() => setHoveredNode(node.id)}
						on:mouseleave={() => setHoveredNode(null)}
					>
						{node.id} ({node.count})
					</text>
				{/each}
			</g>
		</svg>
	</section>

	<section class="legend">
		<div><span class="chip material"></span>material</div>
		<div><span class="chip tectonic"></span>tectonic</div>
		<div><span class="chip interaction"></span>interaction</div>
		<div><span class="chip phenomena"></span>phenomena</div>
		<div><span class="chip mixed"></span>mixed</div>
	</section>
</main>

<style>
	.relationships-page {
		max-width: 100%;
		margin: 0 auto;
		padding: 1.25rem 0.75rem 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.intro h2 {
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
		overflow: hidden;
		cursor: grab;
		user-select: none;
	}

	.network-wrap:active,
	svg.is-panning {
		cursor: grabbing;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		max-width: 100%;
	}

	text {
		font-family: Times, 'Times New Roman', serif;
		font-style: italic;
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
	.chip.tectonic { background: #0d7b4f; }
	.chip.interaction { background: #8f4a00; }
	.chip.phenomena { background: #7a3db8; }
	.chip.mixed { background: #5b5b5b; }
</style>