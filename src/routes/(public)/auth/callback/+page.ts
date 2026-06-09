import { redirect } from '@sveltejs/kit';

export async function load() {
	// O callback do Supabase é tratado automaticamente pelo cliente
	// Após redirecionar aqui, vamos para o dashboard
	throw redirect(307, '/dashboard');
}
