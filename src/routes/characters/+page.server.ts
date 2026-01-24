import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getCharactersByUser } from '$lib/server/characters';
import { createUser, getUserByUsername, createSession } from '$lib/server/auth';
import { createCharacter } from '$lib/server/characters';
import { env } from '$lib/server/env';

export const load: PageServerLoad = async ({ locals, cookies }) => {
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
