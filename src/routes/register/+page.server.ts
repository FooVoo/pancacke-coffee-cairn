import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createUser, createSession, getUserByUsername } from '$lib/server/auth';
import { env } from '$lib/server/env';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!username || !email || !password) {
			return fail(400, { error: 'All fields are required' });
		}

		if (password.length < 4) {
			return fail(400, { error: 'Password must be at least 4 characters' });
		}

		// Check if user already exists
		const existingUser = await getUserByUsername(username);
		if (existingUser) {
			return fail(400, { error: 'Username already exists' });
		}

		try {
			const user = await createUser(username, email, password);
			const session = await createSession(user.id);

			cookies.set('session_id', session.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: env.isProduction,
				maxAge: env.session.maxAge
			});
		} catch (error) {
			return fail(500, { error: 'Failed to create account' });
		}

		throw redirect(303, '/characters');
	}
};
