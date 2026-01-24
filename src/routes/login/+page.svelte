<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<main class="auth-page">
	<div class="auth-container">
		<h1 class="auth-title">Login to Cairn</h1>
		
		<form method="POST" use:enhance class="auth-form">
			<div class="form-group">
				<label for="username">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					required
					class="form-input"
					autocomplete="username"
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					class="form-input"
					autocomplete="current-password"
				/>
			</div>

			{#if form?.error}
				<div class="error-message">{form.error}</div>
			{/if}

			<button type="submit" class="btn-primary btn-full">Login</button>
		</form>

		<div class="auth-footer">
			<p>Don't have an account? <a href="/register">Register here</a></p>
			<p class="demo-note">Demo credentials: username: <strong>demo</strong>, password: <strong>demo</strong></p>
		</div>
	</div>
</main>

<style>
	.auth-page {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--grim-bg);
		padding: var(--grim-gutter);
	}

	.auth-container {
		width: 100%;
		max-width: 400px;
		background: var(--grim-surface);
		border-radius: var(--grim-border-radius);
		padding: 2rem;
		box-shadow: 0 4px 6px var(--grim-shadow);
	}

	.auth-title {
		color: var(--grim-text);
		font-size: clamp(1.5rem, 5vw, 2rem);
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		color: var(--grim-text);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.form-input {
		padding: 0.75rem;
		background: var(--grim-muted);
		border: 1px solid var(--grim-border);
		border-radius: calc(var(--grim-border-radius) * 0.75);
		color: var(--grim-text);
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--grim-accent);
	}

	.error-message {
		background: var(--grim-danger);
		color: var(--grim-primary-contrast);
		padding: 0.75rem;
		border-radius: calc(var(--grim-border-radius) * 0.75);
		font-size: 0.9rem;
	}

	.btn-primary {
		background: linear-gradient(180deg, var(--grim-primary) 0%, color-mix(in srgb, var(--grim-primary) 75%, black 25%) 100%);
		color: var(--grim-primary-contrast);
		border: 1px solid color-mix(in srgb, var(--grim-primary) 45%, black 55%);
		padding: 0.875rem 1.5rem;
		border-radius: calc(var(--grim-border-radius) * 0.75);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--grim-shadow);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	.btn-full {
		width: 100%;
	}

	.auth-footer {
		margin-top: 1.5rem;
		text-align: center;
		color: var(--grim-muted-text);
		font-size: 0.9rem;
	}

	.auth-footer p {
		margin: 0.5rem 0;
	}

	.auth-footer a {
		color: var(--grim-accent);
		text-decoration: none;
		font-weight: 600;
	}

	.auth-footer a:hover {
		text-decoration: underline;
	}

	.demo-note {
		font-size: 0.85rem;
		font-style: italic;
		color: var(--grim-muted-text);
	}

	.demo-note strong {
		color: var(--grim-accent);
	}
</style>
