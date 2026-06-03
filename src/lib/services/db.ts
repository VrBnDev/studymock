import type { Question, PDFDocument, Quiz, StudyNote, Flashcard, PerformanceStats } from '../types';

// Mock Questions to initialize the DB if empty
const DEFAULT_QUESTIONS: Question[] = [
	{
		id: 'q1',
		statement: 'Qual protocolo da camada de aplicação do modelo TCP/IP utiliza, por padrão, a porta de transporte TCP 443?',
		alternatives: [
			{ id: 'q1_a', text: 'HTTP', isCorrect: false },
			{ id: 'q1_b', text: 'HTTPS', isCorrect: true },
			{ id: 'q1_c', text: 'SSH', isCorrect: false },
			{ id: 'q1_d', text: 'SFTP', isCorrect: false }
		],
		difficulty: 'Fácil',
		subject: 'Redes de Computadores',
		topic: 'Protocolos de Aplicação',
		year: 2025,
		source: 'FCC - TRT 2ª Região',
		explanation: 'O protocolo HTTPS (Hypertext Transfer Protocol Secure) é a versão segura do HTTP, que utiliza criptografia por meio dos protocolos SSL/TLS e, por padrão, opera na porta TCP 443. O HTTP padrão opera na porta 80, o SSH na porta 22 e o SFTP também compartilha a porta 22 por rodar sobre SSH.',
		createdAt: new Date().toISOString()
	},
	{
		id: 'q2',
		statement: 'No contexto de criptografia de chave pública (assimétrica), se Alice deseja enviar uma mensagem confidencial para Bob, com qual chave ela deve cifrar a mensagem?',
		alternatives: [
			{ id: 'q2_a', text: 'Chave pública de Alice', isCorrect: false },
			{ id: 'q2_b', text: 'Chave privada de Alice', isCorrect: false },
			{ id: 'q2_c', text: 'Chave pública de Bob', isCorrect: true },
			{ id: 'q2_d', text: 'Chave privada de Bob', isCorrect: false }
		],
		difficulty: 'Média',
		subject: 'Segurança da Informação',
		topic: 'Criptografia',
		year: 2024,
		source: 'Cesgranrio - Caixa',
		explanation: 'Para garantir a confidencialidade (apenas o destinatário Bob conseguirá ler), Alice cifra a mensagem com a chave pública de Bob. Dessa forma, apenas o dono da chave privada correspondente (o próprio Bob) será capaz de decifrá-la.',
		createdAt: new Date().toISOString()
	},
	{
		id: 'q3',
		statement: 'Qual das propriedades ACID de transações em Banco de Dados garante que uma transação seja executada de forma que seu resultado seja totalmente gravado ou totalmente desfeito?',
		alternatives: [
			{ id: 'q3_a', text: 'Atomicidade', isCorrect: true },
			{ id: 'q3_b', text: 'Consistência', isCorrect: false },
			{ id: 'q3_c', text: 'Isolamento', isCorrect: false },
			{ id: 'q3_d', text: 'Durabilidade', isCorrect: false }
		],
		difficulty: 'Fácil',
		subject: 'Banco de Dados',
		topic: 'Transações (ACID)',
		year: 2024,
		source: 'FGV - TJ-SP',
		explanation: 'A Atomicidade garante que uma transação seja tratada como uma unidade de trabalho atômica (indivisível): ou tudo é executado com sucesso (commit) ou nada é executado (rollback).',
		createdAt: new Date().toISOString()
	},
	{
		id: 'q4',
		statement: 'Qual comando SQL é utilizado para remover a estrutura de uma tabela do banco de dados, incluindo seus dados?',
		alternatives: [
			{ id: 'q4_a', text: 'DELETE TABLE', isCorrect: false },
			{ id: 'q4_b', text: 'DROP TABLE', isCorrect: true },
			{ id: 'q4_c', text: 'TRUNCATE TABLE', isCorrect: false },
			{ id: 'q4_d', text: 'REMOVE TABLE', isCorrect: false }
		],
		difficulty: 'Fácil',
		subject: 'Banco de Dados',
		topic: 'SQL DDL',
		year: 2025,
		source: 'Cebraspe - CNU',
		explanation: 'O comando DROP TABLE é um comando DDL (Data Definition Language) que remove completamente a tabela e sua estrutura física do banco de dados. DELETE e TRUNCATE são comandos DML/utilitários que removem apenas os registros, mantendo a estrutura da tabela intacta.',
		createdAt: new Date().toISOString()
	},
	{
		id: 'q5',
		statement: 'O ataque que consiste em interceptar e possivelmente alterar as comunicações entre duas partes sem que elas percebam é conhecido como:',
		alternatives: [
			{ id: 'q5_a', text: 'Phishing', isCorrect: false },
			{ id: 'q5_b', text: 'DDoS', isCorrect: false },
			{ id: 'q5_c', text: 'Man-in-the-Middle (MitM)', isCorrect: true },
			{ id: 'q5_d', text: 'SQL Injection', isCorrect: false }
		],
		difficulty: 'Fácil',
		subject: 'Segurança da Informação',
		topic: 'Ataques Comuns',
		year: 2024,
		source: 'Vunesp - PM-SP',
		explanation: 'No ataque Man-in-the-Middle (MitM), o atacante intercepta as mensagens trafegadas entre o cliente e o servidor, podendo ler ou modificar as informações em trânsito.',
		createdAt: new Date().toISOString()
	},
	{
		id: 'q6',
		statement: 'Sobre o protocolo de roteamento OSPF (Open Shortest Path First), assinale a alternativa correta.',
		alternatives: [
			{ id: 'q6_a', text: 'É um protocolo baseado no vetor de distância.', isCorrect: false },
			{ id: 'q6_b', text: 'Utiliza o algoritmo de Dijkstra para calcular a rota mais curta.', isCorrect: true },
			{ id: 'q6_c', text: 'Utiliza o número de saltos (hops) como sua métrica principal.', isCorrect: false },
			{ id: 'q6_d', text: 'Opera exclusivamente na camada de transporte.', isCorrect: false }
		],
		difficulty: 'Difícil',
		subject: 'Redes de Computadores',
		topic: 'Roteamento',
		year: 2023,
		source: 'FCC - TRT 18ª Região',
		explanation: 'O OSPF é um protocolo de roteamento do tipo Link-State (estado de enlace) que utiliza o algoritmo Shortest Path First (Dijkstra) para calcular a árvore de caminhos mínimos. A métrica do OSPF é baseada em custo (largura de banda), enquanto o número de saltos é usado pelo protocolo RIP.',
		createdAt: new Date().toISOString()
	},
	{
		id: 'q7',
		statement: 'Qual algoritmo de criptografia simétrica é amplamente adotado como padrão de mercado pelo governo dos EUA e considerado extremamente seguro?',
		alternatives: [
			{ id: 'q7_a', text: 'RSA', isCorrect: false },
			{ id: 'q7_b', text: 'AES (Advanced Encryption Standard)', isCorrect: true },
			{ id: 'q7_c', text: 'DES', isCorrect: false },
			{ id: 'q7_d', text: 'RC4', isCorrect: false }
		],
		difficulty: 'Média',
		subject: 'Segurança da Informação',
		topic: 'Criptografia',
		year: 2024,
		source: 'FGV - MPO',
		explanation: 'O AES é o algoritmo de criptografia simétrica padrão mundial (com chaves de 128, 192 e 256 bits). O RSA é assimétrico. DES está obsoleto devido ao tamanho pequeno da chave de 56 bits. RC4 é vulnerável e não é mais recomendado.',
		createdAt: new Date().toISOString()
	},
	{
		id: 'q8',
		statement: 'Em um banco de dados relacional, uma chave primária composta é definida como:',
		alternatives: [
			{ id: 'q8_a', text: 'Uma chave primária que aponta para outra tabela.', isCorrect: false },
			{ id: 'q8_b', text: 'Uma combinação de duas ou mais colunas que identificam de forma única um registro.', isCorrect: true },
			{ id: 'q8_c', text: 'Uma chave primária criptografada.', isCorrect: false },
			{ id: 'q8_d', text: 'Uma chave primária que aceita valores nulos.', isCorrect: false }
		],
		difficulty: 'Fácil',
		subject: 'Banco de Dados',
		topic: 'Modelagem Relacional',
		year: 2025,
		source: 'Cesgranrio - Transpetro',
		explanation: 'Uma chave primária composta ocorre quando a unicidade de uma linha só pode ser garantida através da combinação dos valores de duas ou mais colunas.',
		createdAt: new Date().toISOString()
	},
	{
		id: 'q9',
		statement: 'Qual a principal diferença entre os protocolos TCP e UDP na camada de transporte?',
		alternatives: [
			{ id: 'q9_a', text: 'O TCP é um protocolo rápido que não garante entrega; o UDP é confiável.', isCorrect: false },
			{ id: 'q9_b', text: 'O TCP é orientado à conexão e garante a entrega ordenada; o UDP é não orientado à conexão e não garante a entrega.', isCorrect: true },
			{ id: 'q9_c', text: 'O UDP utiliza controle de fluxo por janela deslizante, ao contrário do TCP.', isCorrect: false },
			{ id: 'q9_d', text: 'O TCP opera na camada de rede, e o UDP opera na camada de transporte.', isCorrect: false }
		],
		difficulty: 'Fácil',
		subject: 'Redes de Computadores',
		topic: 'Camada de Transporte',
		year: 2024,
		source: 'Quadrix - CRM-PR',
		explanation: 'O TCP (Transmission Control Protocol) é orientado à conexão, realiza controle de fluxo, congestionamento e garante entrega e ordem dos pacotes. O UDP (User Datagram Protocol) é mais simples, rápido, não orientado à conexão e não garante a entrega.',
		createdAt: new Date().toISOString()
	},
	{
		id: 'q10',
		statement: 'Na criptografia assimétrica, o conceito de "Não-repúdio" (ou Irretratabilidade) é alcançado principalmente através do uso de:',
		alternatives: [
			{ id: 'q10_a', text: 'Criptografia simétrica com chave de sessão.', isCorrect: false },
			{ id: 'q10_b', text: 'Assinatura digital criada com a chave privada do remetente.', isCorrect: true },
			{ id: 'q10_c', text: 'Assinatura digital criada com a chave pública do destinatário.', isCorrect: false },
			{ id: 'q10_d', text: 'Códigos hash MD5 em canal cifrado.', isCorrect: false }
		],
		difficulty: 'Média',
		subject: 'Segurança da Informação',
		topic: 'Assinatura Digital',
		year: 2024,
		source: 'Cesgranrio - Ipea',
		explanation: 'O não-repúdio é obtido pela assinatura digital gerada com a chave privada exclusiva do remetente. Como apenas o remetente tem acesso à sua chave privada, ele não pode negar a autoria do documento cuja assinatura pública correspondente decifre com sucesso.',
		createdAt: new Date().toISOString()
	}
];

