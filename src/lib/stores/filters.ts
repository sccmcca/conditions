import { writable, derived } from 'svelte/store';

type Category = 'material' | 'tectonic' | 'interaction' | 'phenomena';

export type SelectedFilters = Record<Category, string[]>;

const initialFilters: SelectedFilters = {
	material: [],
	tectonic: [],
	interaction: [],
	phenomena: []
};

// Main store for selected filters
export const selectedFilters = writable<SelectedFilters>(initialFilters);

/**
 * Toggle a filter value within a category
 */
export function toggleFilter(category: Category, value: string) {
	selectedFilters.update((current) => {
		const categoryFilters = current[category];
		const newFilters = categoryFilters.includes(value)
			? categoryFilters.filter((v) => v !== value)
			: [...categoryFilters, value];

		return {
			...current,
			[category]: newFilters
		};
	});
}

/**
 * Clear all filters from a specific category, or all filters if no category specified
 */
export function clearFilters(category?: Category) {
	selectedFilters.update((current) => {
		if (category) {
			return {
				...current,
				[category]: []
			};
		}
		return initialFilters;
	});
}

/**
 * Check if any filters are active
 */
export const hasActiveFilters = derived(selectedFilters, ($selectedFilters) => {
	return Object.values($selectedFilters).some((filters) => filters.length > 0);
});

/**
 * Create a filter function to apply to images
 */
export function createImageFilterFunction(images: any[]) {
	return derived(selectedFilters, ($selectedFilters) => {
		const hasFilters = Object.values($selectedFilters).some((f) => f.length > 0);

		if (!hasFilters) {
			return images;
		}

		return images.filter((image) => {
			const imageTags = Array.isArray(image?.tags) ? image.tags : [];
			const categories: Category[] = ['material', 'tectonic', 'interaction', 'phenomena'];

			// For each category with selected filters
			for (const category of categories) {
				const categoryFilters = $selectedFilters[category];
				
				// If this category has no filters selected, skip it
				if (categoryFilters.length === 0) continue;

				// Check if image has ALL tags from this category's filters (AND logic within category)
				const hasMatchInCategory = categoryFilters.every((filter) => imageTags.includes(filter));

				// If no match in this category, exclude image (AND logic across categories)
				if (!hasMatchInCategory) return false;
			}

			return true;
		});
	});
}
