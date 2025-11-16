<script lang="ts">
    import charterImage from '$lib/assets/char-example.png';
	interface CairnCharacter {
		id?: string;
		name: string;
		role: string;
		background?: string;
		level?: number;
		attributes: {
			STR: number;
			DEX: number;
			CON: number;
			INT: number;
			WIS: number;
			CHA: number;
		};
		hp: number;
		hitDie?: string;
		skills: string[];
		equipment: string[];
		spells: string[];
		gold?: number;
		notes?: string;
	}

	let mockCairnCharacter: CairnCharacter = {
		id: 'mock-001',
		name: 'Edrin Thorn',
		role: 'Hedge Mystic',
		background: 'Wandered the borderlands as a herbalist and lore-seeker.',
		level: 1,
		attributes: {
			STR: 10,
			DEX: 12,
			CON: 11,
			INT: 14,
			WIS: 13,
			CHA: 9
		},
		hp: 6,
		hitDie: 'd6',
		skills: ['Forage', 'Herbalism', 'Lore (folklore)'],
		equipment: ['Worn cloak', 'Quarterstaff', 'Herbal kit', 'Tinderbox', '2 days rations'],
		spells: ['Lesser Ward (protect 1)', 'Guiding Ember (small light)'],
		gold: 3,
		notes: 'Prefers diplomacy but knows simple defensive magics and remedies.'
	};

	const getStats = () => {
		return Object.entries(mockCairnCharacter.attributes);
	};
</script>

<main class="character-page">
	<section class="character-info">
		<img class="character-image" src="{charterImage}" alt={mockCairnCharacter.name} width="240" height="360" />
		<div class="character-info-description">
			<div>{mockCairnCharacter.name}/{mockCairnCharacter.role}</div>
			<div>Level:{mockCairnCharacter.level}</div>
			<div>HP:{mockCairnCharacter.hp}</div>
		</div>
	</section>
	<section class="stats">
		<h2>Stats</h2>
		<article class="stats-wrapper">
			{#each getStats() as [statKey, value] (statKey)}
				<div class="stat">
					<div class="stat-header">{statKey}</div>
					<div class="stat-value">{value}</div>
				</div>
			{/each}
		</article>
		<article class="skills">
			<h3>Skills:</h3>
			{#each mockCairnCharacter.skills as skill (skill)}
				<div class="skill">{skill}</div>
			{/each}
		</article>
	</section>
	<section class="inventory">
		<h2>Inventory</h2>
		{#each mockCairnCharacter.equipment as item (item)}
			<div class="item">{item}</div>
		{/each}
	</section>
	<section class="spells">
		<h2>Spells</h2>
		{#each mockCairnCharacter.spells as spell (spell)}
			<div class="spell">{spell}</div>
		{/each}
	</section>
	<section class="notes">
        <h2>Notes</h2>
        <textarea class="notes-area" bind:value={mockCairnCharacter.notes}></textarea>
    </section>
</main>

<style>
	.character-page {
		display: grid;
        grid-auto-rows: 1fr;
		background: var(--grim-bg);
		height: 100dvh;
		padding: var(--grim-gutter);
		color: var(--grim-text);
		overflow: scroll;
		grid-template-areas:
			'character-info'
			'stats'
			'notes'
			'inventory'
			'spells';
		grid-template-columns: 1fr;
		grid-template-rows: auto;
		gap: var(--grim-gutter);
		h2 {
			font-size: clamp(1rem, 6vw, 2rem);
		}
		> section {
			padding: 0.75rem 0;
			border-bottom: 2px solid var(--grim-primary);
		}
	}

	.character-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.25rem;
		background: var(--grim-surface);
		border-radius: var(--grim-border-radius);
		grid-area: character-info;
	}

	.character-info-description {
		font-size: 1.25rem;
		font-weight: bold;
		display: flex;
		flex-direction: column;
	}

	.stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		grid-area: stats;
	}

	.stats-wrapper {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(20vw, 1fr));
		gap: 0.5rem;
	}

	.skills {
		display: flex;
		gap: 0.5rem;
		font-style: italic;
		font-size: 1rem;
	}

	.stat {
		padding: calc(var(--grim-gutter) * 0.5);
		background: var(--grim-accent);
		border-radius: var(--grim-border-radius);
		font-size: clamp(0.75rem, 4vw, 1rem);
		display: flex;
		flex-direction: column;
		gap: calc(var(--grim-gutter) * 0.5);
		align-items: center;

		.stat-header {
			font-size: clamp(1rem, 6vw, 1.5rem);
			font-weight: 600;
		}

		.stat-value {
			font-size: clamp(1.75rem, 6vw, 3rem);
			line-height: clamp(1.75rem, 6vw, 3rem);
			font-weight: 800;
		}
	}

	.inventory {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		grid-area: inventory;
	}

	.spells {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		grid-area: spells;
	}

	.notes {
		grid-area: notes;
        .notes-area {
            background: var(--grim-muted);
            width: 100%;
            min-height: 15dvh;
            padding: 0.5rem;
        }
	}

	@media screen and (min-width: 768px) {
        .character-page {
            grid-template-areas:
				'character-info stats'
				'spells notes'
				'spells inventory';
            grid-template-columns: 1fr 1fr;
        }

        .stats-wrapper {
            grid-template-columns: repeat(3, 1fr);
        }

        .stat {
            font-size: clamp(1rem, 12vw, 2rem);
        }
    }
</style>
