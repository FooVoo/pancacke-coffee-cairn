/**
 * Demo data utilities for creating initial characters
 */

export function getDemoCharacter() {
	return {
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
	};
}
