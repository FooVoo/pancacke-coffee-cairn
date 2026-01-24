/**
 * Centralized environment configuration
 * All environment variables should be accessed through this module
 */

export interface EnvConfig {
	// TursoDB Configuration
	turso: {
		databaseUrl: string;
		authToken?: string;
	};
	// Session Configuration
	session: {
		secret: string;
		maxAge: number; // in seconds
	};
	// Environment
	nodeEnv: string;
	isProduction: boolean;
	isDevelopment: boolean;
}

function getEnvConfig(): EnvConfig {
	const nodeEnv = process.env.NODE_ENV || 'development';
	const isProduction = nodeEnv === 'production';
	const isDevelopment = nodeEnv === 'development';

	// TursoDB configuration
	const databaseUrl = process.env.TURSO_DATABASE_URL || ':memory:';
	const authToken = process.env.TURSO_AUTH_TOKEN;

	// Session configuration
	const sessionSecret = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
	const sessionMaxAge = 60 * 60 * 24 * 30; // 30 days

	// Validation in production
	if (isProduction) {
		if (!process.env.TURSO_DATABASE_URL) {
			console.warn('WARNING: TURSO_DATABASE_URL not set in production environment');
		}
		if (!process.env.TURSO_AUTH_TOKEN) {
			console.warn('WARNING: TURSO_AUTH_TOKEN not set in production environment');
		}
		if (sessionSecret === 'dev-secret-change-in-production') {
			console.warn('WARNING: SESSION_SECRET not set in production environment');
		}
	}

	return {
		turso: {
			databaseUrl,
			authToken
		},
		session: {
			secret: sessionSecret,
			maxAge: sessionMaxAge
		},
		nodeEnv,
		isProduction,
		isDevelopment
	};
}

// Export singleton config instance
export const env = getEnvConfig();
