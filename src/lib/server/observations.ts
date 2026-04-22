import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

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

const OBSERVATIONS_FILE = join(process.cwd(), 'static', 'observations.json');

function ensureFile() {
	if (!existsSync(OBSERVATIONS_FILE)) {
		writeFileSync(OBSERVATIONS_FILE, JSON.stringify([]));
	}
}

export function readObservations(): Observation[] {
	ensureFile();
	try {
		const data = readFileSync(OBSERVATIONS_FILE, 'utf-8');
		return JSON.parse(data);
	} catch (e) {
		return [];
	}
}

export function addObservation(observation: Omit<Observation, 'id' | 'timestamp'>): Observation {
	const observations = readObservations();
	const newObservation: Observation = {
		...observation,
		id: Math.random().toString(36).substr(2, 9),
		timestamp: Date.now()
	};
	observations.unshift(newObservation);
	writeFileSync(OBSERVATIONS_FILE, JSON.stringify(observations, null, 2));
	return newObservation;
}

export function removeObservation(id: string): void {
	const observations = readObservations();
	const filtered = observations.filter((o) => o.id !== id);
	writeFileSync(OBSERVATIONS_FILE, JSON.stringify(filtered, null, 2));
}

export function clearObservations(): void {
	writeFileSync(OBSERVATIONS_FILE, JSON.stringify([]));
}
