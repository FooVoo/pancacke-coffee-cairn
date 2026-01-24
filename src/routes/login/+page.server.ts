import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { verifyUserCredentials, createSession } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required' });
		}

		const user = await verifyUserCredentials(username, password);
		if (!user) {
			return fail(400, { error: 'Invalid username or password' });
		}

		const session = await createSession(user.id);

		cookies.set('session_id', session.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		throw redirect(303, '/characters');
	}
};
