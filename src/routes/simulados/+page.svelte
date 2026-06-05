<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/services/db';
	import type { Question, Quiz } from '$lib/types';
	import { 
		GraduationCap, 
		Plus, 
		BookOpen, 
		Clock, 
		CheckCircle, 
		ChevronRight, 
		Play, 
		Trash2,
		Sparkles
	} from 'lucide-svelte';

	let questions = $state<Question[]>([]);
	let quizzes = $state<Quiz[]>([]);

	// Form states
	let selectedSubject = $state('');
	let selectedDifficulty = $state('');
	let questionQuantity = $state(10);
	
	onMount(() => {
		loadData();
	});

	function loadData() {
		questions = db.getQuestions();
		quizzes = db.getQuizzes();
	}

	const subjects = $derived([...new Set(questions.map(q => q.subject))]);
	const completedQuizzes = $derived(quizzes.filter(q => q.status === 'completed'));
	const activeQuizzes = $derived(quizzes.filter(q => q.status === 'in-progress'));

	// Fisher-Yates shuffle algorithm
	function shuffle(array: any[]) {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	// Generate and save quiz
	function generateQuiz() {
		if (questions.length === 0) {
			alert('Seu banco de questões está vazio. Adicione questões manualmente ou importe um PDF antes de iniciar.');
			return;
		}

		// Filter questions
		let pool = questions.filter(q => {
			const matchesSubject = selectedSubject === '' || q.subject === selectedSubject;
			const matchesDifficulty = selectedDifficulty === '' || q.difficulty === selectedDifficulty;
			return matchesSubject && matchesDifficulty;
		});

		if (pool.length === 0) {
			alert('Nenhuma questão encontrada para os filtros selecionados. Tente misturar disciplinas ou dificuldades.');
			return;
		}

		// Shuffle and pick quantity
		const shuffled = shuffle(pool);
		const selectedQuestions = shuffled.slice(0, Math.min(questionQuantity, pool.length));

		const subjectTitle = selectedSubject === '' ? 'Todas as Disciplinas' : selectedSubject;
		const quizId = `quiz_${Date.now()}`;
		
		const newQuiz: Quiz = {
			id: quizId,
			title: `Simulado de ${subjectTitle}`,
			createdAt: new Date().toISOString(),
			questions: selectedQuestions,
			answers: {},
			status: 'in-progress'
		};

		db.saveQuiz(newQuiz);
		
		// Redirect to active quiz
		window.location.href = `/simulados/${quizId}`;
	}

	function deleteQuizHistory(id: string, e: Event) {
		e.stopPropagation();
		if (confirm('Tem certeza que deseja excluir o histórico deste simulado?')) {
			const filtered = quizzes.filter(q => q.id !== id);
			db.saveQuizzes(filtered);
			loadData();
		}
	}

	// Helper to format seconds
	function formatTime(seconds?: number): string {
		if (!seconds) return '00:00';
		const m = Math.floor(seconds / 60).toString().padStart(2, '0');
		const s = (seconds % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	}
</script>

<svelte:head>
	<title>Simulados - StudyMock</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-display font-extrabold tracking-tight">Gerador de Simulados</h1>
		<p class="text-slate-400 text-sm mt-1">
			Gere simulados personalizados do seu banco de questões local ou continue testes pendentes.
		</p>
	</div>

	<!-- SIMULATOR GENERATOR CARD -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		
		<!-- Form Panel -->
		<div class="glass-panel rounded-3xl p-6 lg:col-span-2 space-y-6">
			<h3 class="text-lg font-semibold text-slate-200 flex items-center gap-2">
				<Sparkles class="h-5 w-5 text-indigo-400" />
				<span>Configurar Novo Simulado</span>
			</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Subject filter -->
				<div class="flex flex-col">
					<label for="quiz-subject" class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Disciplina</label>
					<select 
						id="quiz-subject"
						bind:value={selectedSubject}
						class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-xs outline-none transition-colors text-slate-300"
					>
						<option value="">Misturar Tudo (Todas as Disciplinas)</option>
						{#each subjects as sub}
							<option value={sub}>{sub}</option>
						{/each}
					</select>
				</div>

				<!-- Difficulty filter -->
				<div class="flex flex-col">
					<label for="quiz-difficulty" class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Dificuldade</label>
					<select 
						id="quiz-difficulty"
						bind:value={selectedDifficulty}
						class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-xs outline-none transition-colors text-slate-300"
					>
						<option value="">Misturar Dificuldades</option>
						<option value="Fácil">Fácil</option>
						<option value="Média">Média</option>
						<option value="Difícil">Difícil</option>
					</select>
				</div>

				<!-- Quantity Selector -->
				<div class="flex flex-col md:col-span-2">
					<p class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Quantidade de Questões</p>
					<div class="grid grid-cols-5 gap-3">
						{#each [5, 10, 20, 30, 50] as qty}
							<button 
								onclick={() => questionQuantity = qty}
								class="py-2.5 rounded-xl border text-xs font-bold transition-all
								{questionQuantity === qty 
									? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
									: 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'}"
							>
								{qty} Q
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="pt-4 border-t border-slate-900 flex justify-end">
				<button 
					onclick={generateQuiz}
					class="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/15"
				>
					<Play class="h-4 w-4 fill-white" />
					<span>Iniciar Simulado</span>
				</button>
			</div>
		</div>

		<!-- Quick Info Panel -->
		<div class="glass-panel rounded-3xl p-6 flex flex-col justify-between">
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-slate-200">Suas Estatísticas Rápidas</h3>
				<p class="text-xs text-slate-500 leading-relaxed">
					Os simulados utilizam as questões cadastradas no banco. Quanto mais PDFs você importar, maior e mais variada será a sua base de simulados!
				</p>
				
				<div class="space-y-2.5 pt-2">
					<div class="flex justify-between text-xs">
						<span class="text-slate-400">Total de Questões no Banco</span>
						<span class="font-bold text-slate-200">{questions.length}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-slate-400">Simulados Completados</span>
						<span class="font-bold text-slate-200">{completedQuizzes.length}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-slate-400">Simulados em Andamento</span>
						<span class="font-bold text-indigo-400">{activeQuizzes.length}</span>
					</div>
				</div>
			</div>

			<!-- Active Pendings Alert -->
			{#if activeQuizzes.length > 0}
				<div class="mt-6 p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-2">
					<span class="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Teste pendente detectado</span>
					<a 
						href="/simulados/{activeQuizzes[0].id}" 
						class="flex items-center justify-between text-xs font-semibold text-slate-200 bg-indigo-600/10 border border-indigo-500/20 px-3 py-2 rounded-xl hover:bg-indigo-600/20 transition-all group"
					>
						<span>Retomar: {activeQuizzes[0].title}</span>
						<ChevronRight class="h-4 w-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
					</a>
				</div>
			{/if}
		</div>

	</div>

	<!-- SIMULADOS HISTORY -->
	<div class="space-y-4">
		<h3 class="text-lg font-semibold text-slate-200">Histórico de Simulados</h3>
		
		{#if completedQuizzes.length > 0}
			<div class="space-y-3">
				{#each completedQuizzes as quiz (quiz.id)}
					<div 
						role="button"
						tabindex="0"
						onclick={() => window.location.href = `/simulados/${quiz.id}`}
						onkeydown={(e) => e.key === 'Enter' && (window.location.href = `/simulados/${quiz.id}`)}
						class="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-900 hover:border-slate-800/80 cursor-pointer transition-all duration-200 group"
					>
						<div class="flex items-start gap-3">
							<div class="h-10 w-10 rounded-xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
								<GraduationCap class="h-5.5 w-5.5" />
							</div>
							<div>
								<h4 class="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{quiz.title}</h4>
								<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[10px] font-medium uppercase mt-1">
									<span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
									<span>•</span>
									<span class="flex items-center gap-1"><BookOpen class="h-3 w-3" /> {quiz.questions.length} questões</span>
									<span>•</span>
									<span class="flex items-center gap-1"><Clock class="h-3 w-3" /> {formatTime(quiz.timeTaken)}</span>
								</div>
							</div>
						</div>

						<div class="flex items-center gap-4 self-end sm:self-auto">
							<!-- Score percentage badge -->
							<div 
								class="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5
								{quiz.score && quiz.score >= 80 
									? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' 
									: quiz.score && quiz.score >= 60 
										? 'bg-amber-500/5 text-amber-400 border-amber-500/10' 
										: 'bg-red-500/5 text-red-400 border-red-500/10'}"
							>
								<CheckCircle class="h-3.5 w-3.5" />
								<span>{quiz.score || 0}% de acerto</span>
							</div>

							<!-- Action Buttons -->
							<button 
								onclick={(e) => deleteQuizHistory(quiz.id, e)}
								class="text-slate-600 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
								title="Excluir Histórico"
							>
								<Trash2 class="h-4.5 w-4.5" />
							</button>

							<ChevronRight class="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="glass-panel rounded-3xl p-12 text-center text-slate-500 text-sm">
				Nenhum simulado concluído encontrado. Configure os filtros acima e inicie seu primeiro simulado!
			</div>
		{/if}
	</div>
</div>
