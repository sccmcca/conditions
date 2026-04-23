<script lang="ts">
	import { onMount } from 'svelte';

	export let data;

	const network = data.network;
	const width = 1080;
	const height = 760;
	const cx = width / 2;
	const cy = height / 2;
	const cloudRadius = 300;
	const maxEdge = network.edges.length ? Math.max(...network.edges.map((edge: any) => edge.weight)) : 1;

	const colorByCategory: Record<string, string> = {
		material: '#1f6feb',
		tectonic: '#0d7b4f',
		interaction: '#8f4a00',
		phenomena: '#7a3db8',
		mixed: '#5b5b5b'
	};

	let rotX = 0.35;
	let rotY = 0.2;
	let zoom = 820;
	let panX = 0;
	let panY = 0;
	let isDragging = false;
	let lastX = 0;
	let lastY = 0;
	let dragMode: 'pan' | 'rotate' = 'pan';
	let svgElement: SVGSVGElement | null = null;
	let hoveredNode: string | null = null;
	let isPlaying = true;
	let raf = 0;
	let startTime = Date.now();
	let pausedTime = 0;

	let projectedNodes: any[] = [];
	let projectedEdges: any[] = [];

	function hashString(value: string) {
		let hash = 2166136261;
		for (let i = 0; i < value.length; i += 1) {
			hash ^= value.charCodeAt(i);
			hash = Math.imul(hash, 16777619);
		}
		return hash >>> 0;
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
		const bend = Math.min(52, Math.max(8, len * 0.08)) * bendSign;
		const cx2 = mx + nx * bend;
		const cy2 = my + ny * bend;
		return `M ${source.x} ${source.y} Q ${cx2} ${cy2} ${target.x} ${target.y}`;
	}

	const baseNodes = (() => {
		const count = Math.max(1, network.nodes.length);
		const goldenAngle = Math.PI * (3 - Math.sqrt(5));

		return network.nodes.map((node: any, i: number) => {
			const t = count === 1 ? 0.5 : i / (count - 1);
			const y = 1 - t * 2;
			const radial = Math.sqrt(Math.max(0, 1 - y * y));
			const theta = i * goldenAngle;

			return {
				...node,
				x: cloudRadius * Math.cos(theta) * radial,
				y: cloudRadius * y,
				z: cloudRadius * Math.sin(theta) * radial,
				fontSize: Math.max(9, Math.min(19, 9 + Math.log2(Math.max(1, node.count)) * 2.2))
			};
		});
	})();

	function rotateNode(node: any) {
		const cosY = Math.cos(rotY);
		const sinY = Math.sin(rotY);
		const cosX = Math.cos(rotX);
		const sinX = Math.sin(rotX);

		const x1 = node.x * cosY - node.z * sinY;
		const z1 = node.x * sinY + node.z * cosY;
		const y1 = node.y * cosX - z1 * sinX;
		const z2 = node.y * sinX + z1 * cosX;

		return { ...node, xr: x1, yr: y1, zr: z2 };
	}

	function projectNode(node: any) {
		const denom = zoom - node.zr;
		const scale = Math.max(0.18, Math.min(2.8, 700 / Math.max(240, denom)));
		const depth = (node.zr + cloudRadius) / (cloudRadius * 2);
		return {
			...node,
			x: cx + panX + node.xr * scale,
			y: cy + panY + node.yr * scale,
			scale,
			alpha: 0.35 + Math.max(0, Math.min(1, depth)) * 0.65
		};
	}

	function updateProjection() {
		const nodes3d = baseNodes.map(rotateNode).map(projectNode);
		const nodeMap = new Map(nodes3d.map((node: any) => [node.id, node]));
		const connectedNodeIds = new Set<string>();

		if (hoveredNode !== null) {
			connectedNodeIds.add(hoveredNode);
		}

		const edges = network.edges
			.map((edge: any) => {
				const source = nodeMap.get(edge.source);
				const target = nodeMap.get(edge.target);
				if (!source || !target) return null;

				const isHovered = hoveredNode !== null && (edge.source === hoveredNode || edge.target === hoveredNode);
				const isDimmed = hoveredNode !== null && !isHovered;

				if (isHovered) {
					connectedNodeIds.add(edge.source);
					connectedNodeIds.add(edge.target);
				}

				const baseOpacity = 0.1 + (edge.weight / maxEdge) * 0.65;
				const opacity =
					hoveredNode === null
						? baseOpacity
						: isDimmed
							? 0.025
							: 0.5 + (edge.weight / maxEdge) * 0.5;

				return {
					key: `${edge.source}|${edge.target}`,
					d: curvePath(source, target, `${edge.source}|${edge.target}`),
					opacity,
					stroke: isHovered ? '#000' : '#000'
				};
			})
			.filter(Boolean) as any[];

		projectedNodes = nodes3d
			.map((node: any) => {
				const isNodeHovered = hoveredNode === node.id;
				const isNodeConnected = hoveredNode !== null && connectedNodeIds.has(node.id);
				const nodeAlpha =
					hoveredNode === null
						? node.alpha
						: isNodeHovered
							? 1
							: isNodeConnected
								? Math.min(1, node.alpha * 1.08)
								: node.alpha * 0.28;

				return {
					...node,
					displayAlpha: nodeAlpha
				};
			})
			.sort((a: any, b: any) => a.zr - b.zr);
		projectedEdges = edges;
	}

	function setHoveredNode(nodeId: string | null) {
		hoveredNode = nodeId;
		updateProjection();
	}

	function onPointerDown(e: PointerEvent) {
		e.preventDefault();
		isDragging = true;
		lastX = e.clientX;
		lastY = e.clientY;
		dragMode = e.altKey ? 'pan' : 'rotate';
		const svg = e.currentTarget as SVGSVGElement;
		svg.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const dx = e.clientX - lastX;
		const dy = e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;

		if (dragMode === 'pan') {
			const bounds = svgElement?.getBoundingClientRect();
			const sx = bounds ? width / bounds.width : 1;
			const sy = bounds ? height / bounds.height : 1;
			panX += dx * sx;
			panY += dy * sy;
		} else {
			rotY += dx * 0.0045;
			rotX += dy * 0.0038;
			rotX = Math.max(-1.25, Math.min(1.25, rotX));
		}
		updateProjection();
	}

	function onPointerUp() {
		isDragging = false;
	}

	function onWheel(e: WheelEvent) {
		zoom = Math.max(620, Math.min(1200, zoom + e.deltaY * 0.45));
		updateProjection();
	}

	function resetView() {
		rotX = 0.35;
		rotY = 0.2;
		zoom = 820;
		panX = 0;
		panY = 0;
	}

	function togglePlayPause() {
		isPlaying = !isPlaying;
		if (isPlaying) {
			startTime = Date.now() - pausedTime;
			tick();
		} else {
			pausedTime = Date.now() - startTime;
			cancelAnimationFrame(raf);
		}
	}

	let tick: () => void;

	onMount(() => {
		tick = () => {
			if (!isPlaying) return;
			const elapsed = (Date.now() - startTime) / 1000;
			rotY = 0.2 + elapsed * 0.3; // Slow rotation: 0.3 radians per second
			updateProjection();
			raf = requestAnimationFrame(tick);
		};

		updateProjection();
		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);
	});
