/**
 * Unified character store that works with both TursoDB (server) and IndexedDB (client)
 * - For authenticated users: Uses server-side TursoDB storage
 * - For anonymous users: Uses client-side IndexedDB storage
 */
import { writable } from 'svelte/store';
import {
	clearGuestCharacters,
	createGuestCharacter,
	deleteGuestCharacter,
	ensureGuestCharacters,
	getGuestCharacter,
	loadGuestCharacters,
	updateGuestCharacter,
	type Character
} from '$lib/client/localFirstCharacterPipeline';

// Store for managing characters (client-side only for anonymous users)
function createCharacterStore() {
	const { subscribe, set, update } = writable<Character[]>([]);

	return {
		subscribe,
		set,
		update,
		// Load characters from IndexedDB
		async loadLocal({ seedDemo = false }: { seedDemo?: boolean } = {}) {
			const characters = seedDemo ? await ensureGuestCharacters() : await loadGuestCharacters();
			set(characters);
			return characters;
		},
		// Load a single character from IndexedDB
		async getLocal(id: string) {
			return getGuestCharacter(id);
		},
		// Add a character to IndexedDB
		async addLocal(character: Character) {
			const newChar = await createGuestCharacter(character);
			if (!newChar) return null;

			update((chars) => [newChar, ...chars]);
			return newChar;
		},
		// Update a character in IndexedDB
		async updateLocal(id: string, updates: Partial<Character>) {
			const updatedCharacter = await updateGuestCharacter(id, updates);
			if (!updatedCharacter) return null;

			update((chars) => chars.map((c) => (c.id === id ? updatedCharacter : c)));
			return updatedCharacter;
		},
		// Delete a character from IndexedDB
		async deleteLocal(id: string) {
			const deleted = await deleteGuestCharacter(id);
			if (!deleted) return false;

			update((chars) => chars.filter((c) => c.id !== id));
			return true;
		},
		// Clear all local characters
		async clearLocal() {
			const cleared = await clearGuestCharacters();
			if (!cleared) return false;
			set([]);
			return true;
		}
	};
}

export const characterStore = createCharacterStore();
export type { Character } from '$lib/client/localFirstCharacterPipeline';
