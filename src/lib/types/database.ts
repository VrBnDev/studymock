export interface ProfileRow {
	id: string;
	name: string | null;
	avatar_url: string | null;
	created_at: string;
}

export interface PDFRow {
	id: string;
	user_id: string;
	filename: string;
	file_url: string | null;
	status: string;
	questions_count: number;
	created_at: string;
}

export interface QuestionRow {
	id: string;
	pdf_id: string | null;
	user_id: string | null;
	statement: string;
	difficulty: string | null;
	subject: string | null;
	topic: string | null;
	year: number | null;
	source: string | null;
	explanation: string | null;
	created_at: string;
}

export interface AlternativeRow {
	id: string;
	question_id: string;
	text: string;
	is_correct: boolean;
}

export interface QuizRow {
	id: string;
	user_id: string;
	title: string | null;
	score: number | null;
	time_taken: number | null;
	status: string | null;
	created_at: string;
	completed_at: string | null;
	total_questions: number;
	correct_answers: number;
	wrong_answers: number;
}

export interface QuizQuestionRow {
	quiz_id: string;
	question_id: string;
}

export interface QuizAnswerRow {
	id: string;
	quiz_id: string;
	question_id: string;
	alternative_id: string;
	is_correct: boolean;
	answered_at: string;
}

export interface NotesRow {
	id: string;
	user_id: string;
	question_id: string | null;
	title: string | null;
	content: string | null;
	created_at: string;
}

export interface FlashcardRow {
	id: string;
	user_id: string;
	front: string;
	back: string;
	subject: string | null;
	interval: number;
	repetition: number;
	efactor: number;
	next_review: string | null;
	created_at: string;
	difficulty: string | null;
}