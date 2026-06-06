import { supabase } from '$lib/supabase';
import type { Question } from '$lib/types';

export const questionsService = {
	async getAll(): Promise<Question[]> {
		const { data, error } = await supabase
			.from('questions')
			.select(`
				*,
				alternatives (*)
			`)
			.order('created_at', { ascending: false });

		if (error) throw error;

		return (data || []).map(q => ({
			...q,
			createdAt: q.created_at,
			alternatives: q.alternatives.map((a: any) => ({
				id: a.id,
				text: a.text,
				isCorrect: a.is_correct
			}))
		}));
	},

	async getById(id: string) {
		const { data, error } = await supabase
			.from('questions')
			.select(`
				*,
				alternatives (*)
			`)
			.eq('id', id)
			.single();

		if (error) throw error;

		return data;
	},

	async create(question: Question) {
		const { alternatives, ...q } = question;

		const { error } = await supabase
			.from('questions')
			.insert({
				id: q.id,
				statement: q.statement,
				difficulty: q.difficulty,
				subject: q.subject,
				topic: q.topic,
				year: q.year,
				source: q.source,
				explanation: q.explanation
			});

		if (error) throw error;

		if (alternatives.length) {
			await supabase
				.from('alternatives')
				.insert(
					alternatives.map(a => ({
						id: a.id,
						question_id: q.id,
						text: a.text,
						is_correct: a.isCorrect
					}))
				);
		}
	}
};