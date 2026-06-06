import { supabase } from '$lib/supabase';

export const quizzesService = {
	async getAll(userId: string) {
		const { data, error } = await supabase
			.from('quizzes')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) throw error;

		return data ?? [];
	},

	async save(quiz: any) {
		const { error } = await supabase
			.from('quizzes')
			upsert(quiz);

		if (error) throw error;
	}
};