import type { Question, PerformanceStats } from '../types';

/**
 * AI Service (opcional) + Parser Heurístico Local (principal)
 * O parser local é a abordagem primária. A IA é usada apenas se uma chave for fornecida.
 */

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

interface Alternative {
	text: string;
	isCorrect: boolean;
}

// ---------------------------------------------------------------------------
// Chamada opcional à API do Gemini (somente se apiKey fornecida)
// ---------------------------------------------------------------------------

async function callGemini(prompt: string, apiKey: string, jsonMode = false): Promise<string> {
	const model = 'gemini-1.5-flash';
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: [{ parts: [{ text: prompt }] }],
			generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined
		})
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err?.error?.message || `Erro na API do Gemini: ${response.status}`);
	}

	const data = await response.json();
	return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ---------------------------------------------------------------------------
// Utilitários do parser local
// ---------------------------------------------------------------------------

/** Detecta gabarito explícito no bloco: "Gabarito: C", "Resp: B", "Resposta: A" */
function detectCorrectFromGabarito(block: string): string | null {
	const match = block.match(/(?:[Gg]abarito|[Rr]esp(?:osta)?)\s*[:\-]?\s*([A-Ea-e])\b/);
	return match ? match[1].toUpperCase() : null;
}

/** Infere disciplina e tópico por palavras-chave */
function inferSubjectAndTopic(text: string): { subject: string; topic: string } {
	const t = text.toLowerCase();

	const rules: Array<{ keywords: string[]; subject: string; topic: string }> = [
		{ keywords: ['sistema', 'gauss', 'matriz', 'determinante', 'equação', 'linear', 'vetor', 'autovalor', 'polinômio', 'derivada', 'integral', 'limite', 'função', 'logaritmo', 'trigonometria', 'probabilidade', 'estatística', 'porcentagem', 'fração', 'mmc', 'mdc'], subject: 'Matemática', topic: 'Álgebra e Cálculo' },
		{ keywords: ['ip', 'tcp', 'udp', 'porta', 'http', 'dns', 'protocolo', 'roteamento', 'subnet', 'ospf', 'bgp', 'camada', 'rede'], subject: 'Redes de Computadores', topic: 'Protocolos e Camadas' },
		{ keywords: ['criptografia', 'chave pública', 'chave privada', 'hash', 'ssl', 'tls', 'certificado', 'rsa', 'aes', 'ataque', 'firewall', 'vulnerabilidade'], subject: 'Segurança da Informação', topic: 'Criptografia e Ataques' },
		{ keywords: ['sql', 'select', 'tabela', 'banco de dados', 'acid', 'normalização', 'índice', 'trigger', 'stored', 'nosql', 'relacional', 'join'], subject: 'Banco de Dados', topic: 'Modelagem e SQL' },
		{ keywords: ['algoritmo', 'complexidade', 'ordenação', 'busca', 'pilha', 'fila', 'árvore', 'grafo', 'recursão', 'big o', 'lista encadeada'], subject: 'Estruturas de Dados', topic: 'Algoritmos' },
		{ keywords: ['processo', 'thread', 'semáforo', 'deadlock', 'escalonamento', 'sistema operacional', 'memória virtual', 'paginação'], subject: 'Sistemas Operacionais', topic: 'Processos e Memória' },
		{ keywords: ['objeto', 'classe', 'herança', 'polimorfismo', 'encapsulamento', 'interface', 'java', 'python', 'orientação a objetos'], subject: 'Programação', topic: 'Orientação a Objetos' },
		{ keywords: ['constituição', 'artigo', 'lei', 'decreto', 'direito', 'jurídico', 'código civil', 'penal', 'administrativo'], subject: 'Direito', topic: 'Legislação' },
		{ keywords: ['sujeito', 'predicado', 'verbo', 'concordância', 'regência', 'crase', 'ortografia', 'pontuação', 'sintaxe', 'morfologia', 'interpretação'], subject: 'Língua Portuguesa', topic: 'Gramática e Interpretação' },
		{ keywords: ['administração', 'gestão', 'planejamento', 'controle', 'organização', 'liderança', 'motivação', 'burocracia'], subject: 'Administração', topic: 'Gestão Organizacional' },
		{ keywords: ['economia', 'inflação', 'pib', 'juros', 'fiscal', 'tributário', 'imposto', 'orçamento', 'receita', 'despesa'], subject: 'Economia e Finanças', topic: 'Macroeconomia' },
	];

	for (const rule of rules) {
		if (rule.keywords.some(kw => t.includes(kw))) {
			return { subject: rule.subject, topic: rule.topic };
		}
	}

	return { subject: 'Conhecimentos Gerais', topic: 'Outros' };
}

