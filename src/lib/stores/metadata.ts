import { writable, derived } from 'svelte/store';

export type Category = 'material' | 'element' | 'form' | 'interaction' | 'phenomena';

export interface Geolocation {
	latitude: number;
	longitude: number;
}

export interface ImageMetadata {
	filename: string;
	thumbnail: string;
	material: string[];
	element: string[];
	form: string[];
	interaction: string[];
	phenomena: string[];
	date: string | null;
	author: string | null;
	geolocation: Geolocation | null;
	caption: string;
	tags: string[];
}

export interface GalleryData {
	images: ImageMetadata[];
	filterOptions: Record<Category, string[]>;
}

// Create a writable store for all metadata
function createMetadataStore() {
	const { subscribe, set } = writable<GalleryData>({
		images: [],
		filterOptions: {
			material: [],
			form: [],
			element: [],
			interaction: [],
			phenomena: []
		}
	});

	return {
		subscribe,
		loadData: (data: GalleryData) => set(data)
	};
}

export const metadataStore = createMetadataStore();

// Store for selected filters
export type SelectedFilters = Record<Category, string[]>;

function createSelectedFiltersStore() {
	const initialFilters: SelectedFilters = {
		material: [],
		form: [],
		element: [],
		interaction: [],
		phenomena: []
	};

	const { subscribe, update } = writable<SelectedFilters>(initialFilters);

	return {
		subscribe,
		toggle: (category: Category, value: string) => {
			update(current => {
				const filters = current[category];
				const newFilters = filters.includes(value)
					? filters.filter(v => v !== value)
					: [...filters, value];
				return { ...current, [category]: newFilters };
			});
		},
		clear: (category?: Category) => {
			update(current => {
				if (category) {
					return { ...current, [category]: [] };
				}
				return initialFilters;
			});
		}
	};
}

export const selectedFiltersStore = createSelectedFiltersStore();

// Derived store: has any active filters
export const hasActiveFilters = derived(selectedFiltersStore, $selected =>
	Object.values($selected).some(filters => filters.length > 0)
);

// Derived store: filtered images
export const filteredImages = derived(
	[metadataStore, selectedFiltersStore],
	([$metadata, $selected]) => {
		const activeCategories = Object.keys($selected).filter(
			cat => $selected[cat as Category].length > 0
		) as Category[];

		if (activeCategories.length === 0) {
			return $metadata.images;
		}

		return $metadata.images.filter(image => {
			return activeCategories.every(category => {
				const selectedValues = $selected[category];
				const imageTags = image[category] || [];
				return selectedValues.every(value => imageTags.includes(value));
			});
		});
	}
);

// Store for expanded categories
function createExpandedCategoriesStore() {
	const initial: Record<Category, boolean> = {
		material: false,
		tectonic: false,
		interaction: false,
		phenomena: false
	};

	const { subscribe, update } = writable(initial);

	return {
		subscribe,
		toggle: (category: Category) => {
			update((current: Record<Category, boolean>) => ({
				...current,
				[category]: !current[category]
			}));
		}
	};
}

export const expandedCategories = createExpandedCategoriesStore();

// Store for hovered image on map
export const hoveredMapImage = writable<string | null>(null);

// Store for image viewer
export const expandedImageIndex = writable<number | null>(null);

// Store for map expanded state
export const mapExpanded = writable<boolean>(false);

// Store for map center and zoom
export const mapCenter = writable<[number, number]>([0, 0]);
export const mapZoom = writable<number>(0);
