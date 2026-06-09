import type { LayoutLoad } from './$types';
import { initAuth, setupAuthListener } from '$lib/services/authHelpers';

export const load: LayoutLoad = async () => {
	// Inicializar autenticação (deve ser chamado uma única vez no app)
	await initAuth();

	return {};
};

