import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('renders no visible content because navigation is handled by the server redirect', () => {
		render(Page);
		expect(document.querySelector('h1')).toBeNull();
		expect(document.body.textContent?.trim()).toBe('');
	});
});
