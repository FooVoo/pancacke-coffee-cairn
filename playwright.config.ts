import { defineConfig } from '@playwright/test';

export default defineConfig({
	use: {
		baseURL: 'http://127.0.0.1:4173',
		channel: 'chrome',
		trace: 'retain-on-failure'
	},
	webServer: {
		command:
			'NODE_ENV=development npm run build && NODE_ENV=development npm run preview -- --host 127.0.0.1',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	testDir: 'e2e'
});
