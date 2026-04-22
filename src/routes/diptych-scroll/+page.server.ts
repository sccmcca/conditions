import { loadGalleryData } from '$lib/server/gallery';

export const load = async () => {
	const galleryData = loadGalleryData();
	return {
		images: galleryData.images
	};
};