// Helper to generate quiz history for the dashboard
const generateMockQuizzes = (): Quiz[] => {
	const quizzes: Quiz[] = [];
	const subjects = ['Redes de Computadores', 'Segurança da Informação', 'Banco de Dados'];
	
	// Create 8 past quizzes scattered over the past 30 days
	for (let i = 8; i > 0; i--) {
		const daysAgo = i * 3 + Math.floor(Math.random() * 2);
		const date = new Date();
		date.setDate(date.getDate() - daysAgo);
		
		const quizQuestions = DEFAULT_QUESTIONS.slice(0, 5 + Math.floor(Math.random() * 5));
		const answers: Record<string, string> = {};
		let correctCount = 0;
		
		quizQuestions.forEach(q => {
			const correctAlt = q.alternatives.find(a => a.isCorrect)!;
			const wrongAlts = q.alternatives.filter(a => !a.isCorrect);
			
			// Let's decide if this answer is correct (approx. 70-90% accuracy depending on the test)
			const isCorrect = Math.random() < 0.8;
			if (isCorrect) {
				answers[q.id] = correctAlt.id;
				correctCount++;
			} else {
				answers[q.id] = wrongAlts[Math.floor(Math.random() * wrongAlts.length)].id;
			}
		});
		
		const score = Math.round((correctCount / quizQuestions.length) * 100);
		
		quizzes.push({
			id: `mock_quiz_${i}`,
			title: `Simulado de ${subjects[i % subjects.length]}`,
			createdAt: date.toISOString(),
			questions: quizQuestions,
			answers,
			score,
			timeTaken: quizQuestions.length * 45 + Math.floor(Math.random() * 60), // ~45s per question
			completedAt: date.toISOString(),
			status: 'completed'
		});
	}
	
	return quizzes;
};