/** Estima dificuldade com base no tamanho do enunciado */
function estimateDifficulty(statement: string, alternatives: Alternative[]): 'Fácil' | 'Média' | 'Difícil' {
	const wordCount = statement.split(/\s+/).length;
	const avgAltLength = alternatives.reduce((sum, a) => sum + a.text.length, 0) / (alternatives.length || 1);
	if (wordCount > 80 || avgAltLength > 80) return 'Difícil';
	if (wordCount > 35 || avgAltLength > 40) return 'Média';
	return 'Fácil';
}

/** Remove ruídos de numeração, cabeçalho e rodapé do enunciado */
function cleanStatement(raw: string): string {
	return raw
		.replace(/^QUEST[ÃA]O\s*\d+\s*[\-–]?\s*/i, '')
		.replace(/^Q\.?\s*\d+[\.\-\)]\s*/i, '')
		.replace(/^\d{1,3}\s*[\.\-\)]\s*/, '')
		.replace(/\(gabarito[\s:]*[A-Ea-e]\)/gi, '')
		.replace(/página\s*\d+/gi, '')
		.replace(/©.*/g, '')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

// ---------------------------------------------------------------------------
// Expansão de alternativas em linha única
// ---------------------------------------------------------------------------

/**
 * Alguns PDFs colocam todas as alternativas na mesma linha:
 * "A) texto  B) texto  C) texto  D) texto  E) texto"
 *
 * Esta função detecta esse padrão e expande para múltiplas linhas.
 */
function expandInlineAlternatives(line: string): string[] {
	// Detecta se a linha contém pelo menos 2 marcadores de alternativa
	const inlineAltRegex = /([A-Ea-e])\s*[\)\.\-]\s*/g;
	const markers = [...line.matchAll(inlineAltRegex)];
	if (markers.length < 2) return [line];

	// Divide a linha nos marcadores
	const parts: string[] = [];
	for (let i = 0; i < markers.length; i++) {
		const start = markers[i].index!;
		const end = i + 1 < markers.length ? markers[i + 1].index! : line.length;
		parts.push(line.slice(start, end).trim());
	}
	return parts;
}

// ---------------------------------------------------------------------------
// Parser heurístico principal (sem IA)
// ---------------------------------------------------------------------------

/**
 * Extrai questões de múltipla escolha de texto puro sem nenhuma IA.
 *
 * Formatos suportados:
 *  - "QUESTÃO 01 – enunciado\nA) alt\nB) alt..."
 *  - "1. enunciado\na) alt\nb) alt..."
 *  - Alternativas na mesma linha: "A) texto  B) texto  C) texto"
 *  - Enunciado em múltiplas linhas (ex: sistemas de equações)
 *  - Gabarito explícito: "Gabarito: C"
 */
