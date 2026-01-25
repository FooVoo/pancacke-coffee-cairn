# Service Worker Implementation for Background Sync

## Overview

This application implements a service worker to enable offline-first character management with background synchronization to TursoDB. All character operations are performed locally first, then synced to the server when the user is authenticated.

## Architecture

### Local-First Approach

1. **IndexedDB Storage**: Character data is stored locally using Dexie.js
2. **Sync Queue**: Operations are queued for background sync when user is authenticated
3. **Service Worker**: Handles background sync using the Background Sync API
4. **Fallback**: Manual sync for browsers without Background Sync support

### Components

#### 1. Service Worker (`src/service-worker.ts`)
- Handles background sync events
- Processes sync queue using native IndexedDB API
- Retries failed syncs (max 3 attempts)
- Caches resources for offline access

#### 2. Sync Queue (`src/lib/client/syncQueue.ts`)
- Manages pending character operations (create, update, delete)
- Stores operations in IndexedDB
- Assigns user IDs when user logs in

#### 3. Character Store (`src/lib/stores/characterStore.ts`)
- Unified interface for local and server operations
- Automatically queues syncs for authenticated users
- Triggers background sync after operations

#### 4. Sync API (`src/routes/api/characters/sync/+server.ts`)
- Server endpoint for processing synced operations
- Validates user authentication
- Applies operations to TursoDB

## User Flow

### Anonymous Users
1. User creates/edits characters
2. Data saved to local IndexedDB only
3. No sync queue operations

### Authenticated Users
1. User creates/edits characters
2. Data saved to local IndexedDB immediately
3. Operation added to sync queue
4. Background sync triggered (if supported)
5. Service worker syncs to TursoDB in background

### Login Flow
1. User logs in
2. Pending sync operations assigned user ID
3. Automatic background sync triggered
4. Local characters synced to TursoDB
5. Sync status indicator shows progress

## Browser Support

### Full Support (with Background Sync)
- Chrome/Edge 49+
- Opera 36+

### Partial Support (manual sync fallback)
- Firefox (service worker without Background Sync API)
- Safari (service worker without Background Sync API)

### No Support
- Older browsers without service workers
- Application still works, but without offline sync

## Implementation Details

### Service Worker Registration

Service worker is registered in `src/routes/+layout.svelte`:

```typescript
onMount(async () => {
  await registerServiceWorker();
});
```

### Triggering Sync

Background sync can be triggered:

1. **Automatically** after character operations (if authenticated)
2. **Manually** via `characterStore.triggerSync()`
3. **On login** via `handleUserLogin(userId)`

### Sync Queue Structure

```typescript
interface SyncQueueItem {
  id?: number;
  characterId: string;
  operation: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: Date;
  retryCount: number;
  userId?: string;
}
```

### Error Handling

- Failed syncs are retried up to 3 times
- Retry count incremented on each failure
- Items with max retries are skipped
- Errors logged to console for debugging

## Security Considerations

1. **Authentication**: Sync endpoint validates session cookies
2. **User Isolation**: Operations only applied to authenticated user's data
3. **HTTPS Required**: Service workers require secure context
4. **CSRF Protection**: SvelteKit's built-in CSRF protection

## Testing

### Test Offline Sync
1. Create character while logged in
2. Go offline (disable network)
3. Edit character
4. Go back online
5. Verify changes sync to server

### Test Login Sync
1. Create characters as guest
2. Login with account
3. Verify local characters sync to server
4. Check characters appear in server data

## Future Enhancements

1. **Conflict Resolution**: Handle conflicts when same character edited on multiple devices
2. **Periodic Sync**: Use Periodic Background Sync API for authenticated users
3. **Sync Status UI**: Show detailed sync status and errors to users
4. **Offline Indicator**: Visual indicator when app is offline
5. **Delta Sync**: Only sync changed fields instead of full character data
