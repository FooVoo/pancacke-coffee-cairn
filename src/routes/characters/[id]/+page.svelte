<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import charterImage from '$lib/assets/char-example.png';
	import { getGuestCharacter, type Character } from '$lib/client/localFirstCharacterPipeline';

	let { data }: { data: PageData } = $props();
	let guestCharacter = $state<Character | null>(null);
	let guestCharacterLoaded = $state(data.isAuthenticated);

	const character = $derived(data.isAuthenticated ? data.character : guestCharacter);

	onMount(async () => {
		if (data.isAuthenticated) {
			return;
		}

		guestCharacter = await getGuestCharacter(data.characterId);
		guestCharacterLoaded = true;
	});

	const getStats = () => {
		return character ? Object.entries(character.attributes) : [];
	};

	const getModifier = (score: number) => {
		const mod = Math.floor((score - 10) / 2);
		return mod >= 0 ? `+${mod}` : `${mod}`;
	};
</script>

<main class="character-page">
	<header class="page-header">
		<a href="/characters" class="back-link">← Back to Characters</a>
		{#if !data.isAuthenticated}
			<p class="mode-note">Guest Mode (data stored locally)</p>
		{/if}
	</header>

	{#if character}
		<section class="character-info">
			<img
				class="character-image"
				src={character.avatarUrl || charterImage}
				alt={character.name}
				width="240"
				height="360"
			/>
			<div class="character-info-description">
				<h1 class="character-name">{character.name}</h1>
				<p class="character-role">{character.role}</p>
				{#if character.background}
					<p class="character-background">{character.background}</p>
				{/if}
				<div class="character-vitals">
					<div class="vital-stat">
						<span class="vital-label">Level</span>
						<span class="vital-value">{character.level || 1}</span>
					</div>
					<div class="vital-stat">
						<span class="vital-label">HP</span>
						<span class="vital-value">{character.hp}/{character.maxHp || character.hp}</span>
					</div>
					<div class="vital-stat">
						<span class="vital-label">AC</span>
						<span class="vital-value">{character.armorClass || 10}</span>
					</div>
					<div class="vital-stat">
						<span class="vital-label">Prof</span>
						<span class="vital-value">+{character.proficiencyBonus || 2}</span>
					</div>
				</div>
			</div>
		</section>

		<section class="stats">
			<h2>Attributes</h2>
			<article class="stats-wrapper">
				{#each getStats() as [statKey, value] (statKey)}
					<div class="stat">
						<div class="stat-header">{statKey}</div>
						<div class="stat-value">{value}</div>
						<div class="stat-modifier">{getModifier(value)}</div>
					</div>
				{/each}
			</article>
		</section>

		{#if character.savingThrows && character.savingThrows.length > 0}
			<section class="saving-throws">
				<h2>Saving Throws</h2>
				<div class="badges">
					{#each character.savingThrows as save (save)}
						<span class="badge badge-primary">{save}</span>
					{/each}
				</div>
			</section>
		{/if}

		<section class="skills">
			<h2>Skills</h2>
			<div class="list-items">
				{#each character.skills as skill (skill)}
					<div class="list-item">{skill}</div>
				{/each}
			</div>
		</section>

		{#if character.proficiencies && character.proficiencies.length > 0}
			<section class="proficiencies">
				<h2>Proficiencies</h2>
				<div class="list-items">
					{#each character.proficiencies as prof (prof)}
						<div class="list-item">{prof}</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if character.languages && character.languages.length > 0}
			<section class="languages">
				<h2>Languages</h2>
				<div class="badges">
					{#each character.languages as lang (lang)}
						<span class="badge badge-secondary">{lang}</span>
					{/each}
				</div>
			</section>
		{/if}

		{#if character.weapons && character.weapons.length > 0}
			<section class="weapons">
				<h2>Weapons</h2>
				<div class="equipment-list">
					{#each character.weapons as weapon (weapon.name)}
						<div class="equipment-item">
							<div class="equipment-name">{weapon.name}</div>
							<div class="equipment-details">
								<span class="damage">{weapon.damage}</span>
								{#if weapon.properties}
									<span class="properties">{weapon.properties}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if character.armor && character.armor.length > 0}
			<section class="armor">
				<h2>Armor</h2>
				<div class="equipment-list">
					{#each character.armor as armorItem (armorItem.name)}
						<div class="equipment-item">
							<div class="equipment-name">{armorItem.name}</div>
							<div class="equipment-details">
								<span class="damage">AC {armorItem.ac}</span>
								{#if armorItem.properties}
									<span class="properties">{armorItem.properties}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<section class="inventory">
			<h2>Equipment</h2>
			<div class="list-items">
				{#each character.equipment as item (item)}
					<div class="list-item">{item}</div>
				{/each}
			</div>
		</section>

		{#if character.spells && character.spells.length > 0}
			<section class="spells">
				<h2>Spells</h2>
				{#if character.spellSlots && Object.keys(character.spellSlots).length > 0}
					<div class="spell-slots">
						{#each Object.entries(character.spellSlots) as [level, slots]}
							<div class="slot-group">
								<span class="slot-label">Level {level}:</span>
								<span class="slot-value">{slots} slots</span>
							</div>
						{/each}
					</div>
				{/if}
				<div class="list-items">
					{#each character.spells as spell (spell)}
						<div class="list-item spell-item">{spell}</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if character.features && character.features.length > 0}
			<section class="features">
				<h2>Features & Abilities</h2>
				<div class="list-items">
					{#each character.features as feature (feature)}
						<div class="list-item feature-item">{feature}</div>
					{/each}
				</div>
			</section>
		{/if}

		<section class="wealth">
			<h2>Wealth</h2>
			<div class="wealth-display">
				<div class="coin-stack">
					<span class="coin-value">{character.gold || 0}</span>
					<span class="coin-label">Gold</span>
				</div>
				<div class="coin-stack">
					<span class="coin-value">{character.silver || 0}</span>
					<span class="coin-label">Silver</span>
				</div>
				<div class="coin-stack">
					<span class="coin-value">{character.copper || 0}</span>
					<span class="coin-label">Copper</span>
				</div>
			</div>
		</section>

		{#if character.traits && character.traits.length > 0}
			<section class="traits">
				<h2>Personality Traits</h2>
				<div class="badges">
					{#each character.traits as trait (trait)}
						<span class="badge badge-accent">{trait}</span>
					{/each}
				</div>
			</section>
		{/if}

		{#if character.ideals}
			<section class="ideals">
				<h2>Ideals</h2>
				<p class="text-content">{character.ideals}</p>
			</section>
		{/if}

		{#if character.bonds}
			<section class="bonds">
				<h2>Bonds</h2>
				<p class="text-content">{character.bonds}</p>
			</section>
		{/if}

		{#if character.flaws}
			<section class="flaws">
				<h2>Flaws</h2>
				<p class="text-content">{character.flaws}</p>
			</section>
		{/if}

		{#if character.conditions && character.conditions.length > 0}
			<section class="conditions">
				<h2>Active Conditions</h2>
				<div class="badges">
					{#each character.conditions as condition (condition)}
						<span class="badge badge-danger">{condition}</span>
					{/each}
				</div>
			</section>
		{/if}

		{#if character.notes}
			<section class="notes">
				<h2>Notes</h2>
				<p class="text-content">{character.notes}</p>
			</section>
		{/if}
	{:else}
		<section class="status-panel">
			<h1 class="character-name">
				{guestCharacterLoaded ? 'Character not found' : 'Loading character...'}
			</h1>
			<p class="text-content">
				{guestCharacterLoaded
					? 'This guest character was not found in local storage.'
					: 'Loading locally stored character data.'}
			</p>
		</section>
	{/if}
</main>

<style>
	.character-page {
		display: grid;
		grid-auto-rows: auto;
		background: var(--grim-bg);
		min-height: 100dvh;
		padding: var(--grim-gutter);
		color: var(--grim-text);
		gap: var(--grim-gutter);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.back-link {
		color: var(--grim-accent);
		text-decoration: none;
		font-size: 1rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.mode-note {
		margin: 0;
		color: var(--grim-muted-text);
		font-size: 0.95rem;
	}

	.status-panel {
		display: grid;
		gap: 1rem;
	}

	.character-page > section {
		padding: 1rem;
		background: var(--grim-surface);
		border-radius: var(--grim-border-radius);
		border-left: 3px solid var(--grim-primary);
	}

	.character-page h2 {
		font-size: clamp(1.25rem, 4vw, 1.75rem);
		margin: 0 0 1rem 0;
		color: var(--grim-text);
		border-bottom: 1px solid var(--grim-border);
		padding-bottom: 0.5rem;
	}

	.character-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.5rem;
	}

	.character-image {
		width: 160px;
		height: 240px;
		object-fit: cover;
		border-radius: var(--grim-border-radius);
		box-shadow: 0 4px 12px var(--grim-shadow);
	}

	.character-info-description {
		width: 100%;
	}

	.character-name {
		font-size: clamp(2rem, 6vw, 3rem);
		margin: 0 0 0.5rem 0;
		color: var(--grim-text);
	}

	.character-role {
		font-size: clamp(1.25rem, 4vw, 1.5rem);
		color: var(--grim-accent);
		font-weight: 600;
		margin: 0 0 1rem 0;
	}

	.character-background {
		font-size: 1rem;
		color: var(--grim-muted-text);
		font-style: italic;
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}

	.character-vitals {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.vital-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem;
		background: var(--grim-muted);
		border-radius: calc(var(--grim-border-radius) * 0.75);
	}

	.vital-label {
		font-size: 0.875rem;
		color: var(--grim-muted-text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.vital-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--grim-text);
	}

	.stats-wrapper {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.stat {
		padding: 1rem;
		background: var(--grim-accent);
		border-radius: var(--grim-border-radius);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: center;
	}

	.stat-header {
		font-size: 1rem;
		font-weight: 600;
		color: var(--grim-primary-contrast);
	}

	.stat-value {
		font-size: 2.5rem;
		line-height: 1;
		font-weight: 800;
		color: var(--grim-primary-contrast);
	}

	.stat-modifier {
		font-size: 1rem;
		color: var(--grim-primary-contrast);
		opacity: 0.9;
	}

	.list-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.list-item {
		padding: 0.75rem;
		background: var(--grim-muted);
		border-radius: calc(var(--grim-border-radius) * 0.5);
		color: var(--grim-text);
	}

	.spell-item {
		border-left: 3px solid var(--grim-secondary);
	}

	.feature-item {
		border-left: 3px solid var(--grim-accent);
		font-weight: 600;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.badge {
		padding: 0.5rem 1rem;
		border-radius: calc(var(--grim-border-radius) * 0.5);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.badge-primary {
		background: var(--grim-primary);
		color: var(--grim-primary-contrast);
	}

	.badge-secondary {
		background: var(--grim-secondary);
		color: var(--grim-primary-contrast);
	}

	.badge-accent {
		background: var(--grim-accent);
		color: var(--grim-primary-contrast);
	}

	.badge-danger {
		background: var(--grim-danger);
		color: var(--grim-primary-contrast);
	}

	.equipment-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.equipment-item {
		padding: 0.875rem;
		background: var(--grim-muted);
		border-radius: calc(var(--grim-border-radius) * 0.5);
	}

	.equipment-name {
		font-weight: 600;
		color: var(--grim-text);
		margin-bottom: 0.25rem;
	}

	.equipment-details {
		display: flex;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: var(--grim-muted-text);
	}

	.damage {
		color: var(--grim-primary);
		font-weight: 600;
	}

	.properties {
		font-style: italic;
	}

	.spell-slots {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: var(--grim-muted);
		border-radius: calc(var(--grim-border-radius) * 0.5);
	}

	.slot-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.slot-label {
		font-size: 0.875rem;
		color: var(--grim-muted-text);
	}

	.slot-value {
		font-weight: 600;
		color: var(--grim-accent);
	}

	.wealth-display {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.coin-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: var(--grim-muted);
		border-radius: var(--grim-border-radius);
	}

	.coin-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--grim-text);
	}

	.coin-label {
		font-size: 0.875rem;
		color: var(--grim-muted-text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.text-content {
		padding: 0.875rem;
		background: var(--grim-muted);
		border-radius: calc(var(--grim-border-radius) * 0.5);
		line-height: 1.6;
		color: var(--grim-text);
		margin: 0;
	}

	@media screen and (min-width: 768px) {
		.character-page {
			padding: calc(var(--grim-gutter) * 2);
			gap: calc(var(--grim-gutter) * 1.5);
		}

		.character-info {
			flex-direction: row;
			text-align: left;
		}

		.character-image {
			width: 200px;
			height: 300px;
		}

		.character-vitals {
			grid-template-columns: repeat(4, 1fr);
			max-width: none;
			margin: 0;
		}

		.stats-wrapper {
			grid-template-columns: repeat(3, 1fr);
		}

		.wealth-display {
			max-width: 400px;
		}
	}

	@media screen and (min-width: 1024px) {
		.stats-wrapper {
			grid-template-columns: repeat(6, 1fr);
		}
	}
</style>
