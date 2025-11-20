import { writable } from 'svelte/store';

export const filters = [
    // Light & Shadow
    'light', 'shadow', 'reflect',
    // Deformation
    'bend', 'dent', 'turn', 'twist', 'bulge', 'drape', 'lean',
    // Materials
    'metal', 'plywood', 'concrete', 'glass', 'water', 'ice', 'snow', 'beast',
    // Shapes
    'hole', 'orb', 'circle', 'tube', 'wedge', 'line', 'peak', 'corner', 'edge', 'curve',
    // Sections & Composition
    'cutout', 'section', 'wrap', 'stack', 'patch', 'peel', 'engulf', 'extend',
    // Spatial Relationships
    'alone', 'together', 'symmetry', 'perspective',
    // Movement & Action
    'circumvent', 'hold', 'escape', 'enter', 'repeat', 'drift',
    // Structures & Objects
    'monolith', 'fence',
    // Space & Volume
    'sky', 'void', 'volume', 
    // Pattern & Graphics
    'graphic', 'text'
];

export const activeFilters = writable(new Set(filters));

export function toggleFilter(filter: string) {
    activeFilters.update(current => {
        const newSet = new Set(current);
        const filterLower = filter.toLowerCase();
        if (newSet.has(filterLower)) {
            newSet.delete(filterLower);
        } else {
            newSet.add(filterLower);
        }
        return newSet;
    });
}
