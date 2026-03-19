import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CairnCharacterIndexedDB } from './indexeddb';

const mockEnvironment = vi.hoisted(() => ({ browser: true }));
const mockDemoCharacter = vi.hoisted(() => ({
	name: 'Demo Guest',
	role: 'Warden',
	background: 'Mocked demo character',
	level: 2,
	experience: 350,
	attributes: {
		STR: 13,
		DEX: 11,
		CON: 12,
		INT: 10,
		WIS: 14,
		CHA: 8
	},
	hp: 12,
	maxHp: 12,
	hitDie: 'd8',
	armorClass: 13,
	proficiencyBonus: 2,
	savingThrows: ['STR'],
	skills: ['Survival'],
	proficiencies: ['Shield'],
	languages: ['Common'],
	equipment: ['Bedroll'],
	weapons: [{ name: 'Spear', damage: '1d6', properties: 'Thrown' }],
	armor: [{ name: 'Hide Armor', ac: 12, properties: 'Medium' }],
	spells: ['Light'],
	spellSlots: { '1': 1 },
	gold: 3,
	silver: 4,
	copper: 5,
	traits: ['Steady'],
	ideals: 'Protect the weak',
	bonds: 'My village',
	flaws: 'Distrustful',
	conditions: [],
	features: ['Watchful'],
	notes: 'Ready for testing',
	avatarUrl: '/demo.png'
}));
const mockIndexedDb = vi.hoisted(() => ({
	getAllLocalCharacters: vi.fn(),
	getLocalCharacter: vi.fn(),
	createLocalCharacter: vi.fn(),
	updateLocalCharacter: vi.fn(),
	deleteLocalCharacter: vi.fn(),
	clearAllLocalCharacters: vi.fn()
}));

vi.mock('$app/environment', () => ({
	get browser() {
		return mockEnvironment.browser;
	}
}));

vi.mock('$lib/data/demoCharacter', () => ({
	getDemoCharacter: () => mockDemoCharacter
}));

vi.mock('./indexeddb', () => mockIndexedDb);

import {
	clearGuestCharacters,
	createGuestCharacter,
	deleteGuestCharacter,
	ensureGuestCharacters,
	getGuestCharacter,
	loadGuestCharacters,
	updateGuestCharacter
} from './localFirstCharacterPipeline';

function makeDbCharacter(
	overrides: Partial<CairnCharacterIndexedDB> = {}
): CairnCharacterIndexedDB {
	return {
		id: 'local_char_1',
		name: 'Ash',
		role: 'Ranger',
		background: 'Border scout',
		level: 4,
		experience: 1200,
		str: 14,
		dex: 15,
		con: 12,
		int: 10,
		wis: 13,
		cha: 8,
		hp: 18,
		maxHp: 20,
		hitDie: 'd8',
		armorClass: 14,
		proficiencyBonus: 2,
		savingThrows: '["DEX","WIS"]',
		skills: '["Tracking","Stealth"]',
		proficiencies: '["Longbow"]',
		languages: '["Common"]',
		equipment: '["Rope","Torch"]',
		weapons: '[{"name":"Longbow","damage":"1d8","properties":"Range"}]',
		armor: '[{"name":"Leather","ac":11,"properties":"Light"}]',
		spells: '["Hunter Mark"]',
		spellSlots: '{"1":2}',
		gold: 7,
		silver: 2,
		copper: 1,
		traits: '["Patient"]',
		ideals: 'Balance',
		bonds: 'The old road',
		flaws: 'Withdrawn',
		conditions: '[]',
		features: '["Trail Sense"]',
		notes: 'Keeps watch at dusk',
		avatarUrl: '/ash.png',
		createdAt: new Date('2024-01-01T00:00:00.000Z'),
		updatedAt: new Date('2024-01-02T00:00:00.000Z'),
		...overrides
	};
}

beforeEach(() => {
	mockEnvironment.browser = true;
	vi.clearAllMocks();
});

