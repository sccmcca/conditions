<script lang="ts">
	export let data;

	const cloud = data.cloud;
	const width = 1180;
	const height = 780;
	const padding = 58;
	const centerX = width / 2;
	const centerY = height / 2;
	const layoutRadius = Math.min(width, height) / 2 - padding;
	const maxEdge = cloud.edges.length ? Math.max(...cloud.edges.map((edge: any) => edge.weight)) : 1;
	const boundaryColors = ['#1f6feb', '#0d7b4f', '#8f4a00', '#7a3db8', '#b33a3a', '#1c7f7f', '#5b5b5b'];

	let hoveredCluster: number | null = null;
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

	function randomPointInCircle(rng: () => number, radius: number) {
		const angle = rng() * Math.PI * 2;
		const dist = Math.sqrt(rng()) * radius;
		return {
			x: centerX + Math.cos(angle) * dist,
			y: centerY + Math.sin(angle) * dist
		};
	}

	function buildForceLayout(nodes: any[], edges: any[]) {
		if (!nodes.length) return [];

		const rng = makeRng(JSON.stringify(nodes.map((node) => [node.id, node.degree, node.tagCount])));
		const laidOut = nodes.map((node) => {
			const hitRadius = Math.max(8, Math.min(20, 8 + Math.log2(Math.max(1, node.degree + 1)) * 3.2));
			const point = randomPointInCircle(rng, Math.max(0, layoutRadius - hitRadius));

			return {
				...node,
				hitRadius,
				x: point.x,
				y: point.y,
				vx: 0,
				vy: 0
			};
		});

		const idToIndex = new Map(laidOut.map((node, i) => [node.id, i]));
		const edgePairs = edges
			.map((edge) => ({
				source: idToIndex.get(edge.source),
				target: idToIndex.get(edge.target),
				weight: edge.weight
			}))
			.filter((edge) => edge.source !== undefined && edge.target !== undefined);

		const iterations = 320;
		const repulsion = 1700;
		const centerPull = 0.001;
		const damping = 0.85;

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
				const ideal = 88 + (1 - Math.min(1, edge.weight / maxEdge)) * 68;
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
				node.vx += (centerX - node.x) * centerPull;
				node.vy += (centerY - node.y) * centerPull;
				node.vx *= damping;
				node.vy *= damping;

				const nextX = node.x + node.vx;
				const nextY = node.y + node.vy;
				const dx = nextX - centerX;
				const dy = nextY - centerY;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const maxDist = Math.max(0, layoutRadius - node.hitRadius);

				if (dist > maxDist && dist > 0) {
					const clampScale = maxDist / dist;
					node.x = centerX + dx * clampScale;
					node.y = centerY + dy * clampScale;
					node.vx *= 0.55;
					node.vy *= 0.55;
				} else {
					node.x = nextX;
					node.y = nextY;
				}
			}
		}

		return laidOut;
	}

	const positionedNodes = buildForceLayout(cloud.nodes, cloud.edges);

	function cross(o: any, a: any, b: any) {
		return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
	}

	function convexHull(points: any[]) {
		if (points.length <= 2) return points;

		const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
		const lower: any[] = [];
		for (const p of sorted) {
			while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
				lower.pop();
			}
			lower.push(p);
		}

		const upper: any[] = [];
		for (let i = sorted.length - 1; i >= 0; i -= 1) {
			const p = sorted[i];
			while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
				upper.pop();
			}
			upper.push(p);
		}

		lower.pop();
		upper.pop();
		return lower.concat(upper);
	}

	function boundaryPath(points: any[]) {
		if (!points.length) return '';
		if (points.length === 1) {
			const p = points[0];
			const r = Math.max(14, p.hitRadius + 8);
			return `M ${p.x - r} ${p.y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
		}
		if (points.length === 2) {
			const [a, b] = points;
			const r = Math.max(12, (a.hitRadius + b.hitRadius) * 0.6 + 6);
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
			const nx = -dy / len;
			const ny = dx / len;
			const p1 = { x: a.x + nx * r, y: a.y + ny * r };
			const p2 = { x: b.x + nx * r, y: b.y + ny * r };
			const p3 = { x: b.x - nx * r, y: b.y - ny * r };
			const p4 = { x: a.x - nx * r, y: a.y - ny * r };
			const m12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
			const m23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
			const m34 = { x: (p3.x + p4.x) / 2, y: (p3.y + p4.y) / 2 };
			const m41 = { x: (p4.x + p1.x) / 2, y: (p4.y + p1.y) / 2 };
			return `M ${m12.x} ${m12.y} Q ${p2.x} ${p2.y} ${m23.x} ${m23.y} Q ${p3.x} ${p3.y} ${m34.x} ${m34.y} Q ${p4.x} ${p4.y} ${m41.x} ${m41.y} Q ${p1.x} ${p1.y} ${m12.x} ${m12.y} Z`;
		}

		const smooth = 0.17;
		let d = `M ${points[0].x} ${points[0].y}`;

		for (let i = 0; i < points.length; i += 1) {
			const p0 = points[(i - 1 + points.length) % points.length];
			const p1 = points[i];
			const p2 = points[(i + 1) % points.length];
			const p3 = points[(i + 2) % points.length];

			const cp1x = p1.x + (p2.x - p0.x) * smooth;
			const cp1y = p1.y + (p2.y - p0.y) * smooth;
			const cp2x = p2.x - (p3.x - p1.x) * smooth;
			const cp2y = p2.y - (p3.y - p1.y) * smooth;

			d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
		}

		d += ' Z';
		return d;
	}

	$: clusterBoundaries = (() => {
		const clusterMap = new Map<number, any[]>();
		for (const node of positionedNodes) {
			if (!clusterMap.has(node.cluster)) clusterMap.set(node.cluster, []);
			clusterMap.get(node.cluster)?.push(node);
		}

		return Array.from(clusterMap.entries())
			.filter(([, nodes]) => nodes.length >= 1)
			.map(([cluster, nodes]) => {
				const hull = convexHull(nodes);
				const centroid = nodes.reduce(
					(acc, node) => ({ x: acc.x + node.x, y: acc.y + node.y }),
					{ x: 0, y: 0 }
				);
				const center = {
					x: centroid.x / Math.max(1, nodes.length),
					y: centroid.y / Math.max(1, nodes.length)
				};
				const summary = cloud.clusters.find((item: any) => item.cluster === cluster);
				const descriptor = summary?.descriptor ?? `cluster ${cluster}`;
				const detail = summary?.sharedTags?.length
					? `common: ${summary.sharedTags.join(', ')}`
					: summary?.topTags?.length
						? `top: ${summary.topTags.join(', ')}`
						: '';
				return {
					cluster,
					d: boundaryPath(hull),
					color: boundaryColors[(Math.max(1, cluster) - 1) % boundaryColors.length],
					center,
					label: summary ? `${descriptor} (${summary.size})` : descriptor,
					detail
				};
			})
			.filter((item) => item.d);
	})();

	function setHoveredCluster(cluster: number | null) {
		hoveredCluster = cluster;
	}

	function getSvgPoint(event: PointerEvent | WheelEvent) {
		if (!svgElement) return { x: 0, y: 0 };
		const bounds = svgElement.getBoundingClientRect();
		return {
			x: ((event.clientX - bounds.left) / bounds.width) * width,
			y: ((event.clientY - bounds.top) / bounds.height) * height
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
		event.preventDefault();

		const point = getSvgPoint(event);
		isPanning = true;
		panStart = { x: point.x, y: point.y, panX, panY };

		const handleMove = (moveEvent: PointerEvent) => {
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
	<title>Image Cloud</title>
</svelte:head>

<main class="image-cloud-page">
	<section class="intro">
		<h2>image co-occurrence map, 2d</h2>
		<p>
			images are arranged in 2d based on shared tags across material, tectonic, interaction, and
			phenomena.
		</p>
		<p>
			showing {cloud.params.top} images, minimum shared tags {cloud.params.minShared},
			clustering threshold {cloud.params.clusterEdge}.
		</p>
		<p>zoom with wheel/trackpad, drag to pan, hover a grouping boundary to see its label.</p>
		<button type="button" class="reset-view" on:click={resetView}>reset view</button>
	</section>

	<section class="network-wrap">
		<svg
			bind:this={svgElement}
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="2D image co-occurrence map"
			on:wheel={zoomAtPoint}
			on:pointerdown={startPan}
			on:dblclick={resetView}
			class:is-panning={isPanning}
		>
			<g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
				{#each clusterBoundaries as boundary (boundary.cluster)}
					<path
						d={boundary.d}
						role="img"
						aria-label={boundary.detail ? `${boundary.label}. ${boundary.detail}` : boundary.label}
						fill={boundary.color}
						fill-opacity={hoveredCluster === boundary.cluster ? 0.12 : 0.05}
						stroke={boundary.color}
						stroke-opacity={hoveredCluster === boundary.cluster ? 0.68 : 0.28}
						stroke-width={hoveredCluster === boundary.cluster ? 1.6 : 1}
						vector-effect="non-scaling-stroke"
						on:mouseenter={() => setHoveredCluster(boundary.cluster)}
						on:mouseleave={() => setHoveredCluster(null)}
					/>
					{#if hoveredCluster === boundary.cluster}
						<text x={boundary.center.x} y={boundary.center.y - 7} text-anchor="middle" dominant-baseline="middle">
							{boundary.label}
						</text>
						{#if boundary.detail}
							<text x={boundary.center.x} y={boundary.center.y + 9} text-anchor="middle" dominant-baseline="middle">
								{boundary.detail}
							</text>
						{/if}
					{/if}
				{/each}
			</g>
		</svg>
	</section>
</main>

<style>
	.image-cloud-page {
		max-width: 1200px;
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
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
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
		user-select: none;
		-webkit-user-select: none;
	}

	text {
		font-family: Times, 'Times New Roman', serif;
		font-style: italic;
		font-size: 0.72rem;
		fill: #1e1e1e;
		pointer-events: none;
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
	}
</style>
