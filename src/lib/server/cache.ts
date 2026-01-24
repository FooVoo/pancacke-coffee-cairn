/**
 * Aggressive caching layer for auth operations
 * Reduces database transactions by caching frequently accessed data
 */

export interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

export class Cache<T> {
	private cache: Map<string, CacheEntry<T>> = new Map();
	private ttl: number; // Time to live in milliseconds

	constructor(ttlSeconds: number = 300) {
		// Default 5 minutes TTL
		this.ttl = ttlSeconds * 1000;
	}

	set(key: string, value: T, customTtl?: number): void {
		const ttl = customTtl ? customTtl * 1000 : this.ttl;
		const expiresAt = Date.now() + ttl;
		this.cache.set(key, { data: value, expiresAt });
	}

	get(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) {
			return null;
		}

		// Check if expired
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	// Clean up expired entries
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				this.cache.delete(key);
			}
		}
	}

	// Get cache statistics
	getStats(): { size: number; keys: string[] } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys())
		};
	}
}

// Periodically clean up expired cache entries every 5 minutes
let cleanupInterval: NodeJS.Timeout | null = null;

function startCacheCleanup(caches: Cache<any>[]) {
	// Clear existing interval if any
	if (cleanupInterval) {
		clearInterval(cleanupInterval);
	}
	
	cleanupInterval = setInterval(
		() => {
			for (const cache of caches) {
				cache.cleanup();
			}
		},
		5 * 60 * 1000
	); // 5 minutes
	
	// Don't keep Node.js process alive for cleanup
	cleanupInterval.unref();
}

// Function to stop cache cleanup (useful for testing or graceful shutdown)
export function stopCacheCleanup() {
	if (cleanupInterval) {
		clearInterval(cleanupInterval);
		cleanupInterval = null;
	}
}

// Export cache instances for different data types
export const sessionCache = new Cache<any>(1800); // 30 minutes for sessions
export const userCache = new Cache<any>(3600); // 1 hour for user data
export const userByUsernameCache = new Cache<any>(3600); // 1 hour for username lookups

// Start automatic cleanup
startCacheCleanup([sessionCache, userCache, userByUsernameCache]);
