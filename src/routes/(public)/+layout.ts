import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	// Páginas públicas (login, callback) não precisam de proteção
	return {};
};
