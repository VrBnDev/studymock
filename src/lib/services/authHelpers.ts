import { supabase } from '$lib/supabase';
import { authUser, authLoading, authError } from '$lib/stores/auth';
import { db } from './db';

export async function initAuth() {
	try {
		authLoading.set(true);
		
		// Verificar sessão atual
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();
		
		if (sessionError) throw sessionError;

		if (session?.user) {
			authUser.set(session.user);
			db.setCurrentUser(session.user.id);
			
			// Garantir que o perfil existe
			await ensureProfileExists(session.user);
		} else {
			authUser.set(null);
		}
	} catch (error) {
		console.error('Auth init error:', error);
		authError.set(error instanceof Error ? error.message : 'Erro ao inicializar autenticação');
		authUser.set(null);
	} finally {
		authLoading.set(false);
	}
}

// Listener para mudanças de autenticação
export function setupAuthListener() {
	return supabase.auth.onAuthStateChange(async (event, session) => {
		if (session?.user) {
			authUser.set(session.user);
			db.setCurrentUser(session.user.id);
			
			if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
				await ensureProfileExists(session.user);
			}
		} else {
			authUser.set(null);
			authError.set(null);
		}
	});
}

// Garantir que o perfil do usuário existe
async function ensureProfileExists(user: any) {
	try {
		const { data: profile, error: fetchError } = await supabase
			.from('profiles')
			.select('id')
			.eq('id', user.id)
			.single();

		if (fetchError && fetchError.code !== 'PGRST116') {
			throw fetchError;
		}

		// Se não existe, criar perfil
		if (!profile) {
			const { error: createError } = await supabase
				.from('profiles')
				.insert({
					id: user.id,
					name: user.user_metadata?.name || user.email?.split('@')[0],
					avatar_url: user.user_metadata?.avatar_url || null
				});

			if (createError) throw createError;
		}
	} catch (error) {
		console.error('Error ensuring profile exists:', error);
	}
}

export async function signInWithGoogle() {
	try {
		authError.set(null);
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});

		if (error) throw error;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erro ao fazer login com Google';
		authError.set(message);
		throw error;
	}
}

export async function signInWithGithub() {
	try {
		authError.set(null);
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'github',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});

		if (error) throw error;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erro ao fazer login com GitHub';
		authError.set(message);
		throw error;
	}
}

export async function signOut() {
	try {
		authError.set(null);
		const { error } = await supabase.auth.signOut();

		if (error) throw error;

		authUser.set(null);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erro ao fazer logout';
		authError.set(message);
		throw error;
	}
}

export async function getCurrentUser() {
	const { data: { user }, error } = await supabase.auth.getUser();

	if (error) throw error;

	return user;
}