function heuristicParser(text: string): Partial<Question>[] {
	const questions: Partial<Question>[] = [];

	// ────────────────────────────────────────────────────────────
	// 1. Normalização
	// ────────────────────────────────────────────────────────────
	const normalized = text
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.replace(/\u00A0/g, ' ')
		.replace(/\u2013|\u2014/g, '-')
		.replace(/[ \t]+/g, ' ')
		.replace(/\n{3,}/g, '\n\n');

	console.group('[Parser Heurístico]');
	console.log('Caracteres:', normalized.length);
	console.log(
		'Questões encontradas:',
		normalized.match(/QUEST[ÃA]O\s+\d+/gi)?.length ?? 0
	);
	console.groupEnd();

	// ────────────────────────────────────────────────────────────
	// 2. Divide por QUESTÃO XX
	// ────────────────────────────────────────────────────────────
	let blocks =
		normalized.match(
			/QUEST[ÃA]O\s+\d+[\s\S]*?(?=QUEST[ÃA]O\s+\d+|$)/gi
		) || [];

	console.log('[Parser] Blocos:', blocks.length);

	// fallback
	if (blocks.length === 0) {
		blocks = normalized
			.split(/\n{2,}/)
			.map((b) => b.trim())
			.filter((b) => b.length > 50);
	}

	// ────────────────────────────────────────────────────────────
	// 3. Processa cada questão
	// ────────────────────────────────────────────────────────────
	for (const block of blocks) {
		try {
			// Remove cabeçalho da questão
			const content = block.replace(
				/^QUEST[ÃA]O\s+\d+\s*[-–.]?\s*/i,
				''
			);

			// Captura alternativas diretamente do bloco
			const altRegex =
				/([A-E])\)\s*([\s\S]*?)(?=(?:\s+[A-E]\))|$)/gi;

			const alternatives: Alternative[] = [];

			let match: RegExpExecArray | null;

			while ((match = altRegex.exec(content)) !== null) {
				const text = match[2]
					.replace(/\s+/g, ' ')
					.trim();

				if (text.length > 0) {
					alternatives.push({
						text,
						isCorrect: false
					});
				}
			}

			// POSCOMP deve ter 5 alternativas
			if (alternatives.length < 4) {
				console.warn(
					'Questão descartada - alternativas insuficientes:',
					alternatives.length
				);

				continue;
			}

			// Enunciado = tudo antes da primeira alternativa
			const firstAltIndex = content.search(/\bA\)/i);

			if (firstAltIndex < 0) {
				continue;
			}

			const statement = cleanStatement(
				content.substring(0, firstAltIndex).trim()
			);

			if (statement.length < 10) {
				continue;
			}

			// Gabarito
			const gabaritoLetter =
				detectCorrectFromGabarito(block);

			const letters = ['A', 'B', 'C', 'D', 'E'];

			if (gabaritoLetter) {
				const idx = letters.indexOf(gabaritoLetter);

				if (
					idx >= 0 &&
					idx < alternatives.length
				) {
					alternatives[idx].isCorrect = true;
				}
			} else {
				alternatives[0].isCorrect = true;
			}

			const fullText =
				statement +
				' ' +
				alternatives.map((a) => a.text).join(' ');

			const { subject, topic } =
				inferSubjectAndTopic(fullText);

			const difficulty =
				estimateDifficulty(
					statement,
					alternatives
				);

			questions.push({
				statement,
				alternatives,
				difficulty,
				subject,
				topic,
				explanation: gabaritoLetter
					? `Gabarito identificado automaticamente: ${gabaritoLetter}`
					: 'Gabarito não encontrado.'
			});
		} catch (err) {
			console.error(
				'Erro ao processar bloco:',
				err
			);
		}
	}

	console.log(
		'[Parser] Questões extraídas:',
		questions.length
	);

	return questions;
}

// ---------------------------------------------------------------------------
// Serviço público exportado
// ---------------------------------------------------------------------------

