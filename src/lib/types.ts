export interface Alternative {
	id: string;
	text: string;
	isCorrect: boolean;
}

export interface Question {
	id: string;
	pdfId?: string;
	statement: string;
	alternatives: Alternative[];
	difficulty: 'Fácil' | 'Média' | 'Difícil';
	subject: string;
	topic: string;
	year?: number;
	source?: string;
	explanation?: string;
	createdAt: string;
}

export interface PDFDocument {
	id: string;
	filename: string;
	url?: string;
	createdAt: string;
	status: 'processing' | 'completed' | 'error';
	questionsCount: number;
}

export interface Quiz {
	id: string;
	title: string;
	createdAt: string;
	questions: Question[];
	answers: Record<string, string>; // questionId -> alternativeId
	score?: number; // percentage, e.g. 84
	timeTaken?: number; // in seconds
	completedAt?: string;
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
	createdAt: string;
	title?: string;
}

export interface Flashcard {
	id: string;
	front: string;
	back: string;
	subject: string;
	difficulty: string;
	interval: number; // in days
	repetition: number; // number of consecutive correct answers
	efactor: number; // easiness factor (default 2.5)
	nextReview: string; // ISO string date
	createdAt: string;
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
