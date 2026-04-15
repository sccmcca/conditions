import { buildImageCloudData } from '$lib/server/image-cloud';

export const load = async ({ url }) => {
	const topParam = url.searchParams.get('top');
	const parsedTop = topParam === null ? 0 : Number(topParam);
	const top = Number.isFinite(parsedTop) ? Math.max(0, Math.floor(parsedTop)) : 0;
	const minShared = Math.max(1, Math.min(8, Number(url.searchParams.get('minShared') ?? 2)));
	const clusterEdge = Math.max(minShared, Math.min(8, Number(url.searchParams.get('clusterEdge') ?? 3)));

	return {
		cloud: buildImageCloudData(top, minShared, clusterEdge)
	};
};
