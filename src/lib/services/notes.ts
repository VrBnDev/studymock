import { supabase } from '$lib/supabase';
import type { StudyNote } from '$lib/types';

export const notesService = {
	async getAll(userId: string): Promise<StudyNote[]> {
		const { data, error } = await supabase
			.from('notes')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) throw error;

		return (data || []).map(n => ({
			id: n.id,
			questionId: n.question_id,
			title: n.title,
			content: n.content,
			createdAt: n.created_at
		}));
	},

	async save(note: StudyNote, userId: string) {
		const { error } = await supabase
			.from('notes')
			.upsert({
				id: note.id,
				user_id: userId,
				question_id: note.questionId,
				title: note.title,
				content: note.content
			});

		if (error) throw error;
	},

	async delete(id: string) {
		const { error } = await supabase
			.from('notes')
			.delete()
			.eq('id', id);

		if (error) throw error;
	}
};