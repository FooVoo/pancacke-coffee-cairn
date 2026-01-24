import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Redirect to characters page (works for both authenticated and anonymous users)
	throw redirect(308, '/characters');
};
