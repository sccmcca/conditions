import { loadGalleryData, type GalleryCategory } from '$lib/server/gallery';

type NetworkNode = {
	id: string;
	count: number;
	category: GalleryCategory | 'mixed';
	cluster: number;
};

type NetworkEdge = {
	source: string;
	target: string;
	weight: number;
};

class UnionFind {
	private parent = new Map<string, string>();

	add(x: string) {
		if (!this.parent.has(x)) this.parent.set(x, x);
	}

	find(x: string): string {
		const current = this.parent.get(x);
		if (!current) {
			this.parent.set(x, x);
			return x;
		}
		if (current === x) return x;
		const root = this.find(current);
		this.parent.set(x, root);
		return root;
	}

	union(a: string, b: string) {
		this.add(a);
		this.add(b);
		const rootA = this.find(a);
		const rootB = this.find(b);
		if (rootA !== rootB) this.parent.set(rootB, rootA);
	}
}

const categories: GalleryCategory[] = ['material', 'tectonic', 'interaction', 'phenomena'];

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

export const load = async ({ url }) => {
	// Safely get search params with defaults for prerendering
	const getParam = (key: string, defaultValue: number) => {
		try {
			return Number(url.searchParams?.get(key) ?? defaultValue);
		} catch {
			return defaultValue;
		}
	};

	const { images } = loadGalleryData();
	const nodeCount = new Map<string, number>();
	const nodeCategory = new Map<string, GalleryCategory | 'mixed'>();
	const edgeCount = new Map<string, number>();

	for (const image of images) {
		const imageTags = new Set<string>();

		for (const category of categories) {
			for (const tag of image[category]) {
				imageTags.add(tag);
				nodeCount.set(tag, (nodeCount.get(tag) ?? 0) + 1);

				const prevCategory = nodeCategory.get(tag);
				if (!prevCategory) {
					nodeCategory.set(tag, category);
				} else if (prevCategory !== category) {
					nodeCategory.set(tag, 'mixed');
				}
			}
		}

		const tags = Array.from(imageTags).sort((a, b) => a.localeCompare(b));
		for (let i = 0; i < tags.length; i += 1) {
			for (let j = i + 1; j < tags.length; j += 1) {
				const key = `${tags[i]}|||${tags[j]}`;
				edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
			}
		}
	}

	const totalTags = nodeCount.size;
	const top = Math.max(10, Math.min(totalTags, getParam('top', 45)));
	const minEdge = Math.max(1, Math.min(20, getParam('minEdge', 2)));
	const clusterEdge = Math.max(minEdge, Math.min(20, getParam('clusterEdge', 3)));

	const selectedNodeIds = new Set(
		Array.from(nodeCount.entries())
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.slice(0, top)
			.map(([id]) => id)
	);

	const edges: NetworkEdge[] = Array.from(edgeCount.entries())
		.map(([key, weight]) => {
			const [source, target] = key.split('|||');
			return { source, target, weight };
		})
		.filter((edge) => edge.weight >= minEdge)
		.filter((edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target))
		.sort((a, b) => b.weight - a.weight || a.source.localeCompare(b.source) || a.target.localeCompare(b.target));

	const uf = new UnionFind();
	for (const id of selectedNodeIds) uf.add(id);
	for (const edge of edges) {
		if (edge.weight >= clusterEdge) uf.union(edge.source, edge.target);
	}

	const clusterRoots = new Map<string, number>();
	let clusterCounter = 1;

	const nodes: NetworkNode[] = Array.from(selectedNodeIds)
		.map((id) => {
			const root = uf.find(id);
			if (!clusterRoots.has(root)) {
				clusterRoots.set(root, clusterCounter);
				clusterCounter += 1;
			}

			return {
				id,
				count: nodeCount.get(id) ?? 0,
				category: nodeCategory.get(id) ?? 'mixed',
				cluster: clusterRoots.get(root) ?? 0
			};
		})
		.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

	const clusters = Array.from(
		nodes.reduce((acc, node) => {
			if (!acc.has(node.cluster)) acc.set(node.cluster, [] as NetworkNode[]);
			acc.get(node.cluster)?.push(node);
			return acc;
		}, new Map<number, NetworkNode[]>())
	)
		.sort((a, b) => b[1].length - a[1].length || a[0] - b[0])
		.map(([cluster, clusterNodes]) => ({
			cluster,
			size: clusterNodes.length,
			nodes: clusterNodes.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
		}));

	return {
		network: {
			nodes,
			edges,
			clusters,
			params: { top, minEdge, clusterEdge }
		}
	};
};