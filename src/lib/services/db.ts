import { notesService } from './notes';
import { flashcardsService } from './flashcards';
import { pdfService } from './pdfs';
import { quizzesService } from './quizzes';
import { getQuestions, createQuestion, getQuestionsByPdf, deleteQuestion } from './questions';
import type { Question, Quiz, StudyNote, Flashcard, PerformanceStats, PDFDocument } from '$lib/types';

let currentUserId: string | null = null;

export const db = {
	// Service access (for backwards compatibility)
	notes: notesService,
	flashcards: flashcardsService,
	pdfs: pdfService,
	quizzes: quizzesService,

	// User management
	setCurrentUser(userId: string) {
		currentUserId = userId;
		if (typeof window !== 'undefined') {
			localStorage.setItem('studymock_user_id', userId);
		}
	},

	getCurrentUserId(): string | null {
		if (!currentUserId && typeof window !== 'undefined') {
			currentUserId = localStorage.getItem('studymock_user_id');
		}
		return currentUserId;
	},

	// Gemini API Key management (localStorage)
	getGeminiApiKey(): string {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('gemini_api_key') || '';
		}
		return '';
	},

	saveGeminiApiKey(key: string): void {
		if (typeof window !== 'undefined') {
			localStorage.setItem('gemini_api_key', key);
		}
	},

	// Questions
	async getQuestions(): Promise<Question[]> {
		const userId = this.getCurrentUserId();
		return getQuestions(userId || undefined);
	},

	async getQuestionsByPdf(pdfId: string): Promise<Question[]> {
		return getQuestionsByPdf(pdfId);
	},

	async saveQuestion(question: Question): Promise<void> {
		const userId = this.getCurrentUserId();
		if (!userId) throw new Error('User not authenticated');
		await createQuestion(question, userId);
	},

	async deleteQuestion(id: string): Promise<void> {
		return deleteQuestion(id);
	},

	// PDFs
	async getPDFs(): Promise<PDFDocument[]> {
		const userId = this.getCurrentUserId();
		if (!userId) return [];
		return pdfService.getAll(userId);
	},

	async addPDF(pdf: PDFDocument): Promise<void> {
		const userId = this.getCurrentUserId();

		if (!userId) {
			throw new Error('User not authenticated');
		}

		await pdfService.create({
			...pdf,
			user_id: userId
		});
	},

	async savePDF(pdf: Partial<PDFDocument>) {
		const userId = this.getCurrentUserId();

		if (!userId) {
			throw new Error('User not authenticated');
		}

		return pdfService.create({
			...pdf,
			user_id: userId
		});
	},

	// Quizzes
	async getQuizzes(): Promise<Quiz[]> {
		const userId = this.getCurrentUserId();
		if (!userId) return [];
		return quizzesService.getAll(userId);
	},

	async getQuizById(quizId: string): Promise<Quiz | null> {
		try {
			return await quizzesService.getById(quizId);
		} catch (error) {
			console.error('Error fetching quiz:', error);
			return null;
		}
	},

	async saveQuiz(quiz: Quiz): Promise<void> {
		const userId = this.getCurrentUserId();
		if (!userId) throw new Error('User not authenticated');
		// This method needs to be enhanced in the quizzesService
		// For now, we'll handle both create and update scenarios
		if (quiz.id) {
			await quizzesService.updateQuizResults(quiz.id, {
				status: quiz.status as 'completed',
				score: quiz.score || 0,
				time_taken: quiz.timeTaken || 0,
				correct_answers: quiz.correctAnswers,
				wrong_answers: quiz.wrongAnswers,
				completed_at: quiz.completedAt || null as any
			});
		} else {
			await quizzesService.create(quiz, userId);
		}
	},

	async deleteQuiz(quizId: string): Promise<void> {
		return quizzesService.delete(quizId);
	},

	// Notes
	async getNotes(): Promise<StudyNote[]> {
		const userId = this.getCurrentUserId();
		if (!userId) return [];
		return notesService.getAll(userId);
	},

	async saveNote(note: StudyNote): Promise<void> {
		const userId = this.getCurrentUserId();
		if (!userId) throw new Error('User not authenticated');
		return notesService.save(note, userId);
	},

	async deleteNote(noteId: string): Promise<void> {
		return notesService.delete(noteId);
	},

	// Flashcards
	async getFlashcards(): Promise<Flashcard[]> {
		const userId = this.getCurrentUserId();
		if (!userId) return [];
		return flashcardsService.getAll(userId);
	},

	async saveFlashcard(card: Flashcard): Promise<void> {
		const userId = this.getCurrentUserId();
		if (!userId) throw new Error('User not authenticated');
		return flashcardsService.save(card, userId);
	},

	async deleteFlashcard(cardId: string): Promise<void> {
		return flashcardsService.delete(cardId);
	},

	// Stats and analytics
	getStats(): PerformanceStats {
		// This should aggregate data from quizzes
		// For now, return a default structure
		return {
			totalAnswered: 0,
			totalCorrect: 0,
			totalIncorrect: 0,
			accuracyRate: 0,
			averageTime: 0,
			bySubject: {},
			byDate: []
		};
	},

	// Bulk operations
	async saveQuestions(questions: Question[]): Promise<void> {
		const userId = this.getCurrentUserId();
		if (!userId) throw new Error('User not authenticated');
		for (const question of questions) {
			await createQuestion(question, userId);
		}
	},

	async saveQuizzes(quizzes: Quiz[]): Promise<void> {
		for (const quiz of quizzes) {
			await this.saveQuiz(quiz);
		}
	}
};