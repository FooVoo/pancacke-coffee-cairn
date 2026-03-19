import { browser } from '$app/environment';
import { getDemoCharacter } from '$lib/data/demoCharacter';
import type { CairnCharacterIndexedDB } from './indexeddb';

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

export async function loadGuestCharacters(): Promise<Character[]> {
	if (!browser) {
		return [];
	}

	const { getAllLocalCharacters } = await import('./indexeddb');
	const localCharacters = await getAllLocalCharacters();

	return localCharacters.map(convertFromIndexedDB);
}

export async function ensureGuestCharacters(): Promise<Character[]> {
	const localCharacters = await loadGuestCharacters();
	if (localCharacters.length > 0) {
		return localCharacters;
	}

	const demoCharacter = await createGuestCharacter(getDemoCharacter());
	return demoCharacter ? [demoCharacter] : [];
}

export async function getGuestCharacter(id: string): Promise<Character | null> {
	if (!browser) {
		return null;
	}

	const { getLocalCharacter } = await import('./indexeddb');
	const localCharacter = await getLocalCharacter(id);

	return localCharacter ? convertFromIndexedDB(localCharacter) : null;
}

export async function createGuestCharacter(character: Character): Promise<Character | null> {
	if (!browser) {
		return null;
	}

	const { createLocalCharacter } = await import('./indexeddb');
	const createdCharacter = await createLocalCharacter(convertToIndexedDB(character));

	return convertFromIndexedDB(createdCharacter);
}

export async function updateGuestCharacter(
	id: string,
	updates: Partial<Character>
): Promise<Character | null> {
	if (!browser) {
		return null;
	}

	const { updateLocalCharacter } = await import('./indexeddb');
	await updateLocalCharacter(id, convertPatchToIndexedDB(updates));

	return getGuestCharacter(id);
}

export async function deleteGuestCharacter(id: string): Promise<boolean> {
	if (!browser) {
		return false;
	}

	const { deleteLocalCharacter } = await import('./indexeddb');
	await deleteLocalCharacter(id);

	return true;
}

export async function clearGuestCharacters(): Promise<boolean> {
	if (!browser) {
		return false;
	}

	const { clearAllLocalCharacters } = await import('./indexeddb');
	await clearAllLocalCharacters();

	return true;
}

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

function convertPatchToIndexedDB(updates: Partial<Character>): Partial<CairnCharacterIndexedDB> {
	const dbUpdates: Partial<CairnCharacterIndexedDB> = {};

	if ('name' in updates) dbUpdates.name = updates.name;
	if ('role' in updates) dbUpdates.role = updates.role;
	if ('background' in updates) dbUpdates.background = updates.background;
	if ('level' in updates) dbUpdates.level = updates.level;
	if ('experience' in updates) dbUpdates.experience = updates.experience;
	if (updates.attributes) {
		dbUpdates.str = updates.attributes.STR;
		dbUpdates.dex = updates.attributes.DEX;
		dbUpdates.con = updates.attributes.CON;
		dbUpdates.int = updates.attributes.INT;
		dbUpdates.wis = updates.attributes.WIS;
		dbUpdates.cha = updates.attributes.CHA;
	}
	if ('hp' in updates) dbUpdates.hp = updates.hp;
	if ('maxHp' in updates) dbUpdates.maxHp = updates.maxHp;
	if ('hitDie' in updates) dbUpdates.hitDie = updates.hitDie;
	if ('armorClass' in updates) dbUpdates.armorClass = updates.armorClass;
	if ('proficiencyBonus' in updates) dbUpdates.proficiencyBonus = updates.proficiencyBonus;
	if ('savingThrows' in updates) dbUpdates.savingThrows = JSON.stringify(updates.savingThrows || []);
	if ('skills' in updates) dbUpdates.skills = JSON.stringify(updates.skills || []);
	if ('proficiencies' in updates)
		dbUpdates.proficiencies = JSON.stringify(updates.proficiencies || []);
	if ('languages' in updates) dbUpdates.languages = JSON.stringify(updates.languages || []);
	if ('equipment' in updates) dbUpdates.equipment = JSON.stringify(updates.equipment || []);
	if ('weapons' in updates) dbUpdates.weapons = JSON.stringify(updates.weapons || []);
	if ('armor' in updates) dbUpdates.armor = JSON.stringify(updates.armor || []);
	if ('spells' in updates) dbUpdates.spells = JSON.stringify(updates.spells || []);
	if ('spellSlots' in updates) dbUpdates.spellSlots = JSON.stringify(updates.spellSlots || {});
	if ('gold' in updates) dbUpdates.gold = updates.gold;
	if ('silver' in updates) dbUpdates.silver = updates.silver;
	if ('copper' in updates) dbUpdates.copper = updates.copper;
	if ('traits' in updates) dbUpdates.traits = JSON.stringify(updates.traits || []);
	if ('ideals' in updates) dbUpdates.ideals = updates.ideals;
	if ('bonds' in updates) dbUpdates.bonds = updates.bonds;
	if ('flaws' in updates) dbUpdates.flaws = updates.flaws;
	if ('conditions' in updates) dbUpdates.conditions = JSON.stringify(updates.conditions || []);
	if ('features' in updates) dbUpdates.features = JSON.stringify(updates.features || []);
	if ('notes' in updates) dbUpdates.notes = updates.notes;
	if ('avatarUrl' in updates) dbUpdates.avatarUrl = updates.avatarUrl;

	return dbUpdates;
}

function safeJsonParse<T>(value: string | undefined, fallback: T): T {
	if (!value) {
		return fallback;
	}

	try {
		return JSON.parse(value) as T;
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
