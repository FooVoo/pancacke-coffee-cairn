import type { PageServerLoad } from './$types';
import { getCharacter } from '$lib/server/characters';

export const load: PageServerLoad = async ({ params, locals }) => {
	// For authenticated users, load from TursoDB
	if (locals.user) {
		const character = await getCharacter(params.id, locals.user.id);

		if (!character) {
			// Character not found in server, might be in local storage
			return {
				character: null,
				isAuthenticated: true,
				characterId: params.id
			};
		}

		return {
			character,
			isAuthenticated: true,
			characterId: params.id
		};
	}

	// For anonymous users, return null (client will load from IndexedDB)
	return {
		character: null,
		isAuthenticated: false,
		characterId: params.id
	};
};
