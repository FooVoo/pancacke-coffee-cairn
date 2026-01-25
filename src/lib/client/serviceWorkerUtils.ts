/**
 * Service Worker registration and utilities
 * Handles service worker lifecycle and sync operations
 */
import { browser } from '$app/environment';

let registration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!browser || !('serviceWorker' in navigator)) {
		console.log('Service Workers not supported');
		return null;
	}

	try {
		registration = await navigator.serviceWorker.register('/service-worker.js', {
			scope: '/',
			type: 'module'
		});

		console.log('Service Worker registered:', registration.scope);

		// Handle updates
		registration.addEventListener('updatefound', () => {
			const newWorker = registration?.installing;
			if (newWorker) {
				newWorker.addEventListener('statechange', () => {
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						console.log('New service worker available, please refresh');
						// Could dispatch a custom event here to notify the UI
					}
				});
			}
		});

		return registration;
	} catch (error) {
		console.error('Service Worker registration failed:', error);
		return null;
	}
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
	if (!browser || !('serviceWorker' in navigator)) {
		return false;
	}

	const registration = await navigator.serviceWorker.getRegistration();
	if (registration) {
		return registration.unregister();
	}
	return false;
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag: string = 'cairn-character-sync'): Promise<void> {
	if (!browser || !('serviceWorker' in navigator)) {
		return;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		if ('sync' in registration) {
			await registration.sync.register(tag);
			console.log('Background sync requested:', tag);
		}
	} catch (error) {
		console.error('Background sync request failed:', error);
	}
}

/**
 * Check if the service worker is ready
 */
export async function isServiceWorkerReady(): Promise<boolean> {
	if (!browser || !('serviceWorker' in navigator)) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.getRegistration();
		return registration !== undefined && registration.active !== null;
	} catch {
		return false;
	}
}

/**
 * Trigger manual sync via message
 */
export async function triggerManualSync(): Promise<{ success: boolean; error?: string }> {
	if (!browser || !('serviceWorker' in navigator)) {
		return { success: false, error: 'Service Worker not supported' };
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		if (!registration.active) {
			return { success: false, error: 'Service Worker not active' };
		}

		return new Promise((resolve, reject) => {
			const channel = new MessageChannel();
			channel.port1.onmessage = (event) => {
				if (event.data.success) {
					resolve({ success: true });
				} else {
					resolve({ success: false, error: event.data.error });
				}
			};

			// Set timeout in case service worker doesn't respond
			setTimeout(() => {
				reject(new Error('Sync request timeout'));
			}, 30000); // 30 second timeout

			registration.active.postMessage({ type: 'SYNC_NOW' }, [channel.port2]);
		});
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Handle user login - assign user ID to pending syncs and trigger sync
 */
export async function handleUserLogin(userId: string): Promise<void> {
	if (!browser) return;

	try {
		const { assignUserToSyncs } = await import('./syncQueue');
		await assignUserToSyncs(userId);
		console.log('Assigned user ID to pending syncs:', userId);

		// Trigger sync after login
		await requestBackgroundSync();
	} catch (error) {
		console.error('Error handling user login:', error);
	}
}

/**
 * Check service worker support
 */
export function isServiceWorkerSupported(): boolean {
	return browser && 'serviceWorker' in navigator;
}

/**
 * Check background sync support
 */
export async function isBackgroundSyncSupported(): Promise<boolean> {
	if (!isServiceWorkerSupported()) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		return 'sync' in registration;
	} catch {
		return false;
	}
}
