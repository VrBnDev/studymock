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
		// Atualização
		if (card.id) {
			const { error } = await supabase
				.from('flashcards')
				.update({
					front: card.front,
					back: card.back,
					subject: card.subject,
					difficulty: card.difficulty,
					interval: card.interval,
					repetition: card.repetition,
					efactor: card.efactor,
					next_review: card.nextReview
				})
				.eq('id', card.id);

			if (error) throw error;

			return;
		}

		// Criação
		const { error } = await supabase
			.from('flashcards')
			.insert({
				user_id: userId,
				front: card.front,
				back: card.back,
				subject: card.subject,
				difficulty: card.difficulty,
				interval: card.interval,
				repetition: card.repetition,
				efactor: card.efactor,
				next_review: card.nextReview,
				created_at: card.createdAt
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