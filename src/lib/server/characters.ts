import { getDb } from './db';

export interface CairnCharacter {
	id?: string;
	userId: string;
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

// ⚠️ WARNING: This ID generator is NOT suitable for production
// In production, use proper UUID libraries (crypto.randomUUID() or uuid package)
export function generateCharacterId(): string {
	return `char_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

export async function createCharacter(character: CairnCharacter): Promise<CairnCharacter> {
	const db = getDb();
	const id = generateCharacterId();

	await db.execute({
		sql: `INSERT INTO characters 
			(id, user_id, name, role, background, level, experience, str, dex, con, int, wis, cha, 
			hp, max_hp, hit_die, armor_class, proficiency_bonus, saving_throws, skills, proficiencies, 
			languages, equipment, weapons, armor, spells, spell_slots, gold, silver, copper, 
			traits, ideals, bonds, flaws, conditions, features, notes, avatar_url)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		args: [
			id,
			character.userId,
			character.name,
			character.role,
			character.background || null,
			character.level || 1,
			character.experience || 0,
			character.attributes.STR,
			character.attributes.DEX,
			character.attributes.CON,
			character.attributes.INT,
			character.attributes.WIS,
			character.attributes.CHA,
			character.hp,
			character.maxHp || character.hp,
			character.hitDie || null,
			character.armorClass || 10,
			character.proficiencyBonus || 2,
			JSON.stringify(character.savingThrows || []),
			JSON.stringify(character.skills),
			JSON.stringify(character.proficiencies || []),
			JSON.stringify(character.languages || []),
			JSON.stringify(character.equipment),
			JSON.stringify(character.weapons || []),
			JSON.stringify(character.armor || []),
			JSON.stringify(character.spells),
			JSON.stringify(character.spellSlots || {}),
			character.gold || 0,
			character.silver || 0,
			character.copper || 0,
			JSON.stringify(character.traits || []),
			character.ideals || null,
			character.bonds || null,
			character.flaws || null,
			JSON.stringify(character.conditions || []),
			JSON.stringify(character.features || []),
			character.notes || null,
			character.avatarUrl || null
		]
	});

	return {
		...character,
		id
	};
}

export async function getCharacter(id: string, userId: string): Promise<CairnCharacter | null> {
	const db = getDb();

	const result = await db.execute({
		sql: 'SELECT * FROM characters WHERE id = ? AND user_id = ?',
		args: [id, userId]
	});

	if (result.rows.length === 0) {
		return null;
	}

	const row = result.rows[0];
	return rowToCharacter(row);
}

export async function getCharactersByUser(userId: string): Promise<CairnCharacter[]> {
	const db = getDb();

	const result = await db.execute({
		sql: 'SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC',
		args: [userId]
	});

	return result.rows.map(rowToCharacter);
}

export async function updateCharacter(
	id: string,
	userId: string,
	updates: Partial<CairnCharacter>
): Promise<CairnCharacter | null> {
	const db = getDb();

	const fields: string[] = [];
	const args: any[] = [];

	if (updates.name !== undefined) {
		fields.push('name = ?');
		args.push(updates.name);
	}
	if (updates.role !== undefined) {
		fields.push('role = ?');
		args.push(updates.role);
	}
	if (updates.background !== undefined) {
		fields.push('background = ?');
		args.push(updates.background);
	}
	if (updates.level !== undefined) {
		fields.push('level = ?');
		args.push(updates.level);
	}
	if (updates.attributes) {
		fields.push('str = ?', 'dex = ?', 'con = ?', 'int = ?', 'wis = ?', 'cha = ?');
		args.push(
			updates.attributes.STR,
			updates.attributes.DEX,
			updates.attributes.CON,
			updates.attributes.INT,
			updates.attributes.WIS,
			updates.attributes.CHA
		);
	}
	if (updates.hp !== undefined) {
		fields.push('hp = ?');
		args.push(updates.hp);
	}
	if (updates.hitDie !== undefined) {
		fields.push('hit_die = ?');
		args.push(updates.hitDie);
	}
	if (updates.skills) {
		fields.push('skills = ?');
		args.push(JSON.stringify(updates.skills));
	}
	if (updates.equipment) {
		fields.push('equipment = ?');
		args.push(JSON.stringify(updates.equipment));
	}
	if (updates.spells) {
		fields.push('spells = ?');
		args.push(JSON.stringify(updates.spells));
	}
	if (updates.gold !== undefined) {
		fields.push('gold = ?');
		args.push(updates.gold);
	}
	if (updates.notes !== undefined) {
		fields.push('notes = ?');
		args.push(updates.notes);
	}
	if (updates.avatarUrl !== undefined) {
		fields.push('avatar_url = ?');
		args.push(updates.avatarUrl);
	}

	fields.push('updated_at = CURRENT_TIMESTAMP');

	args.push(id, userId);

	await db.execute({
		sql: `UPDATE characters SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
		args
	});

	return getCharacter(id, userId);
}

export async function deleteCharacter(id: string, userId: string): Promise<void> {
	const db = getDb();

	await db.execute({
		sql: 'DELETE FROM characters WHERE id = ? AND user_id = ?',
		args: [id, userId]
	});
}

function rowToCharacter(row: any): CairnCharacter {
	return {
		id: row.id as string,
		userId: row.user_id as string,
		name: row.name as string,
		role: row.role as string,
		background: row.background as string,
		level: row.level as number,
		experience: row.experience as number,
		attributes: {
			STR: row.str as number,
			DEX: row.dex as number,
			CON: row.con as number,
			INT: row.int as number,
			WIS: row.wis as number,
			CHA: row.cha as number
		},
		hp: row.hp as number,
		maxHp: row.max_hp as number,
		hitDie: row.hit_die as string,
		armorClass: row.armor_class as number,
		proficiencyBonus: row.proficiency_bonus as number,
		savingThrows: JSON.parse(row.saving_throws as string || '[]'),
		skills: JSON.parse(row.skills as string),
		proficiencies: JSON.parse(row.proficiencies as string || '[]'),
		languages: JSON.parse(row.languages as string || '[]'),
		equipment: JSON.parse(row.equipment as string),
		weapons: JSON.parse(row.weapons as string || '[]'),
		armor: JSON.parse(row.armor as string || '[]'),
		spells: JSON.parse(row.spells as string),
		spellSlots: JSON.parse(row.spell_slots as string || '{}'),
		gold: row.gold as number,
		silver: row.silver as number,
		copper: row.copper as number,
		traits: JSON.parse(row.traits as string || '[]'),
		ideals: row.ideals as string,
		bonds: row.bonds as string,
		flaws: row.flaws as string,
		conditions: JSON.parse(row.conditions as string || '[]'),
		features: JSON.parse(row.features as string || '[]'),
		notes: row.notes as string,
		avatarUrl: row.avatar_url as string,
		createdAt: new Date(row.created_at as string),
		updatedAt: new Date(row.updated_at as string)
	};
}
