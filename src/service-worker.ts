/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

const CACHE_NAME = 'cairn-character-cache-v1';
const SYNC_TAG = 'cairn-character-sync';

// Install event - setup cache
sw.addEventListener('install', (event) => {
	console.log('[Service Worker] Installing...');
	// Skip waiting to activate immediately
	sw.skipWaiting();
});

// Activate event - cleanup old caches
sw.addEventListener('activate', (event) => {
	console.log('[Service Worker] Activating...');
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log('[Service Worker] Deleting old cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	// Claim all clients immediately
	return sw.clients.claim();
});

// Background Sync event - sync character data with TursoDB
sw.addEventListener('sync', (event) => {
	console.log('[Service Worker] Background sync event:', event.tag);
	
	if (event.tag === SYNC_TAG) {
		event.waitUntil(syncCharacterData());
	}
});

// Periodic sync for authenticated users (if supported)
sw.addEventListener('periodicsync', (event) => {
	if (event.tag === SYNC_TAG) {
		event.waitUntil(syncCharacterData());
	}
});

// Message handler for manual sync requests
sw.addEventListener('message', (event) => {
	console.log('[Service Worker] Received message:', event.data);
	
	if (event.data && event.data.type === 'SYNC_NOW') {
		syncCharacterData().then(() => {
			event.ports[0]?.postMessage({ success: true });
		}).catch((error) => {
			console.error('[Service Worker] Sync failed:', error);
			event.ports[0]?.postMessage({ success: false, error: error.message });
		});
	}
});

/**
 * Sync character data from IndexedDB to TursoDB
 * This function processes the sync queue and sends pending operations to the server
 */
async function syncCharacterData() {
	console.log('[Service Worker] Starting character sync...');
	
	try {
		// Import dynamically to use IndexedDB in service worker context
		const { syncQueueDb, completedSync, incrementRetry } = await import(
			'$lib/client/syncQueue'
		);
		
		// Get all pending sync operations
		const pendingSyncs = await syncQueueDb.queue.orderBy('timestamp').toArray();
		
		if (pendingSyncs.length === 0) {
			console.log('[Service Worker] No pending syncs');
			return;
		}
		
		console.log(`[Service Worker] Processing ${pendingSyncs.length} pending sync operations`);
		
		// Process each sync operation
		for (const syncItem of pendingSyncs) {
			try {
				// Skip if retry count is too high (max 3 retries)
				if (syncItem.retryCount >= 3) {
					console.warn('[Service Worker] Max retries reached for sync:', syncItem.id);
					continue;
				}
				
				// Only sync if user is logged in (userId is set)
				if (!syncItem.userId) {
					console.log('[Service Worker] Skipping sync - no user ID:', syncItem.id);
					continue;
				}
				
				// Send sync request to server
				const response = await fetch('/api/characters/sync', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						characterId: syncItem.characterId,
						operation: syncItem.operation,
						data: syncItem.data
					})
				});
				
				if (response.ok) {
					// Sync successful, remove from queue
					if (syncItem.id) {
						await completedSync(syncItem.id);
						console.log('[Service Worker] Sync completed:', syncItem.id);
					}
				} else {
					// Sync failed, increment retry count
					if (syncItem.id) {
						await incrementRetry(syncItem.id);
						console.error('[Service Worker] Sync failed, will retry:', syncItem.id);
					}
				}
			} catch (error) {
				console.error('[Service Worker] Error processing sync item:', error);
				// Increment retry count on error
				if (syncItem.id) {
					await incrementRetry(syncItem.id);
				}
			}
		}
		
		console.log('[Service Worker] Character sync completed');
	} catch (error) {
		console.error('[Service Worker] Sync error:', error);
		throw error;
	}
}

// Fetch event - Network first, fallback to cache for API calls
sw.addEventListener('fetch', (event) => {
	// Only handle GET requests
	if (event.request.method !== 'GET') {
		return;
	}
	
	// Don't cache API sync requests
	if (event.request.url.includes('/api/characters/sync')) {
		return;
	}
	
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Clone the response before caching
				const responseToCache = response.clone();
				
				// Cache the response for offline access
				caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, responseToCache);
				});
				
				return response;
			})
			.catch(() => {
				// If network fails, try cache
				return caches.match(event.request).then((response) => {
					return response || new Response('Offline - resource not cached', {
						status: 503,
						statusText: 'Service Unavailable'
					});
				});
			})
	);
});

export {};
