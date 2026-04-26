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

	// Load observations from server on init
	let initialized = false;
	const init = async () => {
		if (initialized) return;
		initialized = true;
		try {
			const response = await fetch('/api/observations');
			const data = await response.json();
			set(Array.isArray(data) ? data : []);
		} catch (e) {
			console.error('Failed to load observations:', e);
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
				update((observations) => [newObservation, ...observations]);
			} catch (e) {
				console.error('Failed to add observation:', e);
			}
		},
		remove: async (id: string) => {
			try {
				await fetch('/api/observations', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id })
				});
				update((observations) => observations.filter((o) => o.id !== id));
			} catch (e) {
				console.error('Failed to remove observation:', e);
			}
		}
	};
}

export const observations = createObservations();

