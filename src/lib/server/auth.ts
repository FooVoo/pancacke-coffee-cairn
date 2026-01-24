import { getDb } from './db';
import type { RequestEvent } from '@sveltejs/kit';
import { sessionCache, userCache, userByUsernameCache } from './cache';

export interface User {
	id: string;
	username: string;
	email: string;
}

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
}

// Mock authentication utilities
// ⚠️ WARNING: These are DEVELOPMENT MOCKS ONLY and provide NO SECURITY
// In production, use proper password hashing (bcrypt, argon2, etc.)
export function hashPassword(password: string): string {
	// MOCK: In production, use proper hashing like bcrypt.hash()
	return `mock_hash_${password}`;
}

export function verifyPassword(password: string, hash: string): boolean {
	// MOCK: In production, use proper verification like bcrypt.compare()
	return hash === `mock_hash_${password}`;
}

// ⚠️ WARNING: These ID generators are NOT suitable for production
// In production, use proper UUID libraries (crypto.randomUUID() or uuid package)
export function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

export function generateUserId(): string {
	return `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

export async function createUser(username: string, email: string, password: string): Promise<User> {
	const db = getDb();
	const userId = generateUserId();
	const passwordHash = hashPassword(password);

	await db.execute({
		sql: 'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
		args: [userId, username, email, passwordHash]
	});

	return {
		id: userId,
		username,
		email
	};
}

export async function getUserByUsername(username: string): Promise<User | null> {
	// Check cache first
	const cacheKey = `username:${username}`;
	const cached = userByUsernameCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const db = getDb();

	const result = await db.execute({
		sql: 'SELECT id, username, email FROM users WHERE username = ?',
		args: [username]
	});

	if (result.rows.length === 0) {
		return null;
	}

	const row = result.rows[0];
	const user = {
		id: row.id as string,
		username: row.username as string,
		email: row.email as string
	};

	// Cache the result
	userByUsernameCache.set(cacheKey, user);

	return user;
}

export async function verifyUserCredentials(
	username: string,
	password: string
): Promise<User | null> {
	const db = getDb();

	const result = await db.execute({
		sql: 'SELECT id, username, email, password_hash FROM users WHERE username = ?',
		args: [username]
	});

	if (result.rows.length === 0) {
		return null;
	}

	const row = result.rows[0];
	const passwordHash = row.password_hash as string;

	if (!verifyPassword(password, passwordHash)) {
		return null;
	}

	return {
		id: row.id as string,
		username: row.username as string,
		email: row.email as string
	};
}

export async function createSession(userId: string): Promise<Session> {
	const db = getDb();
	const sessionId = generateSessionId();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

	await db.execute({
		sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
		args: [sessionId, userId, expiresAt.toISOString()]
	});

	const session = {
		id: sessionId,
		userId,
		expiresAt
	};

	// Cache the session
	sessionCache.set(`session:${sessionId}`, session);

	return session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
	// Check cache first
	const cacheKey = `session:${sessionId}`;
	const cached = sessionCache.get(cacheKey);
	if (cached) {
		// Verify it's not expired
		if (new Date(cached.expiresAt) > new Date()) {
			return cached;
		}
		// If expired, remove from cache
		sessionCache.delete(cacheKey);
		return null;
	}

	const db = getDb();

	const result = await db.execute({
		sql: 'SELECT id, user_id, expires_at FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP',
		args: [sessionId]
	});

	if (result.rows.length === 0) {
		return null;
	}

	const row = result.rows[0];
	const session = {
		id: row.id as string,
		userId: row.user_id as string,
		expiresAt: new Date(row.expires_at as string)
	};

	// Cache the session
	sessionCache.set(cacheKey, session);

	return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
	const db = getDb();

	await db.execute({
		sql: 'DELETE FROM sessions WHERE id = ?',
		args: [sessionId]
	});

	// Remove from cache
	sessionCache.delete(`session:${sessionId}`);
}

export async function getUserFromSession(sessionId: string): Promise<User | null> {
	const session = await getSession(sessionId);
	if (!session) {
		return null;
	}

	// Check user cache first
	const cacheKey = `user:${session.userId}`;
	const cached = userCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const db = getDb();
	const result = await db.execute({
		sql: 'SELECT id, username, email FROM users WHERE id = ?',
		args: [session.userId]
	});

	if (result.rows.length === 0) {
		return null;
	}

	const row = result.rows[0];
	const user = {
		id: row.id as string,
		username: row.username as string,
		email: row.email as string
	};

	// Cache the user
	userCache.set(cacheKey, user);

	return user;
}

// Helper to get user from request event
export async function getUserFromRequest(event: RequestEvent): Promise<User | null> {
	const sessionId = event.cookies.get('session_id');
	if (!sessionId) {
		return null;
	}

	return getUserFromSession(sessionId);
}
