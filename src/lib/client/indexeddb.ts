/**
 * IndexedDB client for storing characters locally for anonymous/guest users
 * Uses Dexie.js as the IndexedDB wrapper
 */
import Dexie, { type Table } from 'dexie';

export interface CairnCharacterIndexedDB {
	id?: string;
	name: string;
	role: string;
	background?: string;
	level?: number;
	experience?: number;
	str: number;
	dex: number;
	con: number;
	int: number;
	wis: number;
	cha: number;
	hp: number;
	maxHp?: number;
	hitDie?: string;
	armorClass?: number;
	proficiencyBonus?: number;
	savingThrows?: string;
	skills: string;
	proficiencies?: string;
	languages?: string;
	equipment: string;
	weapons?: string;
	armor?: string;
	spells: string;
	spellSlots?: string;
	gold?: number;
	silver?: number;
	copper?: number;
	traits?: string;
	ideals?: string;
	bonds?: string;
	flaws?: string;
	conditions?: string;
	features?: string;
	notes?: string;
	avatarUrl?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export class CharacterDatabase extends Dexie {
	characters!: Table<CairnCharacterIndexedDB>;

	constructor() {
		super('CairnCharacterDatabase');
		this.version(1).stores({
			characters:
				'++id, name, role, level, createdAt' // Indexed fields for efficient queries
		});
	}
}

// Create singleton instance
export const db = new CharacterDatabase();

// Helper to generate character ID for IndexedDB
export function generateLocalCharacterId(): string {
	return `local_char_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

// CRUD operations for IndexedDB
export async function createLocalCharacter(
	character: Omit<CairnCharacterIndexedDB, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CairnCharacterIndexedDB> {
	const now = new Date();
	const newCharacter: CairnCharacterIndexedDB = {
		...character,
		id: generateLocalCharacterId(),
		createdAt: now,
		updatedAt: now
	};

	await db.characters.add(newCharacter);
	return newCharacter;
}

export async function getLocalCharacter(id: string): Promise<CairnCharacterIndexedDB | undefined> {
	return db.characters.get(id);
}

export async function getAllLocalCharacters(): Promise<CairnCharacterIndexedDB[]> {
	return db.characters.orderBy('createdAt').reverse().toArray();
}

export async function updateLocalCharacter(
	id: string,
	updates: Partial<CairnCharacterIndexedDB>
): Promise<void> {
	await db.characters.update(id, {
		...updates,
		updatedAt: new Date()
	});
}

export async function deleteLocalCharacter(id: string): Promise<void> {
	await db.characters.delete(id);
}

export async function clearAllLocalCharacters(): Promise<void> {
	await db.characters.clear();
}

// Migration helper: Transfer IndexedDB characters to server when user logs in
export async function getCharactersForMigration(): Promise<CairnCharacterIndexedDB[]> {
	return getAllLocalCharacters();
}
