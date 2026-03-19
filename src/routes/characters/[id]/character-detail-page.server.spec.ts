import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetCharacter = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/characters', () => ({
	getCharacter: mockGetCharacter
}));

import { load } from './+page.server';

beforeEach(() => {
	vi.clearAllMocks();
});

describe('/characters/[id] +page.server', () => {
	it('returns guest metadata instead of throwing for unauthorized users', async () => {
		const result = await load({
			params: { id: 'local_char_1' },
			locals: { user: null }
		} as Parameters<typeof load>[0]);

		expect(mockGetCharacter).not.toHaveBeenCalled();
		expect(result).toEqual({
			character: null,
			characterId: 'local_char_1',
			isAuthenticated: false,
			user: null
		});
	});

	it('returns the requested server character for authenticated users', async () => {
		const user = {
			id: 'user_1',
			username: 'ash',
			email: 'ash@example.com'
		};
		const character = { id: 'char_1', name: 'Ash' };
		mockGetCharacter.mockResolvedValue(character);

		const result = await load({
			params: { id: 'char_1' },
			locals: { user }
		} as Parameters<typeof load>[0]);

		expect(mockGetCharacter).toHaveBeenCalledWith('char_1', 'user_1');
		expect(result).toEqual({
			character,
			characterId: 'char_1',
			isAuthenticated: true,
			user
		});
	});

	it('throws a 404 when an authenticated character cannot be found', async () => {
		mockGetCharacter.mockResolvedValue(null);

		await expect(
			load({
				params: { id: 'missing_char' },
				locals: {
					user: {
						id: 'user_1',
						username: 'ash',
						email: 'ash@example.com'
					}
				}
			} as Parameters<typeof load>[0])
		).rejects.toMatchObject({
			status: 404,
			body: { message: 'Character not found' }
		});
	});
});
