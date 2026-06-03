<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { db } from '$lib/services/db';
	import { gemini } from '$lib/services/gemini';
	import type { Quiz, Question, StudyNote } from '$lib/types';
	import { 
		Clock, 
		CheckCircle2, 
		XCircle, 
		ArrowLeft, 
		ArrowRight, 
		Flag, 
		GraduationCap, 
		Sparkles, 
		Bot, 
		Check,
		Save,
		Layers,
		AlertCircle
	} from 'lucide-svelte';

	// Router params
	const quizId = $page.params.id;

	// Database state
	let quiz = $state<Quiz | null>(null);
	let activeQuestionIdx = $state(0);
	
	// Active exam state
	let selectedAnswers = $state<Record<string, string>>({}); // questionId -> alternativeId
	let flaggedQuestions = $state<Record<string, boolean>>({}); // questionId -> true/false
	let questionNotes = $state<Record<string, string>>({}); // questionId -> noteContent
	
	// Timer state
	let elapsedSeconds = $state(0);
	let timerInterval: any = null;

	// UI states
	let loading = $state(true);
	let activeTab = $state<'exam' | 'results'>('exam');
	let isTutorLoading = $state(false);
	let tutorResponse = $state('');

	onMount(() => {
		loadQuiz();
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
	});

	function loadQuiz() {
		const found = db.getQuizById(quizId);
		if (!found) {
			loading = false;
			return;
		}

		quiz = found;
		selectedAnswers = { ...found.answers };
		
		if (found.status === 'completed') {
			activeTab = 'results';
			elapsedSeconds = found.timeTaken || 0;
		} else {
			activeTab = 'exam';
			// Restore elapsed seconds if saved, otherwise start fresh
			elapsedSeconds = 0;
			startTimer();
			
			// Load notes for quiz questions
			const allNotes = db.getNotes();
			found.questions.forEach(q => {
				const n = allNotes.find(note => note.questionId === q.id);
				if (n) {
					questionNotes[q.id] = n.content;
				}
			});
		}
		
		loading = false;
	}

	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			elapsedSeconds++;
		}, 1000);
	}

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	// Active question helper
	const activeQuestion = $derived.by(() => {
		if (!quiz || quiz.questions.length === 0) return null;
		return quiz.questions[activeQuestionIdx];
	});

	// Select answer
	function handleSelectOption(questionId: string, alternativeId: string) {
		if (quiz?.status === 'completed') return;
		selectedAnswers[questionId] = alternativeId;
	}

	// Flag question for review
	function toggleFlag(questionId: string) {
		flaggedQuestions[questionId] = !flaggedQuestions[questionId];
	}

	// Save question note during exam
	function saveNote(questionId: string) {
		const content = questionNotes[questionId] || '';
		const allNotes = db.getNotes();
		const existingNote = allNotes.find(n => n.questionId === questionId);

		const newNote: StudyNote = {
			id: existingNote ? existingNote.id : `note_${Date.now()}`,
			questionId,
			title: 'Nota do Simulado',
			content,
			createdAt: new Date().toISOString()
		};

		db.saveNote(newNote);
		alert('Anotação de estudos salva!');
	}

	// Submit quiz and calculate results
	function submitQuiz() {
		if (!quiz) return;
		
		const unansweredCount = quiz.questions.filter(q => !selectedAnswers[q.id]).length;
		
		if (unansweredCount > 0) {
			if (!confirm(`Você ainda possui ${unansweredCount} questões sem responder. Deseja finalizar mesmo assim?`)) {
				return;
			}
		} else {
			if (!confirm('Deseja finalizar o simulado e ver seu gabarito?')) {
				return;
			}
		}

		stopTimer();

		// Calculate grade
		let correctCount = 0;
		quiz.questions.forEach(q => {
			const chosenId = selectedAnswers[q.id];
			const correctAlt = q.alternatives.find(a => a.isCorrect);
			if (chosenId && correctAlt && chosenId === correctAlt.id) {
				correctCount++;
			}
		});

		const score = Math.round((correctCount / quiz.questions.length) * 100);

		// Save completed quiz state
		const updatedQuiz: Quiz = {
			...quiz,
			status: 'completed',
			answers: selectedAnswers,
			score,
			timeTaken: elapsedSeconds,
			completedAt: new Date().toISOString()
		};

		db.saveQuiz(updatedQuiz);
		quiz = updatedQuiz;
		activeTab = 'results';
	}

	// Flashcard Creator from completed exam
	function generateFlashcard(q: Question) {
		const correctAlt = q.alternatives.find(a => a.isCorrect);
		const card = {
			id: `card_from_quiz_${Date.now()}`,
			front: `[QUESTÃO] ${q.statement}`,
			back: `Resposta Correta: ${correctAlt ? correctAlt.text : 'N/A'}\n\nExplicação: ${q.explanation || ''}`,
			subject: q.subject,
			difficulty: q.difficulty,
			interval: 0,
			repetition: 0,
			efactor: 2.5,
			nextReview: new Date().toISOString(),
			createdAt: new Date().toISOString()
		};
		db.saveFlashcard(card);
		alert('Flashcard criado com sucesso para este assunto!');
	}

	// Call AI tutor sidebar for question clarification
	async function consultTutorOnQuestion(q: Question) {
		tutorResponse = '';
		isTutorLoading = true;
		
		// Find active sidebar container from layout to slide open
		// Usually we can just write directly in a local popup, or prompt layout.
		// For a premium feel, let's open a local overlay inside this page so they see it instantly!
		const chosenId = selectedAnswers[q.id];
		const chosenAlt = q.alternatives.find(a => a.id === chosenId);
		const correctAlt = q.alternatives.find(a => a.isCorrect);
		const isCorrect = chosenId && correctAlt && chosenId === correctAlt.id;
		
		try {
			const apiKey = db.getGeminiApiKey();
			tutorResponse = await gemini.askTutorAboutQuestion(
				q, 
				chosenAlt ? chosenAlt.text : 'Não respondida', 
				!!isCorrect, 
				apiKey
			);
		} catch (err: any) {
			tutorResponse = `Erro ao contactar o tutor: ${err.message}`;
		} finally {
			isTutorLoading = false;
		}
	}

	// Helpers
	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60).toString().padStart(2, '0');
		const s = (seconds % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	}
