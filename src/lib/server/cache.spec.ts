import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cache, stopCacheCleanup } from './cache';

describe('Cache', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	afterAll(() => {
		stopCacheCleanup();
	});

	it('returns cached values before their TTL expires', () => {
		const cache = new Cache<string>(5);
		cache.set('session:1', 'value');

		vi.advanceTimersByTime(4_000);

		expect(cache.get('session:1')).toBe('value');
		expect(cache.getStats()).toEqual({
			size: 1,
			keys: ['session:1']
		});
	});

	it('drops expired entries when they are read', () => {
		const cache = new Cache<string>(1);
		cache.set('session:1', 'value');

		vi.advanceTimersByTime(1_001);

		expect(cache.get('session:1')).toBeNull();
		expect(cache.getStats()).toEqual({
			size: 0,
			keys: []
		});
	});

	it('uses a custom TTL and cleanup removes only expired entries', () => {
		const cache = new Cache<string>(30);
		cache.set('short', 'a', 1);
		cache.set('long', 'b', 10);

		vi.advanceTimersByTime(1_500);
		cache.cleanup();

		expect(cache.get('short')).toBeNull();
		expect(cache.get('long')).toBe('b');
		expect(cache.getStats()).toEqual({
			size: 1,
			keys: ['long']
		});
	});

	it('supports delete and clear operations', () => {
		const cache = new Cache<string>(30);
		cache.set('first', 'a');
		cache.set('second', 'b');

		cache.delete('first');
		expect(cache.getStats()).toEqual({
			size: 1,
			keys: ['second']
		});

		cache.clear();
		expect(cache.getStats()).toEqual({
			size: 0,
			keys: []
		});
	});
});