export const gemini = {
	/**
	 * Extrai questões do texto do PDF.
	 * Usa o parser heurístico local por padrão (offline, sem custo).
	 * Se uma apiKey for fornecida, usa o Gemini para enriquecer o resultado.
	 */
	async parseQuestionsFromText(text: string, apiKey?: string): Promise<Partial<Question>[]> {
		if (!apiKey) {
			return heuristicParser(text);
		}

		const prompt = `Analise o texto extraído de um PDF de prova e extraia as questões de múltipla escolha.
Retorne SOMENTE JSON válido (sem markdown) com este esquema:
{
  "questions": [
    {
      "statement": "Enunciado completo",
      "alternatives": [{ "text": "Texto", "isCorrect": false }],
      "difficulty": "Fácil",
      "subject": "Disciplina",
      "topic": "Assunto específico",
      "explanation": "Explicação pedagógica de por que a correta está certa."
    }
  ]
}

Texto:
${text}`;

		try {
			const jsonText = await callGemini(prompt, apiKey, true);
			const parsed = JSON.parse(jsonText);
			if (parsed.questions?.length > 0) return parsed.questions;
			return heuristicParser(text);
		} catch {
			return heuristicParser(text);
		}
	},

	/** Alias mantido para compatibilidade */
	fallbackHeuristicParser: heuristicParser,

	// -------------------------------------------------------------------------
	// Tutor (requer apiKey; modo local retorna feedback básico)
	// -------------------------------------------------------------------------

	async askTutorAboutQuestion(
		question: Question,
		chosenAlternativeText: string,
		isCorrect: boolean,
		apiKey?: string
	): Promise<string> {
		if (!apiKey) {
			return `**Tutor StudyMock:**
Você respondeu esta questão como **${isCorrect ? 'CORRETA ✅' : 'INCORRETA ❌'}**.
Sua resposta: *"${chosenAlternativeText}"*

📚 Esta questão pertence a **${question.subject} → ${question.topic}**.
${question.explanation ? `\n**Explicação cadastrada:**\n${question.explanation}` : ''}

_Para explicações detalhadas com IA, configure sua chave do Gemini nas Configurações._`;
		}

		const prompt = `Você é o Tutor StudyMock, especialista em concursos.
Questão respondida:
Disciplina: ${question.subject} | Assunto: ${question.topic} | Dificuldade: ${question.difficulty}
Enunciado: ${question.statement}
Alternativas:
${question.alternatives.map((a, i) => `${['A','B','C','D','E'][i]}) ${a.text}${a.isCorrect ? ' ✓' : ''}`).join('\n')}

Resposta do estudante: "${chosenAlternativeText}" — ${isCorrect ? 'ACERTO' : 'ERRO'}
Explicação padrão: ${question.explanation || 'Não cadastrada.'}

Responda de forma motivadora e didática em Markdown.`;

		try {
			return await callGemini(prompt, apiKey);
		} catch (error: any) {
			return `Erro ao falar com o Tutor de IA: ${error.message}`;
		}
	},

	async getGeneralTutorAdvice(stats: PerformanceStats, userMessage: string, apiKey?: string): Promise<string> {
		const weakSubjects = Object.entries(stats.bySubject)
			.filter(([_, d]) => d.rate < 70)
			.map(([name, d]) => `${name} (${d.rate}% de acerto)`);

		if (!apiKey) {
			return `**Tutor StudyMock:**
Você respondeu **${stats.totalAnswered} questões** com **${stats.accuracyRate}% de precisão**.

${weakSubjects.length > 0
	? `⚠️ Pontos de atenção:\n${weakSubjects.map(s => `- ${s}`).join('\n')}\nRecomendo focar nos flashcards desses temas!`
	: '✅ Suas taxas estão sólidas! Continue praticando simulados.'}

_Para análise personalizada com IA, configure sua chave do Gemini nas Configurações._`;
		}

		const subjectStats = Object.entries(stats.bySubject)
			.map(([name, d]) => `- ${name}: ${d.total} questões, ${d.rate}% de acerto`)
			.join('\n');

		const prompt = `Você é o Tutor StudyMock, mentor para concursos públicos.
Estatísticas: total=${stats.totalAnswered}, acertos=${stats.totalCorrect}, taxa=${stats.accuracyRate}%, tempo médio=${stats.averageTime}s
Por disciplina:\n${subjectStats || 'Nenhuma questão respondida ainda.'}

Mensagem do estudante: "${userMessage}"
Responda com conselhos acionáveis em Markdown.`;

		try {
			return await callGemini(prompt, apiKey);
		} catch (error: any) {
			return `Erro ao obter conselhos do Tutor: ${error.message}`;
		}
	},

	async generateFlashcardsFromNote(noteContent: string, apiKey?: string): Promise<Array<{ front: string; back: string }>> {
		if (!apiKey) {
			return localFlashcardGenerator(noteContent);
		}

		const prompt = `Gere até 5 flashcards pergunta-resposta desta anotação.
Retorne SOMENTE JSON válido:
{ "flashcards": [{ "front": "Pergunta.", "back": "Resposta concisa." }] }

Anotação:
${noteContent}`;

		try {
			const jsonText = await callGemini(prompt, apiKey, true);
			const parsed = JSON.parse(jsonText);
			if (parsed.flashcards?.length > 0) return parsed.flashcards;
			return localFlashcardGenerator(noteContent);
		} catch {
			return localFlashcardGenerator(noteContent);
		}
	}
};

// ---------------------------------------------------------------------------
// Gerador local de flashcards (sem IA)
// ---------------------------------------------------------------------------

function localFlashcardGenerator(note: string): Array<{ front: string; back: string }> {
	const flashcards: Array<{ front: string; back: string }> = [];
	const lines = note.split('\n').map(l => l.trim()).filter(l => l.length > 5);

	for (const line of lines) {
		const defMatch = line.match(/^(.{3,60}?)\s*[:=]\s*(.{5,})$/);
		if (defMatch) {
			flashcards.push({
				front: `O que é ${defMatch[1].trim()}?`,
				back: defMatch[2].trim()
			});
			continue;
		}

		if (line.length > 40 && line.length < 200) {
			flashcards.push({
				front: `Complete: "${line.substring(0, Math.floor(line.length / 2))}..."`,
				back: line
			});
		}

		if (flashcards.length >= 5) break;
	}

	if (flashcards.length === 0) {
		flashcards.push({
			front: 'Resumo da anotação',
			back: note.substring(0, 200).trim() + (note.length > 200 ? '...' : '')
		});
	}

	return flashcards;
}