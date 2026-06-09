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
		const { data, error } = await supabase
			.from('pdfs')
			.insert(pdf)
			.select()
			.single();

		if (error) throw error;

		return data;
	},

	async updateStatus(
		id: string,
		status: string,
		questions_count = 0
	) {
		const { error } = await supabase
			.from('pdfs')
			.update({
				status,
				questions_count: questions_count
			})
			.eq('id', id);

		if (error) throw error;
	}
};