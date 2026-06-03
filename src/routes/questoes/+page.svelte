<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/services/db';
	import type { Question, StudyNote, Alternative } from '$lib/types';
	import { 
		Search, 
		Plus, 
		ChevronDown, 
		ChevronUp, 
		BookOpen, 
		Edit3, 
		Trash2, 
		CheckCircle2, 
		HelpCircle,
		Sparkles,
		FileText,
		Save,
		Layers
	} from 'lucide-svelte';

	let questions = $state<Question[]>([]);
	let notes = $state<StudyNote[]>([]);

	// Filters state
	let searchWord = $state('');
	let selectedSubject = $state('');
	let selectedDifficulty = $state('');

	// UI states
	let expandedQuestionId = $state<string | null>(null);
	let isCreateManualOpen = $state(false);

	// Manual creation form state
	let newSubject = $state('Redes de Computadores');
	let newTopic = $state('');
	let newDifficulty = $state<'Fácil' | 'Média' | 'Difícil'>('Fácil');
	let newStatement = $state('');
	let newAlternatives = $state<string[]>(['', '', '', '']);
	let correctAltIdx = $state(0);
	let newExplanation = $state('');

	// Active question note editor state
	let activeNoteContent = $state('');

	onMount(() => {
		loadData();
	});

	function loadData() {
		questions = db.getQuestions();
		notes = db.getNotes();
	}

	// Filtered questions
	const filteredQuestions = $derived.by(() => {
		return questions.filter(q => {
			const matchesSearch = searchWord.trim() === '' || 
				q.statement.toLowerCase().includes(searchWord.toLowerCase()) ||
				q.topic.toLowerCase().includes(searchWord.toLowerCase()) ||
				(q.source && q.source.toLowerCase().includes(searchWord.toLowerCase()));
			
			const matchesSubject = selectedSubject === '' || q.subject === selectedSubject;
			const matchesDifficulty = selectedDifficulty === '' || q.difficulty === selectedDifficulty;

			return matchesSearch && matchesSubject && matchesDifficulty;
		});
	});

	// Get dynamic lists for filters
	const subjects = $derived([...new Set(questions.map(q => q.subject))]);

	// Toggle card expand
	function toggleExpand(id: string) {
		if (expandedQuestionId === id) {
			expandedQuestionId = null;
			activeNoteContent = '';
		} else {
			expandedQuestionId = id;
			// Load current note if exists
			const currentNote = notes.find(n => n.questionId === id);
			activeNoteContent = currentNote ? currentNote.content : '';
		}
	}

	// Save note linked to question
	function saveQuestionNote(qId: string) {
		const existingNote = notes.find(n => n.questionId === qId);
		const note: StudyNote = {
			id: existingNote ? existingNote.id : `note_${Date.now()}`,
			questionId: qId,
			title: `Anotação da Questão`,
			content: activeNoteContent,
			createdAt: new Date().toISOString()
		};
		db.saveNote(note);
		loadData();
		alert('Anotação salva com sucesso!');
	}

	// Create Flashcard from question
	function createFlashcardFromQuestion(q: Question) {
		const correctAlt = q.alternatives.find(a => a.isCorrect);
		const card = {
			id: `card_from_q_${Date.now()}`,
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
		alert('Flashcard criado com sucesso! Ele estará disponível na tela de Flashcards.');
	}

	// Delete question
	function deleteQuestion(id: string) {
		if (confirm('Tem certeza que deseja excluir esta questão permanentemente?')) {
			const filtered = questions.filter(q => q.id !== id);
			db.saveQuestions(filtered);
			loadData();
		}
	}

	// Register manual question
	function handleCreateManual(e: Event) {
		e.preventDefault();

		if (!newStatement.trim() || newAlternatives.some(alt => !alt.trim())) {
			alert('Por favor, preencha o enunciado e todas as alternativas.');
			return;
		}

		const alts: Alternative[] = newAlternatives.map((text, idx) => ({
			id: `alt_${Date.now()}_${idx}`,
			text,
			isCorrect: idx === correctAltIdx
		}));

		const manualQuestion: Question = {
			id: `q_manual_${Date.now()}`,
			statement: newStatement,
			alternatives: alts,
			difficulty: newDifficulty,
			subject: newSubject,
			topic: newTopic || 'Geral',
			year: new Date().getFullYear(),
			source: 'Cadastro Manual',
			explanation: newExplanation,
			createdAt: new Date().toISOString()
		};

		db.addQuestion(manualQuestion);
		loadData();

		// Reset form
		newStatement = '';
		newTopic = '';
		newAlternatives = ['', '', '', ''];
		correctAltIdx = 0;
		newExplanation = '';
		isCreateManualOpen = false;
	}
</script>

<svelte:head>
	<title>Banco de Questões - StudyMock</title>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-display font-extrabold tracking-tight">Banco de Questões</h1>
			<p class="text-slate-400 text-sm mt-1">
				Consulte, edite ou insira manualmente questões no seu banco de dados local.
			</p>
		</div>

		<button 
			onclick={() => isCreateManualOpen = !isCreateManualOpen}
			class="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/15"
		>
			<Plus class="h-4.5 w-4.5" />
			<span>Cadastrar Questão</span>
		</button>
	</div>

	<!-- MANUAL REGISTER ACCORDION -->
	{#if isCreateManualOpen}
		<div class="glass-panel rounded-3xl p-6 border-indigo-500/20 bg-slate-900/30">
			<h3 class="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
				<FileText class="h-5 w-5 text-indigo-400" />
				<span>Cadastrar Nova Questão</span>
			</h3>
			
			<form onsubmit={handleCreateManual} class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="flex flex-col">
						<label for="manual-subject" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Disciplina</label>
						<input 
							type="text" 
							id="manual-subject"
							bind:value={newSubject} 
							placeholder="Ex: Redes de Computadores" 
							class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors" 
						/>
					</div>
					<div class="flex flex-col">
						<label for="manual-topic" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Assunto / Subassunto</label>
						<input 
							type="text" 
							id="manual-topic"
							bind:value={newTopic} 
							placeholder="Ex: Protocolos de Transporte" 
							class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors" 
						/>
					</div>
					<div class="flex flex-col">
						<label for="manual-difficulty" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Dificuldade</label>
						<select 
							id="manual-difficulty"
							bind:value={newDifficulty} 
							class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors"
						>
							<option value="Fácil">Fácil</option>
							<option value="Média">Média</option>
							<option value="Difícil">Difícil</option>
						</select>
					</div>
				</div>

				<div class="flex flex-col">
					<label for="manual-statement" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Enunciado da Questão</label>
					<textarea 
						id="manual-statement"
						bind:value={newStatement} 
						rows="4" 
						placeholder="Digite aqui o texto completo da questão..."
						class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none resize-y leading-relaxed"
					></textarea>
				</div>

				<!-- Alternatives List -->
				<div class="space-y-3">
					<span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Alternativas (Marque o círculo da correta)</span>
					{#each newAlternatives as alt, idx}
						<div class="flex items-center gap-3">
							<button 
								type="button"
								onclick={() => correctAltIdx = idx}
								class="h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all
								{correctAltIdx === idx 
									? 'bg-indigo-600 border-indigo-500 text-white' 
									: 'border-slate-800 hover:border-slate-700 bg-slate-950'}"
							>
								{#if correctAltIdx === idx}
									<span class="h-1.5 w-1.5 rounded-full bg-white"></span>
								{/if}
							</button>
							<input 
								type="text" 
								bind:value={newAlternatives[idx]} 
								placeholder="Alternativa {String.fromCharCode(65 + idx)}" 
								class="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-colors" 
							/>
						</div>
					{/each}
				</div>

				<div class="flex flex-col">
					<label for="manual-explanation" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Explicação da Resposta</label>
					<textarea 
						id="manual-explanation"
						bind:value={newExplanation} 
						rows="3" 
						placeholder="Explique detalhadamente por que a alternativa correta é a certa..."
						class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none resize-y leading-relaxed"
					></textarea>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<button 
						type="button" 
						onclick={() => isCreateManualOpen = false} 
						class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 transition-colors"
					>
						Cancelar
					</button>
					<button 
						type="submit" 
						class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
					>
						Salvar Questão
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- FILTER PANEL -->
	<div class="glass-panel rounded-3xl p-5 space-y-4">
		<div class="flex flex-col lg:flex-row gap-4">
			<!-- Text Search -->
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-3 h-4 w-4 text-slate-600" />
				<input 
					type="text" 
					bind:value={searchWord}
					placeholder="Pesquisar por palavras no enunciado ou banca..."
					class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs outline-none transition-colors text-slate-200 placeholder:text-slate-600"
				/>
			</div>

			<!-- Subject select filter -->
			<div class="w-full lg:w-56">
				<select 
					bind:value={selectedSubject}
					class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs outline-none transition-colors text-slate-300"
				>
					<option value="">Todas as Disciplinas</option>
					{#each subjects as sub}
						<option value={sub}>{sub}</option>
					{/each}
				</select>
			</div>

			<!-- Difficulty select filter -->
			<div class="w-full lg:w-44">
				<select 
					bind:value={selectedDifficulty}
					class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs outline-none transition-colors text-slate-300"
				>
					<option value="">Todas Dificuldades</option>
					<option value="Fácil">Fácil</option>
					<option value="Média">Média</option>
					<option value="Difícil">Difícil</option>
				</select>
			</div>
			
			{#if searchWord || selectedSubject || selectedDifficulty}
				<button 
					onclick={() => { searchWord = ''; selectedSubject = ''; selectedDifficulty = ''; }}
					class="px-4 py-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors shrink-0"
				>
					Limpar Filtros
				</button>
			{/if}
		</div>
	</div>

	<!-- QUESTIONS COUNT BANNER -->
	<div class="text-xs text-slate-500 font-medium">
		Exibindo {filteredQuestions.length} de {questions.length} questões cadastradas.
	</div>

	<!-- LIST OF QUESTIONS -->
	<div class="space-y-4">
		{#if filteredQuestions.length > 0}
			{#each filteredQuestions as q (q.id)}
				{@const isExpanded = expandedQuestionId === q.id}
				<div class="glass-panel rounded-3xl overflow-hidden border-slate-900 hover:border-slate-800/80 transition-all duration-200">
					
					<!-- Header Section (Compact View) -->
					<div 
						role="button"
						tabindex="0"
						onclick={() => toggleExpand(q.id)}
						onkeydown={(e) => e.key === 'Enter' && toggleExpand(q.id)}
						class="p-5 flex items-start gap-4 cursor-pointer select-none transition-colors hover:bg-slate-900/10"
					>
						<div class="flex-1 space-y-2.5">
							<!-- Tags row -->
							<div class="flex flex-wrap gap-2">
								<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
									{q.subject}
								</span>
								<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-slate-400 border border-slate-900">
									{q.topic}
								</span>
								<span 
									class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border
									{q.difficulty === 'Fácil' 
										? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' 
										: q.difficulty === 'Média' 
											? 'bg-amber-500/5 text-amber-400 border-amber-500/10' 
											: 'bg-red-500/5 text-red-400 border-red-500/10'}"
								>
									{q.difficulty}
								</span>
								{#if q.source}
									<span class="px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-500">
										{q.source} {q.year ? `(${q.year})` : ''}
									</span>
								{/if}
							</div>
							
							<!-- Statement Snippet -->
							<p class="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal {isExpanded ? '' : 'line-clamp-2'}">
								{q.statement}
							</p>
						</div>

						<div class="text-slate-600 mt-1">
							{#if isExpanded}
								<ChevronUp class="h-5 w-5" />
							{:else}
								<ChevronDown class="h-5 w-5" />
							{/if}
						</div>
					</div>

					<!-- Expanded Area (Options, explanations, notes, action buttons) -->
					{#if isExpanded}
						<div class="border-t border-slate-900 bg-slate-950/20 p-5 space-y-6">
							
							<!-- Alternatives -->
							<div class="space-y-2">
								<h4 class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2.5">Alternativas da Questão</h4>
								{#each q.alternatives as alt}
									<div 
										class="flex items-start gap-3 p-3.5 rounded-2xl border text-xs leading-relaxed
										{alt.isCorrect 
											? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
											: 'bg-slate-950/40 border-slate-900 text-slate-400'}"
									>
										<div class="mt-0.5 shrink-0">
											{#if alt.isCorrect}
												<CheckCircle2 class="h-4.5 w-4.5 text-emerald-500" />
											{:else}
												<HelpCircle class="h-4.5 w-4.5 text-slate-700" />
											{/if}
										</div>
										<span class={alt.isCorrect ? 'font-medium' : ''}>{alt.text}</span>
									</div>
								{/each}
							</div>

							<!-- Explanation / Solution -->
							{#if q.explanation}
								<div class="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-1.5">
									<h4 class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
										<Sparkles class="h-3.5 w-3.5" />
										<span>Gabarito Comentado</span>
									</h4>
									<p class="text-xs text-slate-300 leading-relaxed">
										{q.explanation}
									</p>
								</div>
							{/if}

							<!-- Connected Study Note -->
							<div class="space-y-2">
								<label for="active-note" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
									<Edit3 class="h-3.5 w-3.5" />
									<span>Anotações Vinculadas a esta questão</span>
								</label>
								<div class="flex gap-2">
									<textarea 
										id="active-note"
										bind:value={activeNoteContent} 
										rows="2" 
										placeholder="Escreva notas importantes, fórmulas ou observações de erros para revisar depois..."
										class="flex-1 bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 outline-none resize-y leading-relaxed"
									></textarea>
									<button 
										onclick={() => saveQuestionNote(q.id)}
										class="h-10 px-4 rounded-xl border border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/10 text-indigo-400 flex items-center justify-center gap-1.5 transition-colors self-end shrink-0"
										title="Salvar Observação"
									>
										<Save class="h-4 w-4" />
										<span class="text-xs font-semibold">Salvar</span>
									</button>
								</div>
							</div>

							<!-- Bottom Action Toolbar -->
							<div class="flex justify-between items-center pt-4 border-t border-slate-900">
								<button 
									onclick={() => createFlashcardFromQuestion(q)}
									class="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
								>
									<Layers class="h-3.5 w-3.5" />
									<span>Gerar Flashcard</span>
								</button>
								
								<button 
									onclick={() => deleteQuestion(q.id)}
									class="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 font-semibold transition-colors"
								>
									<Trash2 class="h-3.5 w-3.5" />
									<span>Excluir Questão</span>
								</button>
							</div>

						</div>
					{/if}
				</div>
			{/each}
		{:else}
			<div class="glass-panel rounded-3xl p-12 text-center text-slate-500 text-sm">
				Nenhuma questão encontrada para os filtros aplicados.
			</div>
		{/if}
	</div>
</div>
