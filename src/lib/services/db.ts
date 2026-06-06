import { questionsService } from './questions';
import { notesService } from './notes';
import { flashcardsService } from './flashcards';
import { pdfService } from './pdfs';
import { quizzesService } from './quizzes';

export const db = {
	questions: questionsService,
	notes: notesService,
	flashcards: flashcardsService,
	pdfs: pdfService,
	quizzes: quizzesService
};