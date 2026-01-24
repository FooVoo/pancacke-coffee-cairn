import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getCharactersByUser } from '$lib/server/characters';
import { createUser, getUserByUsername, createSession } from '$lib/server/auth';
import { createCharacter } from '$lib/server/characters';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	// Auto-create demo user if not exists and not logged in
	if (!locals.user) {
		const demoUsername = 'demo';
		let demoUser = await getUserByUsername(demoUsername);

		if (!demoUser) {
			// Create demo user
			demoUser = await createUser(demoUsername, 'demo@example.com', 'demo');

			// Create demo character with enriched data
			await createCharacter({
				userId: demoUser.id,
				name: 'Edrin Thorn',
				role: 'Hedge Mystic',
				background: 'Wandered the borderlands as a herbalist and lore-seeker.',
				level: 3,
				experience: 900,
				attributes: {
					STR: 10,
					DEX: 12,
					CON: 11,
					INT: 14,
					WIS: 13,
					CHA: 9
				},
				hp: 18,
				maxHp: 24,
				hitDie: 'd6',
				armorClass: 12,
				proficiencyBonus: 2,
				savingThrows: ['INT', 'WIS'],
				skills: ['Forage', 'Herbalism', 'Lore (folklore)', 'Arcana', 'Investigation'],
				proficiencies: ['Herbalism Kit', 'Alchemist Supplies'],
				languages: ['Common', 'Elvish', 'Draconic'],
				equipment: ['Worn cloak', 'Tinderbox', '2 days rations', 'Waterskin', 'Backpack'],
				weapons: [
					{ name: 'Quarterstaff', damage: '1d6', properties: 'Versatile (1d8)' },
					{ name: 'Dagger', damage: '1d4', properties: 'Light, Thrown (20/60)' }
				],
				armor: [{ name: 'Leather Armor', ac: 11, properties: 'Light' }],
				spells: [
					'Lesser Ward (protect 1)',
					'Guiding Ember (small light)',
					'Detect Magic',
					'Healing Word'
				],
				spellSlots: { '1': 4, '2': 2 },
				gold: 15,
				silver: 8,
				copper: 23,
				traits: ['Cautious', 'Knowledgeable', 'Resourceful'],
				ideals: 'Knowledge should be preserved and shared with those who seek it.',
				bonds: 'I seek the lost tome of herb lore that belonged to my mentor.',
				flaws:
					'I am too curious for my own good and often get into trouble investigating mysteries.',
				conditions: [],
				features: ['Ritual Casting', 'Herbalist Training', 'Lore Keeper'],
				notes:
					'Prefers diplomacy but knows simple defensive magics and remedies. Currently searching for ancient texts in the borderlands.'
			});
		}

		// Auto-login demo user
		const session = await createSession(demoUser.id);
		cookies.set('session_id', session.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, '/characters');
	}

	const characters = await getCharactersByUser(locals.user.id);

	return {
		user: locals.user,
		characters
	};
};
