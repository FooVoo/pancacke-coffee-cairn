import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDeleteSession = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/auth', () => ({
	deleteSession: mockDeleteSession
}));

import { actions } from './+page.server';

function makeCookies(sessionId?: string) {
	return {
		get: vi.fn().mockReturnValue(sessionId),
		delete: vi.fn()
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('/logout +page.server actions', () => {
	it('deletes the server session, clears the cookie, and redirects', async () => {
		const cookies = makeCookies('session_1');

		await expect(actions.default({ cookies } as never)).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});

		expect(mockDeleteSession).toHaveBeenCalledWith('session_1');
		expect(cookies.delete).toHaveBeenCalledWith('session_id', { path: '/' });
	});

	it('still clears the cookie and redirects when no session exists', async () => {
		const cookies = makeCookies(undefined);

		await expect(actions.default({ cookies } as never)).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});

		expect(mockDeleteSession).not.toHaveBeenCalled();
		expect(cookies.delete).toHaveBeenCalledWith('session_id', { path: '/' });
	});
});
