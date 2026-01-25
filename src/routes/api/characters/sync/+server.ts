import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserFromRequest } from '$lib/server/auth';
import {
	createCharacter,
	updateCharacter,
	deleteCharacter,
	type CairnCharacter
} from '$lib/server/characters';

/**
 * API endpoint for syncing character operations from client to TursoDB
 * Handles create, update, and delete operations from the sync queue
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Get authenticated user from session
		const sessionId = cookies.get('session_id');
		if (!sessionId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const user = await getUserFromRequest({ cookies } as any);
		if (!user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Parse request body
		const { characterId, operation, data } = await request.json();

		if (!characterId || !operation) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Process the sync operation based on type
		switch (operation) {
			case 'create': {
				if (!data) {
					return json({ error: 'Character data required for create' }, { status: 400 });
				}

				// Create character in TursoDB
				const characterData: CairnCharacter = {
					...data,
					userId: user.id
				};
				const created = await createCharacter(characterData);

				return json({ success: true, character: created });
			}

			case 'update': {
				if (!data) {
					return json({ error: 'Character data required for update' }, { status: 400 });
				}

				// Update character in TursoDB
				const updated = await updateCharacter(characterId, user.id, data);

				if (!updated) {
					return json({ error: 'Character not found' }, { status: 404 });
				}

				return json({ success: true, character: updated });
			}

			case 'delete': {
				// Delete character from TursoDB
				await deleteCharacter(characterId, user.id);

				return json({ success: true });
			}

			default:
				return json({ error: 'Invalid operation' }, { status: 400 });
		}
	} catch (error) {
		console.error('Sync API error:', error);
		return json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
