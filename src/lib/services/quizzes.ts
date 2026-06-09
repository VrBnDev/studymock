import { supabase } from '$lib/supabase';
import type { Quiz, QuizAnswer } from '$lib/types';

export const quizzesService = {
	async getAll(userId: string) {
		const { data, error } = await supabase
			.from('quizzes')
			.select(`
				*,
				quiz_questions(
					question_id,
					questions(*)
				),
				quiz_answers(*)
			`)
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) throw error;

		return data ?? [];
	},

	async getById(quizId: string) {
		const { data, error } = await supabase
			.from('quizzes')
			.select(`
				*,
				quiz_questions(
					question_id,
					questions(*, alternatives(*))
				),
				quiz_answers(*, alternatives(*))
			`)
			.eq('id', quizId)
			.single();

		if (error) throw error;

		return data;
	},

	async create(quiz: Omit<Quiz, 'id' | 'createdAt' | 'completedAt'>, userId: string) {
		const { data, error } = await supabase
			.from('quizzes')
			.insert({
				user_id: userId,
				title: quiz.title,
				status: quiz.status,
				total_questions: quiz.questions?.length || 0,
				score: null,
				time_taken: null,
				correct_answers: 0,
				wrong_answers: 0
			})
			.select()
			.single();

		if (error) throw error;

		// Add questions to quiz
		if (quiz.questions && quiz.questions.length > 0) {
			await this.addQuestionsToQuiz(data.id, quiz.questions.map(q => q.id));
		}

		return data;
	},

	async addQuestionsToQuiz(quizId: string, questionIds: string[]) {
		const { error } = await supabase
			.from('quiz_questions')
			.insert(
				questionIds.map(qid => ({
					quiz_id: quizId,
					question_id: qid
				}))
			);

		if (error) throw error;
	},

	async saveAnswer(quizId: string, questionId: string, alternativeId: string, isCorrect: boolean) {
		const { data, error } = await supabase
			.from('quiz_answers')
			.insert({
				quiz_id: quizId,
				question_id: questionId,
				alternative_id: alternativeId,
				is_correct: isCorrect
			})
			.select()
			.single();

		if (error) throw error;

		return data;
	},

	async updateQuizResults(
		quizId: string,
		results: {
			status: 'completed';
			score: number;
			time_taken: number;
			correct_answers: number;
			wrong_answers: number;
			completed_at: string;
		}
	) {
		const { error } = await supabase
			.from('quizzes')
			.update(results)
			.eq('id', quizId);

		if (error) throw error;
	},

	async delete(quizId: string) {
		// Delete related records first
		await supabase
			.from('quiz_answers')
			.delete()
			.eq('quiz_id', quizId);

		await supabase
			.from('quiz_questions')
			.delete()
			.eq('quiz_id', quizId);

		// Delete the quiz
		const { error } = await supabase
			.from('quizzes')
			.delete()
			.eq('id', quizId);

		if (error) throw error;
	}
};