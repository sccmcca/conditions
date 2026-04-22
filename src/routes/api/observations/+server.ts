import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { readObservations, addObservation, removeObservation } from '$lib/server/observations';

export const GET: RequestHandler = async () => {
	const observations = readObservations();
	return json(observations);
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	const newObservation = addObservation(data);
	return json(newObservation, { status: 201 });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json();
	removeObservation(id);
	return json({ success: true });
};
