import fs from 'fs';
import path from 'path';
import { base } from '$app/paths';

export type GalleryCategory = 'material' | 'tectonic' | 'interaction' | 'phenomena';

export type GalleryImage = {
	filename: string;
	thumbnail: string;
	caption: string;
	date: string | null;
	author: string | null;
	geolocation: { latitude: number; longitude: number } | null;
	tags: string[];
	material: string[];
	tectonic: string[];
	interaction: string[];
	phenomena: string[];
};

export type GalleryData = {
	images: GalleryImage[];
	filterOptions: Record<GalleryCategory, string[]>;
};

const categories: GalleryCategory[] = ['material', 'tectonic', 'interaction', 'phenomena'];

function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter(Boolean);
}

export function loadGalleryData(): GalleryData {
	const thumbnailsDir = path.join(process.cwd(), 'static', 'thumbnails');
	const metadataFile = path.join(process.cwd(), 'static', 'metadata.json');
	const filterOptions = Object.fromEntries(categories.map((category) => [category, new Set<string>()])) as Record<GalleryCategory, Set<string>>;

	let images: GalleryImage[] = [];
	let metadata: Record<string, any> = {};

	try {
		if (fs.existsSync(metadataFile)) {
			const metadataArray = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
			metadataArray.forEach((item: any) => {
				metadata[item.filename] = item;
			});
		}

		if (fs.existsSync(thumbnailsDir)) {
			const files = fs.readdirSync(thumbnailsDir);
			images = files
				.filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
				.map((filename) => {
					const filenameWithoutExt = filename.split('.')[0];
					const meta = metadata[filenameWithoutExt] || {};
					const material = toStringArray(meta.material);
					const tectonic = toStringArray(meta.tectonic);
					const interaction = toStringArray(meta.interaction);
					const phenomena = toStringArray(meta.phenomena);
					const caption = typeof meta.caption === 'string' ? meta.caption.trim() : '';

					material.forEach((value) => filterOptions.material.add(value));
					tectonic.forEach((value) => filterOptions.tectonic.add(value));
					interaction.forEach((value) => filterOptions.interaction.add(value));
					phenomena.forEach((value) => filterOptions.phenomena.add(value));

					const tags = Array.from(
						new Set([
							...toStringArray(meta.tags),
							...material,
							...tectonic,
							...interaction,
							...phenomena
						])
					);

					return {
						filename,
						thumbnail: `${base}/thumbnails/${filename}`,
						caption,
						date: meta.date || null,
						author: meta.author || null,
						geolocation: meta.geolocation || null,
						tags,
						material,
						tectonic,
						interaction,
						phenomena
					};
				})
				.sort((a, b) => {
					if (!a.date && !b.date) return 0;
					if (!a.date) return 1;
					if (!b.date) return -1;

					const dateA = new Date(a.date).getTime();
					const dateB = new Date(b.date).getTime();
					return dateB - dateA;
				});
		}
	} catch (error) {
		console.error('Error reading files:', error);
	}

	return {
		images,
		filterOptions: {
			material: Array.from(filterOptions.material).sort((a, b) => a.localeCompare(b)),
			tectonic: Array.from(filterOptions.tectonic).sort((a, b) => a.localeCompare(b)),
			interaction: Array.from(filterOptions.interaction).sort((a, b) => a.localeCompare(b)),
			phenomena: Array.from(filterOptions.phenomena).sort((a, b) => a.localeCompare(b))
		}
	};
}