const DEFAULT_NOTES: StudyNote[] = [
	{
		id: 'n1',
		title: 'Portas Comuns TCP/UDP',
		content: 'Principais portas para memorizar:\n- 22: SSH e SFTP (TCP)\n- 80: HTTP (TCP)\n- 443: HTTPS (TCP)\n- 53: DNS (UDP/TCP)\n- 25: SMTP (TCP)\n- 110: POP3 (TCP)\n- 143: IMAP (TCP)\n- 3306: MySQL\n- 5432: PostgreSQL',
		createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
	},
	{
		id: 'n2',
		questionId: 'q2',
		title: 'Criptografia Assimétrica: Quem cifra?',
		content: 'Regra de ouro:\n1. Confidencialidade (Segredo) -> Cifrar com a CHAVE PÚBLICA DO DESTINATÁRIO. Apenas ele abre.\n2. Autenticidade / Assinatura (Garantia de autoria) -> Cifrar com a CHAVE PRIVADA DO REMETENTE. Qualquer um lê (usando a pública dele), mas prova que foi ele quem enviou.',
		createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
	}
];

const DEFAULT_FLASHCARDS: Flashcard[] = [
	{
		id: 'fc1',
		front: 'Qual protocolo opera por padrão na porta TCP 443?',
		back: 'HTTPS (Hypertext Transfer Protocol Secure)',
		subject: 'Redes de Computadores',
		difficulty: 'Fácil',
		interval: 4,
		repetition: 2,
		efactor: 2.6,
		nextReview: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
		createdAt: new Date().toISOString()
	},
	{
		id: 'fc2',
		front: 'Para garantir CONFIDENCIALIDADE, qual chave cifrar na criptografia assimétrica?',
		back: 'Chave pública do destinatário.',
		subject: 'Segurança da Informação',
		difficulty: 'Média',
		interval: 1,
		repetition: 1,
		efactor: 2.4,
		nextReview: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // Overdue, needs review
		createdAt: new Date().toISOString()
	},
	{
		id: 'fc3',
		front: 'O que garante a propriedade de ATOMICIDADE no ACID das transações?',
		back: 'Garante que a transação ocorra por inteiro ("tudo ou nada"). Se falhar, tudo é desfeito (rollback).',
		subject: 'Banco de Dados',
		difficulty: 'Fácil',
		interval: 0,
		repetition: 0,
		efactor: 2.5,
		nextReview: new Date().toISOString(), // Due now
		createdAt: new Date().toISOString()
	}
];