</script>

<svelte:head>
	<title>Tag Network</title>
</svelte:head>

<main class="relationships-page">
	<section class="intro">
		<h2>tag co-occurrence network</h2>
		<p>
			built from material, tectonic, interaction, and phenomena in metadata.json.
			edges connect tags that appear on the same image.
		</p>
		<p>
			showing top {network.params.top} tags, min edge weight {network.params.minEdge}, clustering threshold {network.params.clusterEdge}.
		</p>
		<p>drag to rotate, option+drag to pan, scroll to zoom.</p>
		<div class="controls">
			<button type="button" class="reset-view" on:click={resetView}>reset view</button>
			<button type="button" class="play-pause-btn" on:click={togglePlayPause} title={isPlaying ? 'pause' : 'play'}>
				{#if isPlaying}| |{:else}›{/if}
			</button>
		</div>
	</section>

	<section class="network-wrap">
		<svg
			bind:this={svgElement}
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="Interactive 3D tag network"
			on:pointerdown={onPointerDown}
			on:pointermove={onPointerMove}
			on:pointerup={onPointerUp}
			on:pointerleave={onPointerUp}
			on:wheel|preventDefault={onWheel}
		>
			{#each projectedEdges as edge (edge.key)}
				<path
					d={edge.d}
					stroke={edge.stroke}
					stroke-opacity={0.02 + edge.opacity * 0.58}
					stroke-width="0.7"
					fill="none"
				/>
			{/each}

			{#each projectedNodes as node (node.id)}
				<text
					x={node.x}
					y={node.y}
					text-anchor="middle"
					dominant-baseline="middle"
					role="img"
					aria-label={`${node.id} (${node.count})`}
					fill={colorByCategory[node.category] ?? colorByCategory.mixed}
					fill-opacity={node.displayAlpha}
					style={`font-size:${Math.max(8, Math.min(22, node.fontSize * node.scale * 0.75))}px`}
					on:mouseenter={() => setHoveredNode(node.id)}
					on:mouseleave={() => setHoveredNode(null)}
				>
					{node.id} ({node.count})
				</text>
			{/each}
		</svg>
	</section>

	<section class="legend">
		<div><span class="chip material"></span>material</div>
		<div><span class="chip tectonic"></span>tectonic</div>
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
		cursor: move;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.network-wrap:active {
		cursor: grabbing;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		min-width: 900px;
		user-select: none;
		-webkit-user-select: none;
	}

	text {
		font-family: Times, 'Times New Roman', serif;
		font-style: italic;
		fill: #2d2d2d;
		user-select: none;
		-webkit-user-select: none;
	}

	.reset-view {
		margin-top: 0.55rem;
		font-family: inherit;
		font-size: 0.82rem;
		font-style: italic;
		border: 1px solid #d6d6d6;
		background: #fff;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.reset-view:hover {
		background: #f5f5f5;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.play-pause-btn {
		margin-top: 0.55rem;
		font-family: inherit;
		font-size: 0.82rem;
		border: 1px solid #d6d6d6;
		background: #fff;
		padding: 0.25rem 0.4rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.play-pause-btn:hover {
		background: #f5f5f5;
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
