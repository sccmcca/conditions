import { writable } from 'svelte/store';

export type Observation = {
	id: string;
	leftImage: {
		filename: string;
		thumbnail: string;
	};
	rightImage: {
		filename: string;
		thumbnail: string;
	};
	note: string;
	timestamp: number;
};

function createObservations() {
	const { subscribe, set, update } = writable<Observation[]>([]);

	// Load observations from server or localStorage
	let initialized = false;
	const init = async () => {
		if (initialized) return;
		initialized = true;
		try {
			const response = await fetch('/api/observations');
			const data = await response.json();
			const observations = Array.isArray(data) ? data : [];
			set(observations);
			// Sync to localStorage as backup
			if (typeof window !== 'undefined') {
				localStorage.setItem('observations', JSON.stringify(observations));
			}
		} catch (e) {
			// Fallback to localStorage if API fails
			if (typeof window !== 'undefined') {
				try {
					const stored = localStorage.getItem('observations');
					const observations = stored ? JSON.parse(stored) : [];
					set(observations);
				} catch {
					set([]);
				}
			}
		}
	};

	return {
		subscribe,
		init,
		add: async (observation: Omit<Observation, 'id' | 'timestamp'>) => {
			try {
				const response = await fetch('/api/observations', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(observation)
				});
				const newObservation = await response.json();
				update((observations) => {
					const updated = [newObservation, ...observations];
					// Also save to localStorage
					if (typeof window !== 'undefined') {
						localStorage.setItem('observations', JSON.stringify(updated));
					}
					return updated;
				});
			} catch (e) {
				console.error('Failed to add observation:', e);
				// Fallback: add locally only
				const tempObservation: Observation = {
					...observation,
					id: Math.random().toString(36).substr(2, 9),
					timestamp: Date.now()
				};
				update((observations) => {
					const updated = [tempObservation, ...observations];
					if (typeof window !== 'undefined') {
						localStorage.setItem('observations', JSON.stringify(updated));
					}
					return updated;
				});
			}
		},
		remove: async (id: string) => {
			try {
				await fetch('/api/observations', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id })
				});
				update((observations) => {
					const filtered = observations.filter((o) => o.id !== id);
					// Also update localStorage
					if (typeof window !== 'undefined') {
						localStorage.setItem('observations', JSON.stringify(filtered));
					}
					return filtered;
				});
			} catch (e) {
				console.error('Failed to remove observation:', e);
				// Fallback: remove locally only
				update((observations) => {
					const filtered = observations.filter((o) => o.id !== id);
					if (typeof window !== 'undefined') {
						localStorage.setItem('observations', JSON.stringify(filtered));
					}
					return filtered;
				});
			}
		}
	};
}

export const observations = createObservations();

