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

const INITIAL_OBSERVATIONS: Observation[] = [
  {
    "leftImage": {
      "filename": "8A61AB92-3E37-405A-B16F-F32E715D5743.jpg",
      "thumbnail": "/thumbnails/8A61AB92-3E37-405A-B16F-F32E715D5743.jpg"
    },
    "rightImage": {
      "filename": "IMG_0703.jpg",
      "thumbnail": "/thumbnails/IMG_0703.jpg"
    },
    "note": "essential forms",
    "id": "7mp0l09qv",
    "timestamp": 1776921363504
  },
  {
    "leftImage": {
      "filename": "A8105588-66C9-49E0-B344-0A1B0D2D7063.jpg",
      "thumbnail": "/thumbnails/A8105588-66C9-49E0-B344-0A1B0D2D7063.jpg"
    },
    "rightImage": {
      "filename": "IMG_4622.jpg",
      "thumbnail": "/thumbnails/IMG_4622.jpg"
    },
    "note": "slats",
    "id": "1clorhoas",
    "timestamp": 1776920463449
  },
  {
    "leftImage": {
      "filename": "IMG_7950.jpg",
      "thumbnail": "/thumbnails/IMG_7950.jpg"
    },
    "rightImage": {
      "filename": "IMG_9388.jpg",
      "thumbnail": "/thumbnails/IMG_9388.jpg"
    },
    "note": "We goin up",
    "id": "pjajz7mu8",
    "timestamp": 1776920243468
  },
  {
    "leftImage": {
      "filename": "IMG_2516.jpg",
      "thumbnail": "/thumbnails/IMG_2516.jpg"
    },
    "rightImage": {
      "filename": "IMG_20180831_173424_059.jpg",
      "thumbnail": "/thumbnails/IMG_20180831_173424_059.jpg"
    },
    "note": "Tensions of privacy holding extroverted activities within",
    "id": "nob1nz0p5",
    "timestamp": 1776918067422
  },
  {
    "leftImage": {
      "filename": "stair_object_stair_still-life.jpg",
      "thumbnail": "/thumbnails/stair_object_stair_still-life.jpg"
    },
    "rightImage": {
      "filename": "IMG_9139.jpg",
      "thumbnail": "/thumbnails/IMG_9139.jpg"
    },
    "note": "stepped shadows",
    "id": "9sk9xajje",
    "timestamp": 1776917822309
  },
  {
    "leftImage": {
      "filename": "70241922141__698A3423-570F-4242-83E5-B083622452A8.jpg",
      "thumbnail": "/thumbnails/70241922141__698A3423-570F-4242-83E5-B083622452A8.jpg"
    },
    "rightImage": {
      "filename": "IMG_20210102_132328732.jpg",
      "thumbnail": "/thumbnails/IMG_20210102_132328732.jpg"
    },
    "note": "glacial assemblages",
    "id": "rw2ncagh6",
    "timestamp": 1776917616304
  },
  {
    "leftImage": {
      "filename": "877933ED-4810-4D88-BDEE-91988DE2089E.jpg",
      "thumbnail": "/thumbnails/877933ED-4810-4D88-BDEE-91988DE2089E.jpg"
    },
    "rightImage": {
      "filename": "IMG_1298.jpg",
      "thumbnail": "/thumbnails/IMG_1298.jpg"
    },
    "note": "arcs",
    "id": "tiz54wxll",
    "timestamp": 1776915005305
  },
  {
    "leftImage": {
      "filename": "IMG_3712.jpg",
      "thumbnail": "/thumbnails/IMG_3712.jpg"
    },
    "rightImage": {
      "filename": "IMG_6783.jpg",
      "thumbnail": "/thumbnails/IMG_6783.jpg"
    },
    "note": "eroded art pieces",
    "id": "uxl3w5k04",
    "timestamp": 1776914846687
  },
  {
    "leftImage": {
      "filename": "IMG_7710.jpg",
      "thumbnail": "/thumbnails/IMG_7710.jpg"
    },
    "rightImage": {
      "filename": "IMG_4778.jpg",
      "thumbnail": "/thumbnails/IMG_4778.jpg"
    },
    "note": "777",
    "id": "kjxjnsbmt",
    "timestamp": 1776828681825
  },
  {
    "leftImage": {
      "filename": "IMG_7025.jpg",
      "thumbnail": "/thumbnails/IMG_7025.jpg"
    },
    "rightImage": {
      "filename": "IMG_4885.jpg",
      "thumbnail": "/thumbnails/IMG_4885.jpg"
    },
    "note": "round",
    "id": "2hoox0sa4",
    "timestamp": 1776827793423
  },
  {
    "leftImage": {
      "filename": "IMG_1035 (1).jpg",
      "thumbnail": "/thumbnails/IMG_1035 (1).jpg"
    },
    "rightImage": {
      "filename": "IMG_8172.jpg",
      "thumbnail": "/thumbnails/IMG_8172.jpg"
    },
    "note": "mystic patterns appearing on the ground",
    "id": "cj5xc2mhw",
    "timestamp": 1776827521401
  },
  {
    "leftImage": {
      "filename": "E4DE5FB5-9403-49E8-AFF3-0F8A28A29AEB",
      "thumbnail": "/thumbnails/E4DE5FB5-9403-49E8-AFF3-0F8A28A29AEB.jpg"
    },
    "rightImage": {
      "filename": "IMG_4518",
      "thumbnail": "/thumbnails/IMG_4518.jpg"
    },
    "note": "Grid patterns",
    "id": "zezl5qw6h",
    "timestamp": 1776827389429
  },
  {
    "leftImage": {
      "filename": "IMG_0176.jpg",
      "thumbnail": "/thumbnails/IMG_0176.jpg"
    },
    "rightImage": {
      "filename": "IMG_0524.jpg",
      "thumbnail": "/thumbnails/IMG_0524.jpg"
    },
    "note": "Vertical split screen // Horizontal split screen",
    "id": "0tqapehy8",
    "timestamp": 1776827295311
  }
];

function createObservations() {
	const { subscribe, set, update } = writable<Observation[]>(INITIAL_OBSERVATIONS);

	// Load observations from server on init
	let initialized = false;
	const init = async () => {
		if (initialized) return;
		initialized = true;
		try {
			const response = await fetch('/api/observations');
			const data = await response.json();
			set(Array.isArray(data) ? data : INITIAL_OBSERVATIONS);
		} catch (e) {
			console.error('Failed to load observations:', e);
			set(INITIAL_OBSERVATIONS);
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

