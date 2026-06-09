import { redirect } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
	const session = await event.locals.getSession();

	const publicRoutes = [
		'/login',
		'/auth-error'
	];

	const isPublic = publicRoutes.some(route =>
		event.url.pathname.startsWith(route)
	);

	if (!session && !isPublic) {
		throw redirect(302, '/login');
	}

	return resolve(event);
};