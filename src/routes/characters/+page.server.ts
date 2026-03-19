import type { PageServerLoad } from './$types';
import { getCharactersByUser } from '$lib/server/characters';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is authenticated, load their characters from TursoDB
	if (locals.user) {
		const characters = await getCharactersByUser(locals.user.id);

		return {
			user: locals.user,
			characters,
			isAuthenticated: true
		};
	}

	// For anonymous users, return empty array (client will load from IndexedDB)
	return {
		user: null,
		characters: [],
		isAuthenticated: false
	};
};
