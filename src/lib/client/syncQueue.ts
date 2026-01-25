/**
 * Sync Queue Database for managing pending operations
 * Tracks character operations that need to be synced to TursoDB
 */
import Dexie, { type Table } from 'dexie';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
	id?: number;
	characterId: string;
	operation: SyncOperation;
	data?: any; // Character data for create/update operations
	timestamp: Date;
	retryCount: number;
	userId?: string; // Will be set when user logs in
}

export class SyncQueueDatabase extends Dexie {
	queue!: Table<SyncQueueItem>;

	constructor() {
		super('CairnSyncQueue');
		this.version(1).stores({
			queue: '++id, characterId, operation, timestamp, userId'
		});
	}
}

// Create singleton instance
export const syncQueueDb = new SyncQueueDatabase();

// Add operation to sync queue
export async function queueSync(
	characterId: string,
	operation: SyncOperation,
	data?: any
): Promise<void> {
	await syncQueueDb.queue.add({
		characterId,
		operation,
		data,
		timestamp: new Date(),
		retryCount: 0
	});
}

// Get all pending sync operations
export async function getPendingSyncs(userId?: string): Promise<SyncQueueItem[]> {
	if (userId) {
		return syncQueueDb.queue.where('userId').equals(userId).toArray();
	}
	return syncQueueDb.queue.orderBy('timestamp').toArray();
}

// Mark sync as completed
export async function completedSync(id: number): Promise<void> {
	await syncQueueDb.queue.delete(id);
}

// Update retry count
export async function incrementRetry(id: number): Promise<void> {
	const item = await syncQueueDb.queue.get(id);
	if (item) {
		await syncQueueDb.queue.update(id, {
			retryCount: item.retryCount + 1
		});
	}
}

// Assign user ID to all pending syncs (when user logs in)
export async function assignUserToSyncs(userId: string): Promise<void> {
	const pendingSyncs = await syncQueueDb.queue
		.filter(item => !item.userId)
		.toArray();
	
	for (const sync of pendingSyncs) {
		if (sync.id) {
			await syncQueueDb.queue.update(sync.id, { userId });
		}
	}
}

// Clear all sync queue items
export async function clearSyncQueue(): Promise<void> {
	await syncQueueDb.queue.clear();
}
