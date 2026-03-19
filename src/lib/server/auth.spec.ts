import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

const mockExecute = vi.hoisted(() => vi.fn());
const mockSessionCache = vi.hoisted(() => ({
	get: vi.fn(),
	set: vi.fn(),
	delete: vi.fn()
}));
const mockUserCache = vi.hoisted(() => ({
	get: vi.fn(),
	set: vi.fn(),
	delete: vi.fn()
}));
const mockUserByUsernameCache = vi.hoisted(() => ({
	get: vi.fn(),
	set: vi.fn(),
	delete: vi.fn()
}));

vi.mock('./db', () => ({
	getDb: () => ({
		execute: mockExecute
	})
}));

vi.mock('./cache', () => ({
	sessionCache: mockSessionCache,
	userCache: mockUserCache,
	userByUsernameCache: mockUserByUsernameCache
}));

import {
	createSession,
	createUser,
	deleteSession,
	generateSessionId,
	generateUserId,
	getSession,
	getUserByUsername,
	getUserFromRequest,
	getUserFromSession,
	hashPassword,
	verifyPassword,
	verifyUserCredentials
} from './auth';

beforeEach(() => {
	vi.clearAllMocks();
});

describe('auth helpers', () => {
	it('hashes and verifies passwords with the mock scheme', () => {
		expect(hashPassword('secret')).toBe('mock_hash_secret');
		expect(verifyPassword('secret', 'mock_hash_secret')).toBe(true);
		expect(verifyPassword('wrong', 'mock_hash_secret')).toBe(false);
	});

	it('generates prefixed ids for users and sessions', () => {
		expect(generateUserId()).toMatch(/^user_/);
		expect(generateSessionId()).toMatch(/^session_/);
	});

	it('creates a user and persists the hashed password', async () => {
		mockExecute.mockResolvedValue({ rows: [] });

		const user = await createUser('ash', 'ash@example.com', 'secret');

		expect(user).toMatchObject({
			username: 'ash',
			email: 'ash@example.com'
		});
		expect(user.id).toMatch(/^user_/);
		expect(mockExecute).toHaveBeenCalledWith({
			sql: 'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
			args: [user.id, 'ash', 'ash@example.com', 'mock_hash_secret']
		});
	});

	it('returns cached users by username without querying the database', async () => {
		const cachedUser = {
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		};
		mockUserByUsernameCache.get.mockReturnValue(cachedUser);

		await expect(getUserByUsername('ash')).resolves.toEqual(cachedUser);
		expect(mockExecute).not.toHaveBeenCalled();
	});

	it('loads users by username from the database and caches them', async () => {
		mockUserByUsernameCache.get.mockReturnValue(null);
		mockExecute.mockResolvedValue({
			rows: [{ id: 'user_1', username: 'ash', email: 'ash@example.com' }]
		});

		const user = await getUserByUsername('ash');

		expect(user).toEqual({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});
		expect(mockUserByUsernameCache.set).toHaveBeenCalledWith('username:ash', user);
	});

	it('returns null when a username lookup misses', async () => {
		mockUserByUsernameCache.get.mockReturnValue(null);
		mockExecute.mockResolvedValue({ rows: [] });

		await expect(getUserByUsername('missing')).resolves.toBeNull();
	});

	it('validates credentials against stored password hashes', async () => {
		mockExecute
			.mockResolvedValueOnce({ rows: [] })
			.mockResolvedValueOnce({
				rows: [
					{
						id: 'user_1',
						username: 'ash',
						email: 'ash@example.com',
						password_hash: 'mock_hash_secret'
					}
				]
			})
			.mockResolvedValueOnce({
				rows: [
					{
						id: 'user_1',
						username: 'ash',
						email: 'ash@example.com',
						password_hash: 'mock_hash_secret'
					}
				]
			});

		await expect(verifyUserCredentials('missing', 'secret')).resolves.toBeNull();
		await expect(verifyUserCredentials('ash', 'wrong')).resolves.toBeNull();
		await expect(verifyUserCredentials('ash', 'secret')).resolves.toEqual({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});
	});

	it('creates a session, persists it, and caches it', async () => {
		mockExecute.mockResolvedValue({ rows: [] });

		const session = await createSession('user_1');

		expect(session.id).toMatch(/^session_/);
		expect(session.userId).toBe('user_1');
		expect(session.expiresAt).toBeInstanceOf(Date);
		expect(mockExecute).toHaveBeenCalledWith({
			sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
			args: [session.id, 'user_1', session.expiresAt.toISOString()]
		});
		expect(mockSessionCache.set).toHaveBeenCalledWith(`session:${session.id}`, session);
	});

	it('returns cached sessions when still valid and drops expired cached sessions', async () => {
		const validSession = {
			id: 'session_valid',
			userId: 'user_1',
			expiresAt: new Date(Date.now() + 60_000)
		};
		const expiredSession = {
			id: 'session_expired',
			userId: 'user_1',
			expiresAt: new Date(Date.now() - 60_000)
		};

		mockSessionCache.get.mockReturnValueOnce(validSession).mockReturnValueOnce(expiredSession);

		await expect(getSession('session_valid')).resolves.toEqual(validSession);
		await expect(getSession('session_expired')).resolves.toBeNull();

		expect(mockExecute).not.toHaveBeenCalled();
		expect(mockSessionCache.delete).toHaveBeenCalledWith('session:session_expired');
	});

	it('loads sessions from the database and caches them on a cache miss', async () => {
		mockSessionCache.get.mockReturnValue(null);
		mockExecute.mockResolvedValue({
			rows: [{ id: 'session_1', user_id: 'user_1', expires_at: '2030-01-01T00:00:00.000Z' }]
		});

		const session = await getSession('session_1');

		expect(session).toEqual({
			id: 'session_1',
			userId: 'user_1',
			expiresAt: new Date('2030-01-01T00:00:00.000Z')
		});
		expect(mockSessionCache.set).toHaveBeenCalledWith('session:session_1', session);
	});

	it('deletes sessions from both the database and cache', async () => {
		mockExecute.mockResolvedValue({ rows: [] });

		await deleteSession('session_1');

		expect(mockExecute).toHaveBeenCalledWith({
			sql: 'DELETE FROM sessions WHERE id = ?',
			args: ['session_1']
		});
		expect(mockSessionCache.delete).toHaveBeenCalledWith('session:session_1');
	});

	it('returns cached users from a session lookup without hitting the database', async () => {
		mockSessionCache.get.mockReturnValue({
			id: 'session_1',
			userId: 'user_1',
			expiresAt: new Date(Date.now() + 60_000)
		});
		mockUserCache.get.mockReturnValue({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});

		await expect(getUserFromSession('session_1')).resolves.toEqual({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});
		expect(mockExecute).not.toHaveBeenCalled();
	});

	it('loads and caches users from a session lookup when necessary', async () => {
		mockSessionCache.get.mockReturnValue({
			id: 'session_1',
			userId: 'user_1',
			expiresAt: new Date(Date.now() + 60_000)
		});
		mockUserCache.get.mockReturnValue(null);
		mockExecute.mockResolvedValue({
			rows: [{ id: 'user_1', username: 'ash', email: 'ash@example.com' }]
		});

		const user = await getUserFromSession('session_1');

		expect(user).toEqual({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});
		expect(mockUserCache.set).toHaveBeenCalledWith('user:user_1', user);
	});

	it('returns null when a session or session user cannot be found', async () => {
		mockSessionCache.get.mockReturnValueOnce(null).mockReturnValueOnce({
			id: 'session_1',
			userId: 'user_1',
			expiresAt: new Date(Date.now() + 60_000)
		});
		mockExecute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
		mockUserCache.get.mockReturnValue(null);

		await expect(getUserFromSession('missing_session')).resolves.toBeNull();
		await expect(getUserFromSession('session_1')).resolves.toBeNull();
	});

	it('returns null for requests without a session cookie and delegates when present', async () => {
		const eventWithoutCookie = {
			cookies: {
				get: vi.fn().mockReturnValue(undefined)
			}
		} as unknown as RequestEvent;

		await expect(getUserFromRequest(eventWithoutCookie)).resolves.toBeNull();

		const eventWithCookie = {
			cookies: {
				get: vi.fn().mockReturnValue('session_1')
			}
		} as unknown as RequestEvent;
		mockSessionCache.get.mockReturnValue({
			id: 'session_1',
			userId: 'user_1',
			expiresAt: new Date(Date.now() + 60_000)
		});
		mockUserCache.get.mockReturnValue({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});

		await expect(getUserFromRequest(eventWithCookie)).resolves.toEqual({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});
		expect(eventWithCookie.cookies.get).toHaveBeenCalledWith('session_id');
	});
});
