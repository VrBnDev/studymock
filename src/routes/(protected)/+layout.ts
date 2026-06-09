import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { initAuth } from '$lib/services/authHelpers';
import { get } from 'svelte/store';
import { authUser, authLoading } from '$lib/stores/auth';

export const load: LayoutLoad = async ({ url }) => {
	// Se já foi inicializado, usar o store
	const loading = get(authLoading);
	const user = get(authUser);

	// Se ainda está carregando e não tem usuário, aguardar/redirecionar
	if (loading && !user) {
		await initAuth();
	}

	const currentUser = get(authUser);

	// Se não tem usuário, redirecionar para login
	if (!currentUser) {
		throw redirect(307, '/login');
	}

	return {
		user: currentUser
	};
};
