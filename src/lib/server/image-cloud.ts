import { loadGalleryData } from '$lib/server/gallery';

export type ImageCloudNode = {
	id: string;
	thumbnail: string;
	tagCount: number;
	degree: number;
	cluster: number;
};

export type ImageCloudEdge = {
	source: string;
	target: string;
	weight: number;
	sharedTags: string[];
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

export function buildImageCloudData(top: number, minShared: number, clusterEdge: number) {
	const { images } = loadGalleryData();
	const effectiveTop = top > 0 ? Math.min(top, images.length) : images.length;
	const imageTagMap = new Map<string, string[]>();

	const selectedImages = images.slice(0, effectiveTop).map((image) => {
		const tags = Array.from(new Set(image.tags));
		imageTagMap.set(image.filename, tags);
		return {
			id: image.filename,
			thumbnail: image.thumbnail,
			tags
		};
	});

	const tagSets = new Map(selectedImages.map((image) => [image.id, new Set(image.tags)]));
	const edges: ImageCloudEdge[] = [];
	const degree = new Map<string, number>();

	for (const image of selectedImages) degree.set(image.id, 0);

	for (let i = 0; i < selectedImages.length; i += 1) {
		for (let j = i + 1; j < selectedImages.length; j += 1) {
			const a = selectedImages[i];
			const b = selectedImages[j];
			const tagSetB = tagSets.get(b.id) ?? new Set<string>();
			const sharedTags = a.tags.filter((tag) => tagSetB.has(tag));
			const weight = sharedTags.length;

			if (weight < minShared) continue;

			edges.push({
				source: a.id,
				target: b.id,
				weight,
				sharedTags: sharedTags.sort((x, y) => x.localeCompare(y))
			});

			degree.set(a.id, (degree.get(a.id) ?? 0) + 1);
			degree.set(b.id, (degree.get(b.id) ?? 0) + 1);
		}
	}

	const uf = new UnionFind();
	for (const image of selectedImages) uf.add(image.id);
	for (const edge of edges) {
		if (edge.weight >= clusterEdge) uf.union(edge.source, edge.target);
	}

	const clusterRoots = new Map<string, number>();
	let clusterCounter = 1;

	const nodes: ImageCloudNode[] = selectedImages
		.map((image) => {
			const root = uf.find(image.id);
			if (!clusterRoots.has(root)) {
				clusterRoots.set(root, clusterCounter);
				clusterCounter += 1;
			}

			return {
				id: image.id,
				thumbnail: image.thumbnail,
				tagCount: image.tags.length,
				degree: degree.get(image.id) ?? 0,
				cluster: clusterRoots.get(root) ?? 0
			};
		})
		.sort((a, b) => b.degree - a.degree || b.tagCount - a.tagCount || a.id.localeCompare(b.id));

	const clusters = Array.from(
		nodes.reduce((acc, node) => {
			if (!acc.has(node.cluster)) acc.set(node.cluster, [] as ImageCloudNode[]);
			acc.get(node.cluster)?.push(node);
			return acc;
		}, new Map<number, ImageCloudNode[]>())
	)
		.sort((a, b) => b[1].length - a[1].length || a[0] - b[0])
		.map(([cluster, clusterNodes]) => {
			const tagFrequency = new Map<string, number>();
			for (const node of clusterNodes) {
				const tags = imageTagMap.get(node.id) ?? [];
				for (const tag of tags) {
					tagFrequency.set(tag, (tagFrequency.get(tag) ?? 0) + 1);
				}
			}

			const rankedTags = Array.from(tagFrequency.entries()).sort(
				(a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
			);

			const sharedThreshold = Math.max(2, Math.ceil(clusterNodes.length * 0.5));
			const sharedTags = rankedTags
				.filter(([, count]) => count >= sharedThreshold)
				.slice(0, 4)
				.map(([tag]) => tag);

			const topTags = rankedTags.slice(0, 6).map(([tag]) => tag);
			const descriptorTags = sharedTags.length ? sharedTags : topTags.slice(0, 3);
			const descriptor = descriptorTags.length
				? descriptorTags.join(', ')
				: `cluster ${cluster}`;

			return {
				cluster,
				size: clusterNodes.length,
				descriptor,
				sharedTags,
				topTags,
				nodes: clusterNodes
					.slice(0, 12)
					.map((node) => node.id)
					.sort((a, b) => a.localeCompare(b))
			};
		});

	return {
		nodes,
		edges,
		clusters,
		params: { top: effectiveTop, minShared, clusterEdge }
	};
}