</script>

<svelte:head>
	<title>{quiz ? quiz.title : 'Simulado'} - StudyMock</title>
</svelte:head>

{#if loading}
	<div class="h-64 flex items-center justify-center">
		<Loader2 class="h-8 w-8 text-indigo-500 animate-spin" />
	</div>
{:else}
	{#if !quiz}
		<div class="glass-panel rounded-3xl p-8 text-center border-red-500/10">
			<AlertCircle class="h-8 w-8 text-red-500 mx-auto mb-3" />
			<h3 class="text-lg font-semibold text-slate-200">Simulado não encontrado</h3>
			<p class="text-xs text-slate-500 mt-1">Este simulado pode ter sido removido ou não existe.</p>
			<a href="/simulados" class="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-indigo-400 hover:underline">
				<ArrowLeft class="h-3.5 w-3.5" />
				<span>Voltar para Simulados</span>
			</a>
		</div>
	{:else}
		<div class="space-y-6">
			
			<!-- TOP TITLE BAR -->
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
				<div class="flex items-center gap-3">
					<a href="/simulados" class="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200">
						<ArrowLeft class="h-4 w-4" />
					</a>
					<div>
						<span class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Simulado</span>
						<h2 class="text-lg font-bold text-slate-200">{quiz.title}</h2>
					</div>
				</div>

				<div class="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-2xl shrink-0">
					<Clock class="h-4.5 w-4.5 text-slate-500" />
					<span class="text-sm font-semibold font-mono text-slate-200">{formatTime(elapsedSeconds)}</span>
				</div>
			</div>

			<!-- EXAM WORKSPACE MODE -->
			{#if activeTab === 'exam'}
				{#if quiz.questions.length === 0}
					<div class="text-center py-12 text-slate-500">Este simulado não possui questões.</div>
				{:else}
					{@const q = activeQuestion}
					{#if q}
						<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
							
							<!-- Main question space -->
							<div class="lg:col-span-2 space-y-6">
								<div class="glass-panel rounded-3xl p-6 space-y-6">
									<!-- Index, Tags & Bookmark -->
									<div class="flex justify-between items-center border-b border-slate-900 pb-3">
										<div class="flex items-center gap-2.5">
											<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
												Questão {activeQuestionIdx + 1} de {quiz.questions.length}
											</span>
											<span class="text-[10px] font-medium text-slate-500">{q.subject} • {q.topic}</span>
										</div>
										
										<button 
											onclick={() => toggleFlag(q.id)}
											class="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-colors
											{flaggedQuestions[q.id] 
												? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
												: 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400'}"
										>
											<Flag class="h-3.5 w-3.5 {flaggedQuestions[q.id] ? 'fill-amber-500/10' : ''}" />
											<span>{flaggedQuestions[q.id] ? 'Marcada' : 'Revisão'}</span>
										</button>
									</div>

									<!-- Question Statement -->
									<p class="text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
										{q.statement}
									</p>

									<!-- Alternatives Selector -->
									<div class="space-y-2">
										{#each q.alternatives as alt}
											{@const isSelected = selectedAnswers[q.id] === alt.id}
											<button 
												onclick={() => handleSelectOption(q.id, alt.id)}
												class="w-full text-left flex items-start gap-3 p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed transition-all
												{isSelected 
													? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300 font-medium' 
													: 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:bg-slate-900/10'}"
											>
												<div class="mt-0.5 shrink-0">
													<div class="h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all
														{isSelected 
															? 'border-indigo-400 text-indigo-400 bg-indigo-950' 
															: 'border-slate-800 bg-slate-950 text-transparent'}"
													>
														{#if isSelected}
															<div class="h-2 w-2 rounded-full bg-indigo-400"></div>
														{/if}
													</div>
												</div>
												<span>{alt.text}</span>
											</button>
										{/each}
									</div>
								</div>

								<!-- Notes Editor for this specific question -->
								<div class="glass-panel rounded-3xl p-5 space-y-3">
									<label for="question-note-{q.id}" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Notas rápidas para esta questão</label>
									<div class="flex gap-3">
										<textarea 
											id="question-note-{q.id}"
											bind:value={questionNotes[q.id]}
											rows="2"
											placeholder="Tome notas sobre por que escolheu esta alternativa, ou regras a lembrar..."
											class="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 outline-none resize-y"
										></textarea>
										<button 
											onclick={() => saveNote(q.id)}
											class="h-10 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 flex items-center justify-center gap-1.5 transition-colors self-end shrink-0"
										>
											<Save class="h-4 w-4" />
											<span class="text-xs font-semibold">Salvar</span>
										</button>
									</div>
								</div>

								<!-- BOTTOM NAV BUTTONS -->
								<div class="flex justify-between items-center">
									<button 
										disabled={activeQuestionIdx === 0}
										onclick={() => activeQuestionIdx--}
										class="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
									>
										<ArrowLeft class="h-4 w-4" />
										<span>Questão Anterior</span>
									</button>

									{#if activeQuestionIdx < quiz.questions.length - 1}
										<button 
											onclick={() => activeQuestionIdx++}
											class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition-all border border-slate-800"
										>
											<span>Próxima Questão</span>
											<ArrowRight class="h-4 w-4" />
										</button>
									{:else}
										<button 
											onclick={submitQuiz}
											class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white transition-all shadow-lg shadow-indigo-600/10"
										>
											<span>Finalizar Simulado</span>
											<Check class="h-4 w-4" />
										</button>
									{/if}
								</div>
							</div>

							<!-- Sidebar Navigation Grid & IA Tutor -->
							<div class="space-y-6">
								
								<!-- Navigation Grid -->
								<div class="glass-panel rounded-3xl p-5 space-y-4">
									<h3 class="text-sm font-semibold text-slate-200">Gabarito de Respostas</h3>
									
									<div class="grid grid-cols-5 gap-2">
										{#each quiz.questions as item, idx}
											{@const isCurrent = activeQuestionIdx === idx}
											{@const isAnswered = !!selectedAnswers[item.id]}
											{@const isFlagged = flaggedQuestions[item.id]}
											<button 
												onclick={() => activeQuestionIdx = idx}
												class="aspect-square rounded-xl border text-xs font-bold transition-all flex items-center justify-center relative
												{isCurrent 
													? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
													: isAnswered 
														? 'bg-slate-900 border-slate-800 text-slate-300' 
														: 'bg-slate-950 border-slate-900 text-slate-500 hover:border-slate-800'}"
											>
												{idx + 1}
												
												{#if isFlagged}
													<div class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500"></div>
												{/if}
											</button>
										{/each}
									</div>

									<div class="pt-2 border-t border-slate-900 space-y-2 text-[10px] text-slate-500 font-medium">
										<div class="flex items-center gap-2">
											<div class="h-2.5 w-2.5 rounded bg-indigo-600 border border-indigo-500"></div>
											<span>Questão Atual</span>
										</div>
										<div class="flex items-center gap-2">
											<div class="h-2.5 w-2.5 rounded bg-slate-900 border border-slate-800"></div>
											<span>Respondida</span>
										</div>
										<div class="flex items-center gap-2">
											<div class="h-2.5 w-2.5 rounded border border-amber-500/30"></div>
											<span>Marcada para Revisão</span>
										</div>
									</div>
								</div>

								<!-- Local Question Tutor Help -->
								<div class="glass-panel rounded-3xl p-5 space-y-4 border-indigo-500/10">
									<div class="flex items-center gap-2">
										<Bot class="h-5 w-5 text-indigo-400" />
										<h3 class="text-sm font-semibold text-slate-200">Dúvida nesta questão?</h3>
									</div>
									<p class="text-xs text-slate-500 leading-relaxed">
										Você pode interagir com o Tutor sobre a questão atual e obter explicações personalizadas.
									</p>
									<button 
										onclick={() => consultTutorOnQuestion(q)}
										disabled={isTutorLoading}
										class="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all disabled:opacity-55"
									>
										<Sparkles class="h-3.5 w-3.5 text-indigo-400" />
										<span>Explicar com IA</span>
									</button>

									<!-- Tutor Response Box -->
									{#if isTutorLoading || tutorResponse}
										<div class="mt-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-900 text-xs leading-relaxed text-slate-300 max-h-56 overflow-y-auto">
											{#if isTutorLoading}
												<div class="flex items-center gap-2 text-slate-500">
													<div class="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></div>
													<span>Gerando resposta do tutor...</span>
												</div>
											{:else}
												<!-- Render simple md format -->
												{#each tutorResponse.split('\n') as p}
													{#if p.trim().length > 0}
														<p class="mb-1.5 last:mb-0">
															{@html p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
														</p>
													{/if}
												{/each}
											{/if}
										</div>
									{/if}
								</div>

							</div>

						</div>
					{/if}
				{/if}

			<!-- RESULTS & REVIEW GABARITO MODE -->
			{:else}
				<div class="space-y-8">
					<!-- Core metrics summary -->
					<div class="glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900/40 via-indigo-950/5 to-slate-900/40 border-slate-800/60">
						<div class="flex items-center gap-5">
							<!-- SVG circular progress -->
							<div class="relative h-24 w-24 shrink-0">
								<svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
									<path
										class="text-slate-900"
										stroke-width="3"
										stroke="currentColor"
										fill="none"
										d="M18 2.0845
											a 15.9155 15.9155 0 0 1 0 31.831
											a 15.9155 15.9155 0 0 1 0 -31.831"
									/>
									<path
										class={quiz.score && quiz.score >= 80 ? 'text-emerald-500' : quiz.score && quiz.score >= 60 ? 'text-amber-500' : 'text-red-500'}
										stroke-width="3"
										stroke-dasharray="{quiz.score || 0}, 100"
										stroke-linecap="round"
										stroke="currentColor"
										fill="none"
										d="M18 2.0845
											a 15.9155 15.9155 0 0 1 0 31.831
											a 15.9155 15.9155 0 0 1 0 -31.831"
									/>
								</svg>
								<div class="absolute inset-0 flex items-center justify-center font-display font-extrabold text-xl text-slate-100">
									{quiz.score || 0}%
								</div>
							</div>

							<div>
								<span class="text-xs text-indigo-400 font-bold uppercase tracking-wider block">Resultado do Simulado</span>
								<h3 class="text-xl font-bold text-slate-200 mt-0.5">
									{#if quiz.score && quiz.score >= 80}
										Excelente! Desempenho acima da média.
									{:else}
										Bom esforço! Revise as explicações abaixo.
									{/if}
								</h3>
								<div class="flex items-center gap-3 text-slate-500 text-xs mt-1">
									<span>Tempo Total: {formatTime(quiz.timeTaken || 0)}</span>
									<span>•</span>
									<span>Data: {quiz.completedAt ? new Date(quiz.completedAt).toLocaleDateString() : ''}</span>
								</div>
							</div>
						</div>

						<a 
							href="/simulados"
							class="px-5 py-3 rounded-2xl border border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-300 transition-all self-stretch md:self-auto text-center"
						>
							Voltar para Simulados
						</a>
					</div>

					<!-- Detailed Question Review gabarito -->
					<div class="space-y-6">
						<h3 class="text-lg font-semibold text-slate-200">Revisão Detalhada das Respostas</h3>
						
						{#each quiz.questions as item, idx (item.id)}
							{@const chosenId = selectedAnswers[item.id]}
							{@const chosenAlt = item.alternatives.find(a => a.id === chosenId)}
							{@const correctAlt = item.alternatives.find(a => a.isCorrect)}
							{@const isCorrect = chosenId && correctAlt && chosenId === correctAlt.id}
							
							<div class="glass-panel rounded-3xl p-6 space-y-4 border-slate-900 relative">
								
								<!-- Question Header -->
								<div class="flex items-center justify-between border-b border-slate-900 pb-3">
									<div class="flex items-center gap-2">
										<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-900 text-slate-400">
											Questão #{idx + 1}
										</span>
										<span class="text-[10px] text-slate-500 font-medium">{item.subject} • {item.topic}</span>
									</div>

									<div 
										class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1
										{isCorrect 
											? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' 
											: 'bg-red-500/5 text-red-400 border border-red-500/10'}"
									>
										{#if isCorrect}
											<CheckCircle2 class="h-3.5 w-3.5" />
											<span>Acertou</span>
										{:else}
											<XCircle class="h-3.5 w-3.5" />
											<span>Errou</span>
										{/if}
									</div>
								</div>

								<!-- Statement -->
								<p class="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
									{item.statement}
								</p>

								<!-- Answers status box -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
									<div class="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-900 text-xs flex flex-col gap-1">
										<span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sua Resposta:</span>
										<span class={isCorrect ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
											{chosenAlt ? chosenAlt.text : 'Não respondida'}
										</span>
									</div>
									
									{#if !isCorrect}
										<div class="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-xs flex flex-col gap-1">
											<span class="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Resposta Correta:</span>
											<span class="text-emerald-400 font-medium">{correctAlt ? correctAlt.text : ''}</span>
										</div>
									{/if}
								</div>

								<!-- Commented Explanation -->
								{#if item.explanation}
									<div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-900 text-xs leading-relaxed text-slate-400 space-y-1">
										<span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Gabarito Comentado</span>
										<p>{item.explanation}</p>
									</div>
								{/if}

								<!-- Local Question Action Panel -->
								<div class="flex items-center justify-between pt-3 border-t border-slate-900">
									<button 
										onclick={() => generateFlashcard(item)}
										class="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
									>
										<Layers class="h-3.5 w-3.5" />
										<span>Criar Flashcard</span>
									</button>
									
									<button 
										onclick={() => consultTutorOnQuestion(item)}
										class="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
									>
										<Bot class="h-3.5 w-3.5" />
										<span>Dúvida? Perguntar à IA</span>
									</button>
								</div>

							</div>
						{/each}
					</div>

					<!-- Tutor Modal popup for reviewing a question -->
					{#if tutorResponse || isTutorLoading}
						<div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
							<div class="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col max-h-[80vh] border-indigo-500/20 shadow-2xl">
								
								<!-- Modal Header -->
								<div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
									<div class="flex items-center gap-2">
										<Bot class="h-5 w-5 text-indigo-400" />
										<h3 class="font-display font-semibold text-slate-200">Ajuda do Tutor de IA</h3>
									</div>
									<button 
										onclick={() => tutorResponse = ''}
										class="text-slate-500 hover:text-slate-200"
									>
										<XCircle class="h-5 w-5" />
									</button>
								</div>

								<!-- Modal Body Chat scroll -->
								<div class="flex-1 overflow-y-auto text-sm leading-relaxed text-slate-300 pr-2 space-y-3">
									{#if isTutorLoading}
										<div class="flex items-center justify-center gap-3 py-12 text-slate-500">
											<div class="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></div>
											<div class="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
											<div class="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
											<span>Obtendo explicações didáticas do Tutor...</span>
										</div>
									{:else}
										{#each tutorResponse.split('\n') as p}
											{#if p.startsWith('- ')}
												<div class="pl-4 -indent-4 my-1">
													• {@html p.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
												</div>
											{:else if p.trim().length > 0}
												<p class="mb-2.5">
													{@html p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
												</p>
											{/if}
										{/each}
									{/if}
								</div>
								
								<!-- Close -->
								<div class="pt-4 border-t border-slate-900 flex justify-end">
									<button 
										onclick={() => tutorResponse = ''}
										class="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-850 transition-colors"
									>
										Fechar Explicação
									</button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

		</div>
	{/if}
{/if}
