export interface Alternative {
	id: string;
	text: string;
	isCorrect: boolean;
}

export interface Question {
	id?: string;
	pdfId?: string;
	userId?: string;
	statement: string;
	alternatives: Alternative[];
	difficulty: 'Fácil' | 'Média' | 'Difícil';
	subject: string;
	topic: string;
	year?: number;
	source?: string;
	explanation?: string;
	created_at: string;
}

export interface PDFDocument {
	id: string;
	userId?: string;
	filename: string;
	url?: string;
	created_at: string;
	status:
		| 'processing'
		| 'completed'
		| 'error';
	questions_count: number;
}

export interface Quiz {
	id: string;
	userId: string;
	title: string;
	created_at: string;
	completedAt?: string;
	questions?: Question[];
	answers?: Record<string, string>; // questionId -> alternativeId
	score?: number; // in percentage or points
	timeTaken?: number; // in seconds
	totalQuestions: number;
	correctAnswers: number;
	wrongAnswers: number;
	status: 'in-progress' | 'completed';
}

export interface QuizAnswer {
	id: string;
	quizId: string;
	questionId: string;
	alternativeId: string;
	isCorrect: boolean;
	answeredAt: string;
}

export interface StudyNote {
	id: string;
	questionId?: string; // Linked question, if any
	content: string;
	created_at: string;
	title?: string;
}

export interface Flashcard {
	id?: string;
	front: string;
	back: string;
	subject: string;
	difficulty: string;
	interval: number; // in days
	repetition: number; // number of consecutive correct answers
	efactor: number; // easiness factor (default 2.5)
	nextReview: string; // ISO string date
	created_at: string;
}

export interface PerformanceStats {
	totalAnswered: number;
	totalCorrect: number;
	totalIncorrect: number;
	accuracyRate: number;
	averageTime: number; // in seconds per question
	bySubject: Record<string, { total: number; correct: number; rate: number }>;
	byDate: Array<{ date: string; rate: number; count: number }>;
}

export interface GeminiConfig {
	apiKey: string;
}

