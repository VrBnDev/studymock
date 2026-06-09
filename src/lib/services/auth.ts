import { supabase } from '$lib/supabase';

export const authService = {
	async signInWithGoogle() {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google'
		});

		if (error) throw error;
	},

	async signInWithGithub() {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'github'
		});

		if (error) throw error;
	},

	async signOut() {
		const { error } = await supabase.auth.signOut();

		if (error) throw error;
	},

	async getUser() {
		const {
			data: { user }
		} = await supabase.auth.getUser();

		return user;
	},

	async getSession() {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		return session;
	}
};

export async function getCurrentUser() {
	const {
		data: { user }
	} = await supabase.auth.getUser()

	return user
}