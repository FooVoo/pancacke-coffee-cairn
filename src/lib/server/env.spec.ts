import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

function restoreEnv() {
	for (const key of Object.keys(process.env)) {
		if (!(key in originalEnv)) {
			delete process.env[key];
		}
	}

	Object.assign(process.env, originalEnv);
}

async function importEnvModule() {
	vi.resetModules();
	return import('./env');
}

describe('env config', () => {
	afterEach(() => {
		restoreEnv();
		vi.restoreAllMocks();
	});

	it('uses development defaults when env vars are missing', async () => {
		delete process.env.NODE_ENV;
		delete process.env.TURSO_DATABASE_URL;
		delete process.env.TURSO_AUTH_TOKEN;
		delete process.env.SESSION_SECRET;

		const { env } = await importEnvModule();

		expect(env).toMatchObject({
			nodeEnv: 'development',
			isProduction: false,
			isDevelopment: true,
			turso: {
				databaseUrl: ':memory:',
				authToken: undefined
			},
			session: {
				secret: 'dev-secret-change-in-production',
				maxAge: 60 * 60 * 24 * 30
			}
		});
	});

	it('warns in production when required values are missing', async () => {
		process.env.NODE_ENV = 'production';
		delete process.env.TURSO_DATABASE_URL;
		delete process.env.TURSO_AUTH_TOKEN;
		delete process.env.SESSION_SECRET;
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		await importEnvModule();

		expect(warnSpy).toHaveBeenCalledTimes(3);
		expect(warnSpy.mock.calls.map(([message]) => message)).toEqual([
			'WARNING: TURSO_DATABASE_URL not set in production environment',
			'WARNING: TURSO_AUTH_TOKEN not set in production environment',
			'WARNING: SESSION_SECRET not set in production environment'
		]);
	});

	it('does not warn in production when config is fully provided', async () => {
		process.env.NODE_ENV = 'production';
		process.env.TURSO_DATABASE_URL = 'file:prod.db';
		process.env.TURSO_AUTH_TOKEN = 'test-token';
		process.env.SESSION_SECRET = 'super-secret';
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { env } = await importEnvModule();

		expect(warnSpy).not.toHaveBeenCalled();
		expect(env).toMatchObject({
			nodeEnv: 'production',
			isProduction: true,
			isDevelopment: false,
			turso: {
				databaseUrl: 'file:prod.db',
				authToken: 'test-token'
			},
			session: {
				secret: 'super-secret'
			}
		});
	});
});