// DB keys for localStorage
const KEYS = {
	QUESTIONS: 'studymock_questions',
	PDFS: 'studymock_pdfs',
	QUIZZES: 'studymock_quizzes',
	NOTES: 'studymock_notes',
	FLASHCARDS: 'studymock_flashcards',
	GEMINI_CONFIG: 'studymock_gemini_config'
};

// Initialize localStorage with default data if not present
export const initializeDB = () => {
	if (typeof window === 'undefined') return;
	
	if (!localStorage.getItem(KEYS.QUESTIONS)) {
		localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
	}
	if (!localStorage.getItem(KEYS.QUIZZES)) {
		localStorage.setItem(KEYS.QUIZZES, JSON.stringify(generateMockQuizzes()));
	}
	if (!localStorage.getItem(KEYS.NOTES)) {
		localStorage.setItem(KEYS.NOTES, JSON.stringify(DEFAULT_NOTES));
	}
	if (!localStorage.getItem(KEYS.FLASHCARDS)) {
		localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(DEFAULT_FLASHCARDS));
	}
	if (!localStorage.getItem(KEYS.PDFS)) {
		const initialPDFs: PDFDocument[] = [
			{
				id: 'pdf_ex1',
				filename: 'Simulado_Redes_2025.pdf',
				createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
				status: 'completed',
				questionsCount: 4
			},
			{
				id: 'pdf_ex2',
				filename: 'Prova_Seguranca_Bancas.pdf',
				createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
				status: 'completed',
				questionsCount: 6
			}
		];
		localStorage.setItem(KEYS.PDFS, JSON.stringify(initialPDFs));
	}
};

