import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateUser = vi.hoisted(() => vi.fn());
const mockCreateSession = vi.hoisted(() => vi.fn());
const mockGetUserByUsername = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/auth', () => ({
	createUser: mockCreateUser,
	createSession: mockCreateSession,
	getUserByUsername: mockGetUserByUsername
}));

vi.mock('$lib/server/env', () => ({
	env: {
		isProduction: false,
		session: {
			maxAge: 60
		}
	}
}));

import { actions } from './+page.server';

function makeRequest(fields: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		data.set(key, value);
	}

	return {
		formData: vi.fn().mockResolvedValue(data)
	};
}

function makeCookies() {
	return {
		set: vi.fn()
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('/register +page.server actions', () => {
	it('fails when required fields are missing', async () => {
		const result = await actions.default({
			request: makeRequest({ username: '', email: '', password: '' }),
			cookies: makeCookies()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'All fields are required' }
		});
	});

	it('fails when the password is too short', async () => {
		const result = await actions.default({
			request: makeRequest({ username: 'ash', email: 'ash@example.com', password: '123' }),
			cookies: makeCookies()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Password must be at least 4 characters' }
		});
	});

	it('fails when the username already exists', async () => {
		mockGetUserByUsername.mockResolvedValue({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});

		const result = await actions.default({
			request: makeRequest({ username: 'ash', email: 'ash@example.com', password: '1234' }),
			cookies: makeCookies()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Username already exists' }
		});
	});

	it('returns a 500 failure when user creation throws', async () => {
		mockGetUserByUsername.mockResolvedValue(null);
		mockCreateUser.mockRejectedValue(new Error('db unavailable'));

		const result = await actions.default({
			request: makeRequest({ username: 'ash', email: 'ash@example.com', password: '1234' }),
			cookies: makeCookies()
		} as never);

		expect(result).toMatchObject({
			status: 500,
			data: { error: 'Failed to create account' }
		});
	});

	it('sets the session cookie and redirects on success', async () => {
		const cookies = makeCookies();
		mockGetUserByUsername.mockResolvedValue(null);
		mockCreateUser.mockResolvedValue({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});
		mockCreateSession.mockResolvedValue({ id: 'session_1' });

		await expect(
			actions.default({
				request: makeRequest({ username: 'ash', email: 'ash@example.com', password: '1234' }),
				cookies
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/characters'
		});

		expect(cookies.set).toHaveBeenCalledWith('session_id', 'session_1', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: false,
			maxAge: 60
		});
	});
});
