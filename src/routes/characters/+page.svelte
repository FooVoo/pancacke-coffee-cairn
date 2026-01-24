<script lang="ts">
	import type { PageData } from './$types';
	import charterImage from '$lib/assets/char-example.png';
	import { characterStore } from '$lib/stores/characterStore';
	import { onMount } from 'svelte';
	import { getDemoCharacter } from '$lib/data/demoCharacter';

	let { data }: { data: PageData } = $props();
	let demoCharacterCreated = $state(false);

	// Load local characters from IndexedDB for anonymous users
	onMount(async () => {
		if (!data.isAuthenticated && !demoCharacterCreated) {
			await characterStore.loadLocal();
			
			// Create demo character if this is first visit
			const chars = $characterStore;
			if (chars.length === 0) {
				await characterStore.addLocal(getDemoCharacter());
				demoCharacterCreated = true;
			}
		}
	});

	// Merge server-side and client-side characters
	const allCharacters = $derived(
		data.isAuthenticated ? data.characters : $characterStore
	);
</script>

<main class="characters-page">
	<header class="page-header">
		<h1>Your Characters</h1>
		<div class="header-actions">
			{#if data.isAuthenticated && data.user}
				<span class="user-info">Welcome, {data.user.username}</span>
				<form method="POST" action="/logout">
					<button type="submit" class="btn-secondary">Logout</button>
				</form>
			{:else}
				<span class="user-info">Guest Mode (data stored locally)</span>
				<a href="/login" class="btn-secondary">Login</a>
			{/if}
		</div>
	</header>

	{#if allCharacters.length === 0}
		<div class="empty-state">
			<p>You don't have any characters yet.</p>
			<a href="/characters/new" class="btn-primary">Create Your First Character</a>
		</div>
	{:else}
		<div class="characters-grid">
			{#each allCharacters as character (character.id)}
				<a href="/characters/{character.id}" class="character-card">
					<div class="character-avatar">
						<img
							src={character.avatarUrl || charterImage}
							alt={character.name}
							width="120"
							height="180"
						/>
					</div>
					<div class="character-details">
						<h2 class="character-name">{character.name}</h2>
						<p class="character-role">{character.role}</p>
						<div class="character-stats">
							<span class="stat-item">Level {character.level || 1}</span>
							<span class="stat-separator">•</span>
							<span class="stat-item">HP {character.hp}/{character.maxHp || character.hp}</span>
							<span class="stat-separator">•</span>
							<span class="stat-item">AC {character.armorClass || 10}</span>
						</div>
					</div>
				</a>
			{/each}
		</div>

		<div class="page-footer">
			<a href="/characters/new" class="btn-primary btn-large">+ Create New Character</a>
		</div>
	{/if}
</main>

<style>
	.characters-page {
		min-height: 100dvh;
		background: var(--grim-bg);
		color: var(--grim-text);
		padding: var(--grim-gutter);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: clamp(1.75rem, 5vw, 2.5rem);
		margin: 0;
		color: var(--grim-text);
	}

	.header-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.user-info {
		color: var(--grim-muted-text);
		font-size: 0.9rem;
	}

	.btn-secondary {
		background: var(--grim-surface);
		color: var(--grim-text);
		border: 1px solid var(--grim-border);
		padding: 0.5rem 1rem;
		border-radius: calc(var(--grim-border-radius) * 0.75);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background: var(--grim-muted);
		transform: translateY(-1px);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 3rem 1rem;
		min-height: 50dvh;
	}

	.empty-state p {
		font-size: 1.25rem;
		color: var(--grim-muted-text);
		margin-bottom: 1.5rem;
	}

	.characters-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.character-card {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: var(--grim-surface);
		border-radius: var(--grim-border-radius);
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
		border: 2px solid transparent;
	}

	.character-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--grim-shadow);
		border-color: var(--grim-accent);
	}

	.character-avatar {
		flex-shrink: 0;
		width: 80px;
		height: 120px;
		overflow: hidden;
		border-radius: calc(var(--grim-border-radius) * 0.5);
		background: var(--grim-muted);
	}

	.character-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.character-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.character-name {
		font-size: clamp(1.25rem, 4vw, 1.5rem);
		margin: 0;
		color: var(--grim-text);
	}

	.character-role {
		font-size: 1rem;
		color: var(--grim-accent);
		margin: 0;
		font-weight: 600;
	}

	.character-stats {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		font-size: 0.875rem;
		color: var(--grim-muted-text);
	}

	.stat-separator {
		color: var(--grim-border);
	}

	.page-footer {
		display: flex;
		justify-content: center;
		padding: 2rem 0;
	}

	.btn-primary {
		background: linear-gradient(180deg, var(--grim-primary) 0%, color-mix(in srgb, var(--grim-primary) 75%, black 25%) 100%);
		color: var(--grim-primary-contrast);
		border: 1px solid color-mix(in srgb, var(--grim-primary) 45%, black 55%);
		padding: 0.875rem 1.5rem;
		border-radius: calc(var(--grim-border-radius) * 0.75);
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		display: inline-block;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--grim-shadow);
	}

	.btn-large {
		font-size: 1.125rem;
		padding: 1rem 2rem;
	}

	@media screen and (min-width: 768px) {
		.page-header {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		.characters-grid {
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		}

		.character-avatar {
			width: 100px;
			height: 150px;
		}
	}
</style>
