import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getCharacter } from '$lib/server/characters';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		return {
			character: null,
			characterId: params.id,
			isAuthenticated: false,
			user: null
		};
	}

	const character = await getCharacter(params.id, locals.user.id);

	if (!character) {
		throw error(404, 'Character not found');
	}

	return {
		character,
		characterId: params.id,
		isAuthenticated: true,
		user: locals.user
	};
};