// Database Operations
export const db = {
	// Questions
	getQuestions(): Question[] {
		initializeDB();
		if (typeof window === 'undefined') return [];
		return JSON.parse(localStorage.getItem(KEYS.QUESTIONS) || '[]');
	},
	
	saveQuestions(questions: Question[]) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(questions));
	},
	
	addQuestion(question: Question) {
		const list = this.getQuestions();
		list.unshift(question);
		this.saveQuestions(list);
		return question;
	},
	
	// PDFs
	getPDFs(): PDFDocument[] {
		initializeDB();
		if (typeof window === 'undefined') return [];
		return JSON.parse(localStorage.getItem(KEYS.PDFS) || '[]');
	},
	
	savePDFs(pdfs: PDFDocument[]) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(KEYS.PDFS, JSON.stringify(pdfs));
	},
	
	addPDF(pdf: PDFDocument) {
		const list = this.getPDFs();
		list.unshift(pdf);
		this.savePDFs(list);
		return pdf;
	},

	updatePDFStatus(id: string, status: PDFDocument['status'], questionsCount = 0) {
		const list = this.getPDFs();
		const idx = list.findIndex(p => p.id === id);
		if (idx !== -1) {
			list[idx].status = status;
			list[idx].questionsCount = questionsCount;
			this.savePDFs(list);
		}
	},
	
	// Quizzes
	getQuizzes(): Quiz[] {
		initializeDB();
		if (typeof window === 'undefined') return [];
		return JSON.parse(localStorage.getItem(KEYS.QUIZZES) || '[]');
	},
	
	saveQuizzes(quizzes: Quiz[]) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(KEYS.QUIZZES, JSON.stringify(quizzes));
	},
	
	saveQuiz(quiz: Quiz) {
		const list = this.getQuizzes();
		const idx = list.findIndex(q => q.id === quiz.id);
		if (idx !== -1) {
			list[idx] = quiz;
		} else {
			list.unshift(quiz);
		}
		this.saveQuizzes(list);
		return quiz;
	},

	getQuizById(id: string): Quiz | undefined {
		return this.getQuizzes().find(q => q.id === id);
	},
	
	// Notes
	getNotes(): StudyNote[] {
		initializeDB();
		if (typeof window === 'undefined') return [];
		return JSON.parse(localStorage.getItem(KEYS.NOTES) || '[]');
	},
	
	saveNotes(notes: StudyNote[]) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
	},
	
	saveNote(note: StudyNote) {
		const list = this.getNotes();
		const idx = list.findIndex(n => n.id === note.id);
		if (idx !== -1) {
			list[idx] = note;
		} else {
			list.unshift(note);
		}
		this.saveNotes(list);
		return note;
	},
	
	deleteNote(id: string) {
		const list = this.getNotes();
		const filtered = list.filter(n => n.id !== id);
		this.saveNotes(filtered);
	},

	getNoteByQuestionId(qId: string): StudyNote | undefined {
		return this.getNotes().find(n => n.questionId === qId);
	},
	
	// Flashcards
	getFlashcards(): Flashcard[] {
		initializeDB();
		if (typeof window === 'undefined') return [];
		return JSON.parse(localStorage.getItem(KEYS.FLASHCARDS) || '[]');
	},
	
	saveFlashcards(flashcards: Flashcard[]) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(flashcards));
	},
	
	saveFlashcard(card: Flashcard) {
		const list = this.getFlashcards();
		const idx = list.findIndex(c => c.id === card.id);
		if (idx !== -1) {
			list[idx] = card;
		} else {
			list.unshift(card);
		}
		this.saveFlashcards(list);
		return card;
	},

	deleteFlashcard(id: string) {
		const list = this.getFlashcards();
		const filtered = list.filter(c => c.id !== id);
		this.saveFlashcards(filtered);
	},

	// Settings & API config
	getGeminiApiKey(): string {
		if (typeof window === 'undefined') return '';
		const configStr = localStorage.getItem(KEYS.GEMINI_CONFIG);
		if (!configStr) return '';
		try {
			const config = JSON.parse(configStr);
			return config.apiKey || '';
		} catch {
			return '';
		}
	},

	saveGeminiApiKey(apiKey: string) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(KEYS.GEMINI_CONFIG, JSON.stringify({ apiKey }));
	},
	
	// Clear all data
	clearAllData() {
		if (typeof window === 'undefined') return;
		localStorage.removeItem(KEYS.QUESTIONS);
		localStorage.removeItem(KEYS.PDFS);
		localStorage.removeItem(KEYS.QUIZZES);
		localStorage.removeItem(KEYS.NOTES);
		localStorage.removeItem(KEYS.FLASHCARDS);
		localStorage.removeItem(KEYS.GEMINI_CONFIG);
		initializeDB();
	},
	
	// Performance statistics calculation
	getStats(): PerformanceStats {
		const quizzes = this.getQuizzes().filter(q => q.status === 'completed');
		
		let totalAnswered = 0;
		let totalCorrect = 0;
		let totalTime = 0;
		
		const bySubject: PerformanceStats['bySubject'] = {};
		const dateMap: Record<string, { total: number; correct: number }> = {};
		
		quizzes.forEach(quiz => {
			totalTime += quiz.timeTaken || 0;
			
			quiz.questions.forEach(q => {
				totalAnswered++;
				const chosenId = quiz.answers[q.id];
				const correctAlt = q.alternatives.find(a => a.isCorrect);
				const isCorrect = chosenId && correctAlt && chosenId === correctAlt.id;
				
				if (isCorrect) {
					totalCorrect++;
				}
				
				// Subject breakdown
				const sub = q.subject || 'Geral';
				if (!bySubject[sub]) {
					bySubject[sub] = { total: 0, correct: 0, rate: 0 };
				}
				bySubject[sub].total++;
				if (isCorrect) {
					bySubject[sub].correct++;
				}
				
				// Date breakdown (by day of quiz)
				if (quiz.completedAt) {
					const dateStr = quiz.completedAt.split('T')[0];
					if (!dateMap[dateStr]) {
						dateMap[dateStr] = { total: 0, correct: 0 };
					}
					dateMap[dateStr].total++;
					if (isCorrect) {
						dateMap[dateStr].correct++;
					}
				}
			});
		});
		
		// Finalize subject rates
		Object.keys(bySubject).forEach(sub => {
			const s = bySubject[sub];
			s.rate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
		});
		
		// Map and sort date stats
		const byDate = Object.keys(dateMap).map(dateStr => {
			const d = dateMap[dateStr];
			return {
				date: dateStr,
				rate: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
				count: d.total
			};
		}).sort((a, b) => a.date.localeCompare(b.date));
		
		const totalIncorrect = totalAnswered - totalCorrect;
		const accuracyRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
		const averageTime = totalAnswered > 0 ? Math.round(totalTime / totalAnswered) : 0;
		
		return {
			totalAnswered,
			totalCorrect,
			totalIncorrect,
			accuracyRate,
			averageTime,
			bySubject,
			byDate
		};
	}
};
