/**
 * Unified character store that works with both TursoDB (server) and IndexedDB (client)
 * - For authenticated users: Uses server-side TursoDB storage
 * - For anonymous users: Uses client-side IndexedDB storage
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { CairnCharacterIndexedDB } from '../client/indexeddb';

export interface Character {
	id?: string;
	userId?: string;
	name: string;
	role: string;
	background?: string;
	level?: number;
	experience?: number;
	attributes: {
		STR: number;
		DEX: number;
		CON: number;
		INT: number;
		WIS: number;
		CHA: number;
	};
	hp: number;
	maxHp?: number;
	hitDie?: string;
	armorClass?: number;
	proficiencyBonus?: number;
	savingThrows?: string[];
	skills: string[];
	proficiencies?: string[];
	languages?: string[];
	equipment: string[];
	weapons?: Array<{ name: string; damage: string; properties?: string }>;
	armor?: Array<{ name: string; ac: number; properties?: string }>;
	spells: string[];
	spellSlots?: { [key: string]: number };
	gold?: number;
	silver?: number;
	copper?: number;
	traits?: string[];
	ideals?: string;
	bonds?: string;
	flaws?: string;
	conditions?: string[];
	features?: string[];
	notes?: string;
	avatarUrl?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// Store for managing characters (client-side only for anonymous users)
function createCharacterStore() {
	const { subscribe, set, update } = writable<Character[]>([]);

	return {
		subscribe,
		set,
		update,
		// Load characters from IndexedDB
		async loadLocal() {
			if (!browser) return;

			const { getAllLocalCharacters } = await import('../client/indexeddb');
			const localChars = await getAllLocalCharacters();
			const characters = localChars.map(convertFromIndexedDB);
			set(characters);
		},
		// Add a character to IndexedDB and queue for sync
		async addLocal(character: Character, isAuthenticated = false) {
			if (!browser) return;

			const { createLocalCharacter } = await import('../client/indexeddb');
			const { queueSync } = await import('../client/syncQueue');
			
			const dbChar = convertToIndexedDB(character);
			const created = await createLocalCharacter(dbChar);
			const newChar = convertFromIndexedDB(created);

			// Queue sync operation if user is authenticated
			if (isAuthenticated && created.id) {
				await queueSync(created.id, 'create', newChar);
				// Trigger background sync
				if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
					try {
						const registration = await navigator.serviceWorker.ready;
						await registration.sync.register('cairn-character-sync');
					} catch (error) {
						console.error('Background sync registration failed:', error);
					}
				}
			}

			update((chars) => [newChar, ...chars]);
			return newChar;
		},
		// Update a character in IndexedDB and queue for sync
		async updateLocal(id: string, updates: Partial<Character>, isAuthenticated = false) {
			if (!browser) return;

			const { updateLocalCharacter } = await import('../client/indexeddb');
			const { queueSync } = await import('../client/syncQueue');
			
			const dbUpdates = convertToIndexedDB(updates as Character);
			await updateLocalCharacter(id, dbUpdates);

			// Queue sync operation if user is authenticated
			if (isAuthenticated) {
				await queueSync(id, 'update', updates);
				// Trigger background sync
				if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
					try {
						const registration = await navigator.serviceWorker.ready;
						await registration.sync.register('cairn-character-sync');
					} catch (error) {
						console.error('Background sync registration failed:', error);
					}
				}
			}

			update((chars) => chars.map((c) => (c.id === id ? { ...c, ...updates } : c)));
		},
		// Delete a character from IndexedDB and queue for sync
		async deleteLocal(id: string, isAuthenticated = false) {
			if (!browser) return;

			const { deleteLocalCharacter } = await import('../client/indexeddb');
			const { queueSync } = await import('../client/syncQueue');

			await deleteLocalCharacter(id);

			// Queue sync operation if user is authenticated
			if (isAuthenticated) {
				await queueSync(id, 'delete');
				// Trigger background sync
				if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
					try {
						const registration = await navigator.serviceWorker.ready;
						await registration.sync.register('cairn-character-sync');
					} catch (error) {
						console.error('Background sync registration failed:', error);
					}
				}
			}

			update((chars) => chars.filter((c) => c.id !== id));
		},
		// Clear all local characters
		async clearLocal() {
			if (!browser) return;

			const { clearAllLocalCharacters } = await import('../client/indexeddb');
			await clearAllLocalCharacters();
			set([]);
		},
		// Manually trigger sync
		async triggerSync() {
			if (!browser) return;

			if ('serviceWorker' in navigator) {
				try {
					const registration = await navigator.serviceWorker.ready;
					// Try background sync API first
					if ('sync' in registration) {
						await registration.sync.register('cairn-character-sync');
					} else {
						// Fallback: send message to service worker for immediate sync
						if (registration.active) {
							const channel = new MessageChannel();
							return new Promise((resolve, reject) => {
								channel.port1.onmessage = (event) => {
									if (event.data.success) {
										resolve(event.data);
									} else {
										reject(new Error(event.data.error));
									}
								};
								registration.active.postMessage(
									{ type: 'SYNC_NOW' },
									[channel.port2]
								);
							});
						}
					}
				} catch (error) {
					console.error('Manual sync failed:', error);
					throw error;
				}
			}
		}
	};
}

export const characterStore = createCharacterStore();

// Helper functions to convert between Character and IndexedDB format
function convertToIndexedDB(
	character: Character
): Omit<CairnCharacterIndexedDB, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: character.name,
		role: character.role,
		background: character.background,
		level: character.level,
		experience: character.experience,
		str: character.attributes.STR,
		dex: character.attributes.DEX,
		con: character.attributes.CON,
		int: character.attributes.INT,
		wis: character.attributes.WIS,
		cha: character.attributes.CHA,
		hp: character.hp,
		maxHp: character.maxHp,
		hitDie: character.hitDie,
		armorClass: character.armorClass,
		proficiencyBonus: character.proficiencyBonus,
		savingThrows: JSON.stringify(character.savingThrows || []),
		skills: JSON.stringify(character.skills),
		proficiencies: JSON.stringify(character.proficiencies || []),
		languages: JSON.stringify(character.languages || []),
		equipment: JSON.stringify(character.equipment),
		weapons: JSON.stringify(character.weapons || []),
		armor: JSON.stringify(character.armor || []),
		spells: JSON.stringify(character.spells),
		spellSlots: JSON.stringify(character.spellSlots || {}),
		gold: character.gold,
		silver: character.silver,
		copper: character.copper,
		traits: JSON.stringify(character.traits || []),
		ideals: character.ideals,
		bonds: character.bonds,
		flaws: character.flaws,
		conditions: JSON.stringify(character.conditions || []),
		features: JSON.stringify(character.features || []),
		notes: character.notes,
		avatarUrl: character.avatarUrl
	};
}

// Helper function to safely parse JSON with fallback
function safeJsonParse<T>(value: string | undefined, fallback: T): T {
	if (!value) return fallback;
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
}

function convertFromIndexedDB(dbChar: CairnCharacterIndexedDB): Character {
	return {
		id: dbChar.id,
		name: dbChar.name,
		role: dbChar.role,
		background: dbChar.background,
		level: dbChar.level,
		experience: dbChar.experience,
		attributes: {
			STR: dbChar.str,
			DEX: dbChar.dex,
			CON: dbChar.con,
			INT: dbChar.int,
			WIS: dbChar.wis,
			CHA: dbChar.cha
		},
		hp: dbChar.hp,
		maxHp: dbChar.maxHp,
		hitDie: dbChar.hitDie,
		armorClass: dbChar.armorClass,
		proficiencyBonus: dbChar.proficiencyBonus,
		savingThrows: safeJsonParse(dbChar.savingThrows, []),
		skills: safeJsonParse(dbChar.skills, []),
		proficiencies: safeJsonParse(dbChar.proficiencies, []),
		languages: safeJsonParse(dbChar.languages, []),
		equipment: safeJsonParse(dbChar.equipment, []),
		weapons: safeJsonParse(dbChar.weapons, []),
		armor: safeJsonParse(dbChar.armor, []),
		spells: safeJsonParse(dbChar.spells, []),
		spellSlots: safeJsonParse(dbChar.spellSlots, {}),
		gold: dbChar.gold,
		silver: dbChar.silver,
		copper: dbChar.copper,
		traits: safeJsonParse(dbChar.traits, []),
		ideals: dbChar.ideals,
		bonds: dbChar.bonds,
		flaws: dbChar.flaws,
		conditions: safeJsonParse(dbChar.conditions, []),
		features: safeJsonParse(dbChar.features, []),
		notes: dbChar.notes,
		avatarUrl: dbChar.avatarUrl,
		createdAt: dbChar.createdAt,
		updatedAt: dbChar.updatedAt
	};
}
