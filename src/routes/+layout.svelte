<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit";
	import { onMount } from 'svelte';
	import { registerServiceWorker } from '$lib/client/serviceWorkerUtils';

	let { children } = $props();

	injectSpeedInsights();

	// Register service worker on mount
	onMount(async () => {
		await registerServiceWorker();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
