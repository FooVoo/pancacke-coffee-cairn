import type { Handle } from '@sveltejs/kit';
import { initDb } from '$lib/server/db';
import { getUserFromRequest } from '$lib/server/auth';

// Initialize database on server start
let dbInitialized = false;
if (!dbInitialized) {
	await initDb();
	dbInitialized = true;
	console.log('Database initialized');
}

export const handle: Handle = async ({ event, resolve }) => {
	// Get user from session cookie
	const user = await getUserFromRequest(event);
	event.locals.user = user;

	return resolve(event);
};
