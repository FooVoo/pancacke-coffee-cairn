import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getCharacter } from '$lib/server/characters';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const character = await getCharacter(params.id, locals.user.id);

	if (!character) {
		throw error(404, 'Character not found');
	}

	return {
		character
	};
};
