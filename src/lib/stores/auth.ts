import { writable, derived } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

export const authUser = writable<User | null>(null);
export const authLoading = writable(true);
export const authError = writable<string | null>(null);

// Derived store para verificar se está autenticado
export const isAuthenticated = derived(authUser, $authUser => !!$authUser);

// Derived store para ID do usuário
export const userId = derived(authUser, $authUser => $authUser?.id || null);
