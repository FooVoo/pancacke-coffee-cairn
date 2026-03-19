import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Character } from '$lib/client/localFirstCharacterPipeline';

const mockPipeline = vi.hoisted(() => ({
	loadGuestCharacters: vi.fn(),
	ensureGuestCharacters: vi.fn(),
	getGuestCharacter: vi.fn(),
	createGuestCharacter: vi.fn(),
	updateGuestCharacter: vi.fn(),
	deleteGuestCharacter: vi.fn(),
	clearGuestCharacters: vi.fn()
}));

vi.mock('$lib/client/localFirstCharacterPipeline', () => ({
	...mockPipeline
}));

import { characterStore } from './characterStore';

function makeCharacter(overrides: Partial<Character> = {}): Character {
	return {
		id: 'local_char_1',
		name: 'Ash',
		role: 'Ranger',
		background: 'Border scout',
		level: 4,
		experience: 1200,
		attributes: {
			STR: 14,
			DEX: 15,
			CON: 12,
			INT: 10,
			WIS: 13,
			CHA: 8
		},
		hp: 18,
		maxHp: 20,
		hitDie: 'd8',
		armorClass: 14,
		proficiencyBonus: 2,
		savingThrows: ['DEX', 'WIS'],
		skills: ['Tracking', 'Stealth'],
		proficiencies: ['Longbow'],
		languages: ['Common'],
		equipment: ['Rope'],
		weapons: [{ name: 'Longbow', damage: '1d8', properties: 'Range' }],
		armor: [{ name: 'Leather', ac: 11, properties: 'Light' }],
		spells: ['Hunter Mark'],
		spellSlots: { '1': 2 },
		gold: 7,
		silver: 2,
		copper: 1,
		traits: ['Patient'],
		ideals: 'Balance',
		bonds: 'The old road',
		flaws: 'Withdrawn',
		conditions: [],
		features: ['Trail Sense'],
		notes: 'Keeps watch at dusk',
		avatarUrl: '/ash.png',
		...overrides
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	characterStore.set([]);
});

describe('characterStore', () => {
	it('loads guest characters without seeding by default', async () => {
		const characters = [makeCharacter()];
		mockPipeline.loadGuestCharacters.mockResolvedValue(characters);

		const loaded = await characterStore.loadLocal();

		expect(mockPipeline.loadGuestCharacters).toHaveBeenCalledTimes(1);
		expect(mockPipeline.ensureGuestCharacters).not.toHaveBeenCalled();
		expect(loaded).toEqual(characters);
		expect(get(characterStore)).toEqual(characters);
	});

	it('loads seeded guest characters when requested', async () => {
		const characters = [makeCharacter({ id: 'demo_char', name: 'Demo' })];
		mockPipeline.ensureGuestCharacters.mockResolvedValue(characters);

		const loaded = await characterStore.loadLocal({ seedDemo: true });

		expect(mockPipeline.ensureGuestCharacters).toHaveBeenCalledTimes(1);
		expect(loaded).toEqual(characters);
		expect(get(characterStore)).toEqual(characters);
	});

	it('proxies single-character lookups', async () => {
		const character = makeCharacter({ id: 'target' });
		mockPipeline.getGuestCharacter.mockResolvedValue(character);

		await expect(characterStore.getLocal('target')).resolves.toEqual(character);
		expect(mockPipeline.getGuestCharacter).toHaveBeenCalledWith('target');
	});

	it('prepends newly created guest characters to the store', async () => {
		const existing = makeCharacter({ id: 'existing' });
		const created = makeCharacter({ id: 'created', name: 'Created' });
		characterStore.set([existing]);
		mockPipeline.createGuestCharacter.mockResolvedValue(created);

		const result = await characterStore.addLocal(created);

		expect(result).toEqual(created);
		expect(get(characterStore)).toEqual([created, existing]);
	});

	it('keeps store state unchanged when character creation fails', async () => {
		const existing = makeCharacter({ id: 'existing' });
		characterStore.set([existing]);
		mockPipeline.createGuestCharacter.mockResolvedValue(null);

		await expect(characterStore.addLocal(makeCharacter({ id: 'created' }))).resolves.toBeNull();
		expect(get(characterStore)).toEqual([existing]);
	});

	it('replaces the updated character in the store', async () => {
		const original = makeCharacter({ id: 'original', name: 'Original' });
		const sibling = makeCharacter({ id: 'sibling', name: 'Sibling' });
		const updated = makeCharacter({ id: 'original', name: 'Updated' });
		characterStore.set([original, sibling]);
		mockPipeline.updateGuestCharacter.mockResolvedValue(updated);

		const result = await characterStore.updateLocal('original', { name: 'Updated' });

		expect(result).toEqual(updated);
		expect(get(characterStore)).toEqual([updated, sibling]);
	});

	it('keeps store state unchanged when an update does not return a character', async () => {
		const original = makeCharacter({ id: 'original', name: 'Original' });
		characterStore.set([original]);
		mockPipeline.updateGuestCharacter.mockResolvedValue(null);

		await expect(characterStore.updateLocal('original', { name: 'Updated' })).resolves.toBeNull();
		expect(get(characterStore)).toEqual([original]);
	});

	it('removes deleted guest characters from the store', async () => {
		const target = makeCharacter({ id: 'target' });
		const sibling = makeCharacter({ id: 'sibling' });
		characterStore.set([target, sibling]);
		mockPipeline.deleteGuestCharacter.mockResolvedValue(true);

		await expect(characterStore.deleteLocal('target')).resolves.toBe(true);
		expect(get(characterStore)).toEqual([sibling]);
	});

	it('keeps store state unchanged when a delete fails', async () => {
		const target = makeCharacter({ id: 'target' });
		characterStore.set([target]);
		mockPipeline.deleteGuestCharacter.mockResolvedValue(false);

		await expect(characterStore.deleteLocal('target')).resolves.toBe(false);
		expect(get(characterStore)).toEqual([target]);
	});

	it('clears the store after clearing guest storage', async () => {
		characterStore.set([makeCharacter()]);
		mockPipeline.clearGuestCharacters.mockResolvedValue(true);

		await expect(characterStore.clearLocal()).resolves.toBe(true);
		expect(get(characterStore)).toEqual([]);
	});

	it('keeps store state when clearing guest storage fails', async () => {
		const existing = makeCharacter();
		characterStore.set([existing]);
		mockPipeline.clearGuestCharacters.mockResolvedValue(false);

		await expect(characterStore.clearLocal()).resolves.toBe(false);
		expect(get(characterStore)).toEqual([existing]);
	});
});
