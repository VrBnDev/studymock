import { supabase } from '$lib/supabase'
import type { Question } from '$lib/types'

export async function getQuestions(userId?: string): Promise<Question[]> {
	let query = supabase
		.from('questions')
		.select(`
			*,
			alternatives(*)
		`)

	if (userId) {
		query = query.eq('user_id', userId)
	}

	const { data, error } = await query

	if (error) {
		console.error(error)
		return []
	}

	return data.map(q => ({
		id: q.id,
		pdfId: q.pdf_id,
		userId: q.user_id,
		statement: q.statement,
		difficulty: q.difficulty,
		subject: q.subject,
		topic: q.topic,
		year: q.year,
		source: q.source,
		explanation: q.explanation,
		createdAt: q.created_at,
		alternatives: q.alternatives.map((a: any) => ({
			id: a.id,
			text: a.text,
			isCorrect: a.is_correct
		}))
	}))
}

export async function getQuestionsByPdf(pdfId: string): Promise<Question[]> {
	const { data, error } = await supabase
		.from('questions')
		.select(`
			*,
			alternatives(*)
		`)
		.eq('pdf_id', pdfId)

	if (error) {
		console.error(error)
		return []
	}

	return data.map(q => ({
		id: q.id,
		pdfId: q.pdf_id,
		userId: q.user_id,
		statement: q.statement,
		difficulty: q.difficulty,
		subject: q.subject,
		topic: q.topic,
		year: q.year,
		source: q.source,
		explanation: q.explanation,
		createdAt: q.created_at,
		alternatives: q.alternatives.map((a: any) => ({
			id: a.id,
			text: a.text,
			isCorrect: a.is_correct
		}))
	}))
}

export async function createQuestion(question: Question, userId: string) {
	const { alternatives } = question

	const { data: insertedQuestion, error } = await supabase
		.from('questions')
		.insert({
			statement: question.statement,
			pdf_id: question.pdfId || null,
			user_id: userId,
			difficulty: question.difficulty,
			subject: question.subject,
			topic: question.topic,
			year: question.year || null,
			source: question.source || null,
			explanation: question.explanation || null,
			created_at: question.createdAt
		})
		.select()
		.single()

	if (error) throw error

	if (alternatives && alternatives.length > 0) {
		const { error: alternativesError } = await supabase
			.from('alternatives')
			.insert(
				alternatives.map(a => ({
					question_id: insertedQuestion.id,
					text: a.text,
					is_correct: a.isCorrect
				}))
			)

		if (alternativesError) throw alternativesError
	}

	return insertedQuestion
}

export async function deleteQuestion(id: string) {
	const { error } = await supabase
		.from('questions')
		.delete()
		.eq('id', id)

	if (error) throw error
}