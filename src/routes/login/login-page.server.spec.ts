import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVerifyUserCredentials = vi.hoisted(() => vi.fn());
const mockCreateSession = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/auth', () => ({
	verifyUserCredentials: mockVerifyUserCredentials,
	createSession: mockCreateSession
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

describe('/login +page.server actions', () => {
	it('fails when required fields are missing', async () => {
		const result = await actions.default({
			request: makeRequest({ username: '', password: '' }),
			cookies: makeCookies()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Username and password are required' }
		});
	});

	it('fails when credentials are invalid', async () => {
		mockVerifyUserCredentials.mockResolvedValue(null);

		const result = await actions.default({
			request: makeRequest({ username: 'ash', password: 'wrong' }),
			cookies: makeCookies()
		} as never);

		expect(mockVerifyUserCredentials).toHaveBeenCalledWith('ash', 'wrong');
		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid username or password' }
		});
	});

	it('sets the session cookie and redirects on success', async () => {
		const cookies = makeCookies();
		mockVerifyUserCredentials.mockResolvedValue({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});
		mockCreateSession.mockResolvedValue({ id: 'session_1' });

		await expect(
			actions.default({
				request: makeRequest({ username: 'ash', password: 'secret' }),
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
