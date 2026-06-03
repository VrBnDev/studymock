import type { Question, PerformanceStats } from '../types';

/**
 * Gemini AI Service
 * Handles AI-powered question extraction, tutoring, and flashcard generation.
 */

// Call the Gemini API directly from the browser
async function callGemini(prompt: string, apiKey: string, jsonMode = false): Promise<string> {
	// We can use gemini-2.5-flash or gemini-2.0-flash
	const model = 'gemini-1.5-flash';
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			contents: [
				{
					parts: [
						{ text: prompt }
					]
				}
			],
			generationConfig: jsonMode ? {
				responseMimeType: 'application/json'
			} : undefined
		})
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err?.error?.message || `Erro na API do Gemini: ${response.status}`);
	}

	const data = await response.json();
	return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export const gemini = {
	/**
	 * Parse questions from PDF extracted text
	 */
	async parseQuestionsFromText(text: string, apiKey: string): Promise<Partial<Question>[]> {
		if (!apiKey) {
			return this.fallbackHeuristicParser(text);
		}

		const prompt = `Analise o texto a seguir extraído de um PDF de prova ou simulado e extraia as questões de múltipla escolha que encontrar.
Retorne o resultado ESTRITAMENTE como um objeto JSON contendo um array "questions" no seguinte formato de esquema:
{
  "questions": [
    {
      "statement": "Enunciado completo da questão, sem incluir as letras das alternativas aqui.",
      "alternatives": [
        { "text": "Texto da alternativa A", "isCorrect": false },
        { "text": "Texto da alternativa B", "isCorrect": false },
        { "text": "Texto da alternativa C", "isCorrect": true },
        { "text": "Texto da alternativa D", "isCorrect": false }
      ],
      "difficulty": "Fácil" | "Média" | "Difícil",
      "subject": "Disciplina principal (ex: Redes de Computadores, Segurança da Informação, Banco de Dados, Português, Matemática)",
      "topic": "Assunto específico da disciplina (ex: Protocolo TCP, Criptografia Assimétrica, Normalização SQL)",
      "explanation": "Explicação pedagógica detalhada explicando por que a alternativa marcada como 'isCorrect: true' está certa e por que as demais estão erradas."
    }
  ]
}

Regras importantes:
1. Extraia o máximo de questões completas possíveis.
2. Certifique-se de que cada questão tenha exatamente uma alternativa marcada como 'isCorrect: true'.
3. Identifique com precisão qual alternativa é a correta no contexto do texto.
4. Mantenha os textos originais, limpando apenas ruídos de cabeçalho ou numeração de rodapé se necessário.

Texto extraído do PDF:
${text}`;

		try {
			const jsonText = await callGemini(prompt, apiKey, true);
			const parsed = JSON.parse(jsonText);
			return parsed.questions || [];
		} catch (error) {
			console.error('Erro ao parser com Gemini, executando fallback heurístico:', error);
			return this.fallbackHeuristicParser(text);
		}
	},

	/**
	 * Local fallback heuristic parser when API key is missing or calls fail
	 */
	fallbackHeuristicParser(text: string): Partial<Question>[] {
		console.log('Executando parser heurístico local...');
		const questions: Partial<Question>[] = [];
		
		// Simple split on Question/Questão indicators
		const questionBlocks = text.split(/(?=Questão\s+\d+|Q\d+|Question\s+\d+|^\d+[\.\-\)]\s+Qual|^\d+[\.\-\)]\s+O\s+que)/im);
		
		questionBlocks.forEach((block, idx) => {
			if (block.trim().length < 50) return; // Skip short blocks
			
			// Try to extract lines
			const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
			if (lines.length < 3) return;

			// Check for alternatives (A, B, C, D, E or a, b, c, d, e)
			const altRegex = /^([A-Ea-e])[\)\.\-\s]\s*(.+)$/;
			const statementLines: string[] = [];
			const alternatives: { text: string; isCorrect: boolean }[] = [];

			lines.forEach(line => {
				const match = line.match(altRegex);
				if (match) {
					alternatives.push({
						text: match[2].trim(),
						isCorrect: false
					});
				} else {
					// Only add to statement if we haven't found alternatives yet
					if (alternatives.length === 0) {
						statementLines.push(line);
					}
				}
			});

			if (alternatives.length >= 2) {
				// Mark the first one as correct by default for mock purposes
				alternatives[0].isCorrect = true;

				// Try to clean statement
				const rawStatement = statementLines.join('\n');
				const cleanStatement = rawStatement.replace(/^(Questão\s+\d+|Q\d+|^\d+[\.\-\)]\s*)/i, '').trim();

				// Guess subject/topic based on key words
				let subject = 'Geral';
				let topic = 'Outros';
				const statementLower = cleanStatement.toLowerCase();

				if (statementLower.includes('ip') || statementLower.includes('porta') || statementLower.includes('protocolo') || statementLower.includes('redes') || statementLower.includes('http')) {
					subject = 'Redes de Computadores';
					topic = 'Protocolos';
				} else if (statementLower.includes('cripto') || statementLower.includes('chave') || statementLower.includes('segurança') || statementLower.includes('ataque') || statementLower.includes('hash')) {
					subject = 'Segurança da Informação';
					topic = 'Criptografia';
				} else if (statementLower.includes('sql') || statementLower.includes('tabela') || statementLower.includes('banco') || statementLower.includes('acid') || statementLower.includes('database')) {
					subject = 'Banco de Dados';
					topic = 'Modelagem Relacional';
				}

				questions.push({
					statement: cleanStatement || 'Questão sem enunciado extraível',
					alternatives,
					difficulty: Math.random() > 0.6 ? 'Média' : 'Fácil',
					subject,
					topic,
					explanation: 'Questão importada via parser heurístico local. Ative sua Chave do Gemini nas Configurações para obter explicações didáticas completas geradas por Inteligência Artificial.'
				});
			}
		});

		// If no questions were parsed, generate at least one mock question so it is not empty
		if (questions.length === 0) {
			questions.push({
				statement: "Não foi possível estruturar automaticamente as questões deste PDF usando a heurística local. Por favor, adicione sua Chave de API do Gemini para realizar o parse inteligente ou insira a questão manualmente.",
				alternatives: [
					{ text: "Entendido (Opção Correta)", isCorrect: true },
					{ text: "Tentar Novamente", isCorrect: false }
				],
				difficulty: "Fácil",
				subject: "Configurações",
				topic: "Importação",
				explanation: "Insira uma chave API do Gemini para obter extrações de alta qualidade de qualquer PDF de concurso."
			});
		}

		return questions;
	},

	/**
	 * Ask AI Tutor about a specific question that the user solved
	 */
	async askTutorAboutQuestion(
		question: Question,
		chosenAlternativeText: string,
		isCorrect: boolean,
		apiKey: string
	): Promise<string> {
		if (!apiKey) {
			return `**Tutor StudyMock (Modo Local):**
Você respondeu esta questão e o sistema marcou como **${isCorrect ? 'CORRETA' : 'INCORRETA'}**.
Sua resposta: *"${chosenAlternativeText}"*.

*Dica de Estudo:* Esta questão pertence ao assunto **${question.subject} -> ${question.topic}**.
Para obter explicações detalhadas em tempo real e tirar dúvidas interativas com a IA, por favor configure sua **Chave de API do Gemini** na aba de Configurações!`;
		}

		const prompt = `Você é o Tutor StudyMock, um assistente virtual especialista em ajudar estudantes a passarem em concursos e exames.
O estudante acabou de responder a seguinte questão:
Disciplina: ${question.subject}
Assunto: ${question.topic}
Dificuldade: ${question.difficulty}
Enunciado: ${question.statement}
Alternativas:
${question.alternatives.map(a => `- ${a.text} ${a.isCorrect ? '(CORRETA)' : ''}`).join('\n')}

O estudante respondeu: "${chosenAlternativeText}"
O resultado do estudante foi: ${isCorrect ? 'ACERTO' : 'ERRO'}

Explicação padrão da questão: ${question.explanation || 'Não cadastrada.'}

Instruções:
1. Responda de forma motivadora, direta e didática.
2. Explique com calma os conceitos envolvidos (ex: se for sobre redes, fale sobre portas, camadas, etc.).
3. Se o aluno errou, aponte exatamente o provável motivo da confusão e como diferenciar as alternativas.
4. Se o aluno acertou, dê um breve reforço conceitual para fixar.
5. Escreva sua resposta em formato Markdown legível.`;

		try {
			return await callGemini(prompt, apiKey);
		} catch (error: any) {
			return `Erro ao falar com o Tutor de IA: ${error.message}`;
		}
	},

	/**
	 * General Tutor conversation and analysis of weak spots
	 */
	async getGeneralTutorAdvice(stats: PerformanceStats, userMessage: string, apiKey: string): Promise<string> {
		if (!apiKey) {
			// Find weak spots in stats
			const weakSubjects = Object.entries(stats.bySubject)
				.filter(([_, data]) => data.rate < 70)
				.map(([name, data]) => `${name} (${data.rate}% de acerto)`);

			return `**Tutor StudyMock (Modo Local):**
Identifiquei que você respondeu um total de **${stats.totalAnswered} questões** com **${stats.accuracyRate}% de precisão**.

${weakSubjects.length > 0 
	? `Seus principais pontos de atenção são:\n${weakSubjects.map(s => `- ${s}`).join('\n')}\nRecomendo focar nos flashcards desses temas!` 
	: 'Parabéns! Suas taxas de acerto estão sólidas em todos os assuntos cadastrados. Continue praticando simulados.'}

*Para ter uma conversa dinâmica, tirar dúvidas e criar trilhas personalizadas de estudo com IA, insira sua chave API do Gemini nas Configurações.*`;
		}

		const weakSubjects = Object.entries(stats.bySubject)
			.map(([name, data]) => `- ${name}: ${data.total} questões feitas, ${data.rate}% de precisão`)
			.join('\n');

		const prompt = `Você é o Tutor StudyMock, um mentor de IA altamente qualificado para preparação de estudantes para concursos públicos e exames acadêmicos.
Aqui estão as estatísticas atuais de desempenho do estudante:
- Total de questões respondidas: ${stats.totalAnswered}
- Total de acertos: ${stats.totalCorrect}
- Taxa geral de acertos: ${stats.accuracyRate}%
- Tempo médio por questão: ${stats.averageTime} segundos
- Desempenho por disciplina:
${weakSubjects || 'Nenhuma questão respondida ainda.'}

Mensagem atual do estudante: "${userMessage}"

Sua tarefa:
1. Responda à dúvida ou comando do estudante.
2. Dê conselhos acionáveis baseados no desempenho dele (ex: se ele está com taxa baixa em Redes, recomende um cronograma ou tópicos específicos como portas ou protocolos).
3. Seja amigável, focado na produtividade e utilize recursos de formatação Markdown para deixar o texto bem estruturado.`;

		try {
			return await callGemini(prompt, apiKey);
		} catch (error: any) {
			return `Erro ao obter conselhos do Tutor: ${error.message}`;
		}
	},

	/**
	 * Automatically generate Flashcards from study notes
	 */
	async generateFlashcardsFromNote(noteContent: string, apiKey: string): Promise<Array<{ front: string; back: string }>> {
		if (!apiKey) {
			// Return a simple split heuristic for local testing
			const lines = noteContent.split('\n').filter(l => l.includes(':') || l.includes('='));
			if (lines.length > 0) {
				return lines.map(line => {
					const parts = line.split(/[:=]/);
					return {
						front: `O que significa: ${parts[0].trim()}?`,
						back: parts.slice(1).join('=').trim()
					};
				});
			}
			return [
				{
					front: "Conceito chave do texto da nota",
					back: "Explicação resumida do conceito (insira a chave do Gemini para gerar flashcards inteligentes automaticamente de qualquer anotação)"
				}
			];
		}

		const prompt = `Analise a anotação de estudos a seguir e gere até 5 flashcards no formato pergunta-resposta (frente-verso).
Retorne o resultado ESTRITAMENTE como um objeto JSON contendo um array "flashcards" no seguinte formato de esquema:
{
  "flashcards": [
    {
      "front": "Pergunta objetiva e direta para a frente do cartão.",
      "back": "Resposta curta e precisa para o verso do cartão."
    }
  ]
}

Anotação de estudos:
${noteContent}`;

		try {
			const jsonText = await callGemini(prompt, apiKey, true);
			const parsed = JSON.parse(jsonText);
			return parsed.flashcards || [];
		} catch (error) {
			console.error('Erro ao gerar flashcards com Gemini:', error);
			return [
				{ front: "Nota de estudo", back: noteContent.substring(0, 100) + '...' }
			];
		}
	}
};
