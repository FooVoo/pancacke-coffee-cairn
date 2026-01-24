import { createClient } from '@libsql/client';
import type { Client } from '@libsql/client';
import { env } from './env';

let dbClient: Client | null = null;

export function getDb(): Client {
	if (dbClient) {
		return dbClient;
	}

	// Use centralized env configuration
	dbClient = createClient({
		url: env.turso.databaseUrl,
		authToken: env.turso.authToken
	});

	return dbClient;
}

export async function initDb() {
	const db = getDb();

	// Create characters table with enriched fields
	await db.execute(`
		CREATE TABLE IF NOT EXISTS characters (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			role TEXT NOT NULL,
			background TEXT,
			level INTEGER DEFAULT 1,
			experience INTEGER DEFAULT 0,
			str INTEGER NOT NULL,
			dex INTEGER NOT NULL,
			con INTEGER NOT NULL,
			int INTEGER NOT NULL,
			wis INTEGER NOT NULL,
			cha INTEGER NOT NULL,
			hp INTEGER NOT NULL,
			max_hp INTEGER,
			hit_die TEXT,
			armor_class INTEGER DEFAULT 10,
			proficiency_bonus INTEGER DEFAULT 2,
			saving_throws TEXT,
			skills TEXT,
			proficiencies TEXT,
			languages TEXT,
			equipment TEXT,
			weapons TEXT,
			armor TEXT,
			spells TEXT,
			spell_slots TEXT,
			gold INTEGER DEFAULT 0,
			silver INTEGER DEFAULT 0,
			copper INTEGER DEFAULT 0,
			traits TEXT,
			ideals TEXT,
			bonds TEXT,
			flaws TEXT,
			conditions TEXT,
			features TEXT,
			notes TEXT,
			avatar_url TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Create users table for auth mock
	await db.execute(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Create sessions table for auth mock
	await db.execute(`
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			expires_at DATETIME NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
	`);

	return db;
}
