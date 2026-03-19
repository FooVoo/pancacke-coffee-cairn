import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetCharactersByUser = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/characters', () => ({
	getCharactersByUser: mockGetCharactersByUser
}));

import { load } from './+page.server';

beforeEach(() => {
	vi.clearAllMocks();
});

describe('/characters +page.server', () => {
	it('returns authenticated characters for signed-in users', async () => {
		const user = {
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		};
		const characters = [{ id: 'char_1', name: 'Ash' }];
		mockGetCharactersByUser.mockResolvedValue(characters);

		const result = await load({
			locals: { user }
		} as Parameters<typeof load>[0]);

		expect(mockGetCharactersByUser).toHaveBeenCalledWith('user_1');
		expect(result).toEqual({
			user,
			characters,
			isAuthenticated: true
		});
	});

	it('returns an anonymous payload without hitting server storage for guests', async () => {
		const result = await load({
			locals: { user: null }
		} as Parameters<typeof load>[0]);

		expect(mockGetCharactersByUser).not.toHaveBeenCalled();
		expect(result).toEqual({
			user: null,
			characters: [],
			isAuthenticated: false
		});
	});
});
