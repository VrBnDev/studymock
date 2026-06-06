import { supabase } from '$lib/supabase';

export const flashcardsService = {
	async getAll(userId: string) {
		const { data, error } = await supabase
			.from('flashcards')
			.select('*')
			.eq('user_id', userId);

		if (error) throw error;

		return data ?? [];
	},

	async save(card: any, userId: string) {
		const { error } = await supabase
			.from('flashcards')
			.upsert({
				...card,
				user_id: userId
			});

		if (error) throw error;
	},

	async delete(id: string) {
		const { error } = await supabase
			.from('flashcards')
			.delete()
			.eq('id', id);

		if (error) throw error;
	}
};