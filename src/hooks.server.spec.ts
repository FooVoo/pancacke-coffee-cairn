import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

const mockInitDb = vi.hoisted(() => vi.fn());
const mockGetUserFromRequest = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	initDb: mockInitDb
}));

vi.mock('$lib/server/auth', () => ({
	getUserFromRequest: mockGetUserFromRequest
}));

describe('hooks.server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('initializes the database on module load and attaches the resolved user', async () => {
		mockInitDb.mockResolvedValue(undefined);
		mockGetUserFromRequest.mockResolvedValue({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		const { handle } = await import('./hooks.server');
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));
		const event = {
			locals: {}
		} as unknown as RequestEvent;

		const response = await handle({
			event,
			resolve
		} as unknown as Parameters<typeof handle>[0]);

		expect(mockInitDb).toHaveBeenCalledTimes(1);
		expect(consoleSpy).toHaveBeenCalledWith('Database initialized');
		expect(mockGetUserFromRequest).toHaveBeenCalledWith(event);
		expect(event.locals.user).toEqual({
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		});
		expect(resolve).toHaveBeenCalledWith(event);
		expect(response).toBeInstanceOf(Response);
	});

	it('stores a null user when the request is anonymous', async () => {
		mockInitDb.mockResolvedValue(undefined);
		mockGetUserFromRequest.mockResolvedValue(null);

		const { handle } = await import('./hooks.server');
		const resolve = vi.fn().mockResolvedValue('resolved');
		const event = {
			locals: {}
		} as unknown as RequestEvent;

		const response = await handle({
			event,
			resolve
		} as unknown as Parameters<typeof handle>[0]);

		expect(event.locals.user).toBeNull();
		expect(response).toBe('resolved');
	});
});
