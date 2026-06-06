import { supabase } from '$lib/supabase';

export const pdfService = {
	async getAll(userId: string) {
		const { data, error } = await supabase
			.from('pdfs')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) throw error;

		return data ?? [];
	},

	async create(pdf: any) {
		const { error } = await supabase
			.from('pdfs')
			insert(pdf);

		if (error) throw error;
	},

	async updateStatus(
		id: string,
		status: string,
		questionsCount = 0
	) {
		const { error } = await supabase
			.from('pdfs')
			.update({
				status,
				questions_count: questionsCount
			})
			.eq('id', id);

		if (error) throw error;
	}
};