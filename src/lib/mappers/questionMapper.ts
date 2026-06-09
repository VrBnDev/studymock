import type { Question } from '$lib/types';
import type { QuestionRow, AlternativeRow } from '$lib/types/database';

export function mapQuestion(
	row: QuestionRow,
	alternatives: AlternativeRow[]
): Question {
	return {
		id: row.id,
		pdfId: row.pdf_id ?? undefined,
		statement: row.statement,

		difficulty:
			(row.difficulty as Question['difficulty']) ??
			'Fácil',

		subject: row.subject,
		topic: row.topic,

		year: row.year ?? undefined,

		source: row.source ?? undefined,

		explanation:
			row.explanation ?? undefined,

		createdAt: row.created_at,

		alternatives: alternatives.map(a => ({
			id: a.id,
			text: a.text,
			isCorrect: a.is_correct
		}))
	};
}