describe('localFirstCharacterPipeline', () => {
	it('returns an empty list when not in the browser', async () => {
		mockEnvironment.browser = false;

		await expect(loadGuestCharacters()).resolves.toEqual([]);
		expect(mockIndexedDb.getAllLocalCharacters).not.toHaveBeenCalled();
	});

	it('returns null or false for guest mutations outside the browser', async () => {
		mockEnvironment.browser = false;

		await expect(getGuestCharacter('local_char_1')).resolves.toBeNull();
		await expect(createGuestCharacter(mockDemoCharacter)).resolves.toBeNull();
		await expect(updateGuestCharacter('local_char_1', { name: 'Updated' })).resolves.toBeNull();
		await expect(deleteGuestCharacter('local_char_1')).resolves.toBe(false);
		await expect(clearGuestCharacters()).resolves.toBe(false);

		expect(mockIndexedDb.getLocalCharacter).not.toHaveBeenCalled();
		expect(mockIndexedDb.createLocalCharacter).not.toHaveBeenCalled();
		expect(mockIndexedDb.updateLocalCharacter).not.toHaveBeenCalled();
		expect(mockIndexedDb.deleteLocalCharacter).not.toHaveBeenCalled();
		expect(mockIndexedDb.clearAllLocalCharacters).not.toHaveBeenCalled();
	});

	it('maps IndexedDB records into guest characters', async () => {
		mockIndexedDb.getAllLocalCharacters.mockResolvedValue([makeDbCharacter()]);

		const characters = await loadGuestCharacters();

		expect(characters).toHaveLength(1);
		expect(characters[0]).toMatchObject({
			id: 'local_char_1',
			name: 'Ash',
			role: 'Ranger',
			attributes: {
				STR: 14,
				DEX: 15,
				CON: 12,
				INT: 10,
				WIS: 13,
				CHA: 8
			},
			skills: ['Tracking', 'Stealth'],
			spellSlots: { '1': 2 }
		});
	});

	it('falls back safely when IndexedDB JSON fields are malformed', async () => {
		mockIndexedDb.getAllLocalCharacters.mockResolvedValue([
			makeDbCharacter({
				savingThrows: 'bad json',
				traits: undefined
			})
		]);

		const [character] = await loadGuestCharacters();

		expect(character.savingThrows).toEqual([]);
		expect(character.traits).toEqual([]);
	});

	it('keeps existing guest characters without seeding a demo record', async () => {
		mockIndexedDb.getAllLocalCharacters.mockResolvedValue([makeDbCharacter()]);

		const characters = await ensureGuestCharacters();

		expect(characters).toHaveLength(1);
		expect(mockIndexedDb.createLocalCharacter).not.toHaveBeenCalled();
	});

	it('seeds the demo character when guest storage is empty', async () => {
		mockIndexedDb.getAllLocalCharacters.mockResolvedValue([]);
		mockIndexedDb.createLocalCharacter.mockImplementation(async (character) =>
			makeDbCharacter({
				id: 'local_demo',
				name: character.name,
				role: character.role,
				background: character.background,
				level: character.level,
				experience: character.experience,
				str: character.str,
				dex: character.dex,
				con: character.con,
				int: character.int,
				wis: character.wis,
				cha: character.cha,
				hp: character.hp,
				maxHp: character.maxHp,
				hitDie: character.hitDie,
				armorClass: character.armorClass,
				proficiencyBonus: character.proficiencyBonus,
				savingThrows: character.savingThrows,
				skills: character.skills,
				proficiencies: character.proficiencies,
				languages: character.languages,
				equipment: character.equipment,
				weapons: character.weapons,
				armor: character.armor,
				spells: character.spells,
				spellSlots: character.spellSlots,
				gold: character.gold,
				silver: character.silver,
				copper: character.copper,
				traits: character.traits,
				ideals: character.ideals,
				bonds: character.bonds,
				flaws: character.flaws,
				conditions: character.conditions,
				features: character.features,
				notes: character.notes,
				avatarUrl: character.avatarUrl
			})
		);

		const [character] = await ensureGuestCharacters();

		expect(mockIndexedDb.createLocalCharacter).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Demo Guest',
				str: 13,
				skills: JSON.stringify(['Survival'])
			})
		);
		expect(character).toMatchObject({
			id: 'local_demo',
			name: 'Demo Guest',
			skills: ['Survival']
		});
	});

	it('creates and converts a guest character for storage', async () => {
		mockIndexedDb.createLocalCharacter.mockResolvedValue(
			makeDbCharacter({
				id: 'local_created',
				name: 'New Scout',
				skills: '["Pathfinding"]'
			})
		);

		const created = await createGuestCharacter({
			...mockDemoCharacter,
			name: 'New Scout',
			skills: ['Pathfinding']
		});

		expect(mockIndexedDb.createLocalCharacter).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'New Scout',
				skills: JSON.stringify(['Pathfinding'])
			})
		);
		expect(created).toMatchObject({
			id: 'local_created',
			name: 'New Scout',
			skills: ['Pathfinding']
		});
	});

	it('loads a specific guest character by id', async () => {
		mockIndexedDb.getLocalCharacter.mockResolvedValue(makeDbCharacter({ id: 'local_target' }));

		const character = await getGuestCharacter('local_target');

		expect(mockIndexedDb.getLocalCharacter).toHaveBeenCalledWith('local_target');
		expect(character?.id).toBe('local_target');
	});

	it('returns null when a guest character id does not exist', async () => {
		mockIndexedDb.getLocalCharacter.mockResolvedValue(undefined);

		await expect(getGuestCharacter('missing_local_char')).resolves.toBeNull();
	});

	it('updates only provided guest fields and reloads the character', async () => {
		mockIndexedDb.updateLocalCharacter.mockResolvedValue(undefined);
		mockIndexedDb.getLocalCharacter.mockResolvedValue(
			makeDbCharacter({
				id: 'local_target',
				name: 'Updated Ash',
				str: 16,
				dex: 12,
				skills: '["Tracking","Lore"]',
				notes: 'Updated notes'
			})
		);

		const updated = await updateGuestCharacter('local_target', {
			name: 'Updated Ash',
			attributes: {
				STR: 16,
				DEX: 12,
				CON: 12,
				INT: 10,
				WIS: 13,
				CHA: 8
			},
			skills: ['Tracking', 'Lore'],
			notes: 'Updated notes'
		});

		expect(mockIndexedDb.updateLocalCharacter).toHaveBeenCalledWith('local_target', {
			name: 'Updated Ash',
			str: 16,
			dex: 12,
			con: 12,
			int: 10,
			wis: 13,
			cha: 8,
			skills: JSON.stringify(['Tracking', 'Lore']),
			notes: 'Updated notes'
		});
		expect(updated).toMatchObject({
			id: 'local_target',
			name: 'Updated Ash',
			skills: ['Tracking', 'Lore'],
			notes: 'Updated notes'
		});
	});

	it('deletes and clears guest characters in the browser', async () => {
		mockIndexedDb.deleteLocalCharacter.mockResolvedValue(undefined);
		mockIndexedDb.clearAllLocalCharacters.mockResolvedValue(undefined);

		await expect(deleteGuestCharacter('local_target')).resolves.toBe(true);
		await expect(clearGuestCharacters()).resolves.toBe(true);

		expect(mockIndexedDb.deleteLocalCharacter).toHaveBeenCalledWith('local_target');
		expect(mockIndexedDb.clearAllLocalCharacters).toHaveBeenCalledTimes(1);
	});
});
