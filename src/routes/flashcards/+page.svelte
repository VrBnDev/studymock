<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/services/db';
	import type { Flashcard } from '$lib/types';
	import { 
		Layers, 
		Plus, 
		Check, 
		RotateCw, 
		ChevronRight, 
		BookOpen, 
		Calendar, 
		Clock, 
		Award,
		Trash2,
		X
	} from 'lucide-svelte';

	let flashcards = $state<Flashcard[]>([]);
	
	// UI States
	let isCreateOpen = $state(false);
	let activeDeckSubject = $state<string | null>(null);
	let currentQueueIdx = $state(0);
	let isFlipped = $state(false);

	// Creator form state
	let newFront = $state('');
	let newBack = $state('');
	let newSubject = $state('Redes de Computadores');
	let newDifficulty = $state('Média');

	onMount(() => {
		loadCards();
	});

	function loadCards() {
		flashcards = db.getFlashcards();
	}

	// Decks calculation
	const decks = $derived.by(() => {
		const groups: Record<string, { total: number; due: number }> = {};
		const now = new Date();

		flashcards.forEach(card => {
			const sub = card.subject || 'Outros';
			if (!groups[sub]) {
				groups[sub] = { total: 0, due: 0 };
			}
			groups[sub].total++;
			if (new Date(card.nextReview) <= now) {
				groups[sub].due++;
			}
		});

		return Object.entries(groups).map(([subject, counts]) => ({
			subject,
			...counts
		}));
	});

	// Active study queue
	const studyQueue = $derived.by(() => {
		if (!activeDeckSubject) return [];
		const now = new Date();
		
		return flashcards.filter(card => {
			const matchesSubject = card.subject === activeDeckSubject;
			const isDue = new Date(card.nextReview) <= now;
			return matchesSubject && isDue;
		});
	});

	const activeCard = $derived.by(() => {
		if (studyQueue.length === 0 || currentQueueIdx >= studyQueue.length) return null;
		return studyQueue[currentQueueIdx];
	});

	// SuperMemo-2 (SM-2) algorithm execution
	function rateCard(grade: number) {
		const card = activeCard;
		if (!card) return;

		let repetition = card.repetition;
		let interval = card.interval;
		let efactor = card.efactor;

		// Correct Response
		if (grade >= 3) {
			if (repetition === 0) {
				interval = 1; // 1 day
			} else if (repetition === 1) {
				interval = 3; // 3 days
			} else {
				interval = Math.round(interval * efactor);
			}
			repetition++;
		} else {
			// Incorrect Response (Grade < 3)
			repetition = 0;
			interval = 1; // review tomorrow
		}

		// Calculate new E-factor (min 1.3)
		efactor = efactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
		if (efactor < 1.3) efactor = 1.3;

		const nextReviewDate = new Date();
		nextReviewDate.setDate(nextReviewDate.getDate() + interval);

		const updatedCard: Flashcard = {
			...card,
			repetition,
			interval,
			efactor,
			nextReview: nextReviewDate.toISOString()
		};

		db.saveFlashcard(updatedCard);
		
		// Move to next card after brief timeout for visual flip reset
		isFlipped = false;
		setTimeout(() => {
			currentQueueIdx++;
			loadCards();
		}, 300);
	}

	// Create new card manually
	function handleCreateCard(e: Event) {
		e.preventDefault();
		if (!newFront.trim() || !newBack.trim()) {
			alert('Por favor, preencha frente e verso do flashcard.');
			return;
		}

		const newCard: Flashcard = {
			id: `card_manual_${Date.now()}`,
			front: newFront,
			back: newBack,
			subject: newSubject,
			difficulty: newDifficulty,
			interval: 0,
			repetition: 0,
			efactor: 2.5,
			nextReview: new Date().toISOString(), // due immediately
			createdAt: new Date().toISOString()
		};

		db.saveFlashcard(newCard);
		loadCards();

		// reset
		newFront = '';
		newBack = '';
		isCreateOpen = false;
	}

	function deleteCard(id: string, e: Event) {
		e.stopPropagation();
		if (confirm('Deseja excluir este flashcard permanentemente?')) {
			db.deleteFlashcard(id);
			loadCards();
		}
	}

	// Exit study deck workspace
	function exitStudy() {
		activeDeckSubject = null;
		currentQueueIdx = 0;
		isFlipped = false;
		loadCards();
	}
</script>

<svelte:head>
	<title>Flashcards - StudyMock</title>
</svelte:head>

<div class="space-y-8">
	
	<!-- DECK SELECT VIEW -->
	{#if !activeDeckSubject}
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<h1 class="text-3xl font-display font-extrabold tracking-tight">Decks de Memorização</h1>
				<p class="text-slate-400 text-sm mt-1">
					Estude por repetição espaçada. O algoritmo de agendamento mostrará as cartas que você mais errou no tempo ideal.
				</p>
			</div>

			<button 
				onclick={() => isCreateOpen = !isCreateOpen}
				class="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/15"
			>
				<Plus class="h-4.5 w-4.5" />
				<span>Criar Flashcard</span>
			</button>
		</div>

		<!-- MANUAL FLASHCARD CREATOR -->
		{#if isCreateOpen}
			<div class="glass-panel rounded-3xl p-6 border-indigo-500/20 bg-slate-900/30">
				<h3 class="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
					<Layers class="h-5 w-5 text-indigo-400" />
					<span>Criar Novo Flashcard</span>
				</h3>
				
				<form onsubmit={handleCreateCard} class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="flex flex-col">
							<label for="fc-subject" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Disciplina</label>
							<input 
								type="text" 
								id="fc-subject"
								bind:value={newSubject} 
								placeholder="Ex: Redes de Computadores" 
								class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-colors" 
							/>
						</div>
						<div class="flex flex-col">
							<label for="fc-difficulty" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Dificuldade</label>
							<select 
								id="fc-difficulty"
								bind:value={newDifficulty} 
								class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-colors"
							>
								<option value="Fácil">Fácil</option>
								<option value="Média">Média</option>
								<option value="Difícil">Difícil</option>
							</select>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="flex flex-col">
							<label for="fc-front" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Frente (Pergunta ou Termo)</label>
							<textarea 
								id="fc-front"
								bind:value={newFront} 
								rows="3" 
								placeholder="Pergunta objetiva ou conceito para testar..."
								class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none resize-y leading-relaxed"
							></textarea>
						</div>
						<div class="flex flex-col">
							<label for="fc-back" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Verso (Resposta ou Conceito)</label>
							<textarea 
								id="fc-back"
								bind:value={newBack} 
								rows="3" 
								placeholder="Resposta resumida ou fórmula..."
								class="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none resize-y leading-relaxed"
							></textarea>
						</div>
					</div>

					<div class="flex justify-end gap-3 pt-2">
						<button 
							type="button" 
							onclick={() => isCreateOpen = false} 
							class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 transition-colors"
						>
							Cancelar
						</button>
						<button 
							type="submit" 
							class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
						>
							Criar Cartão
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- DECKS LIST -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#if decks.length > 0}
				{#each decks as deck}
					<div class="glass-panel rounded-3xl p-6 flex flex-col justify-between border-slate-900 glow-indigo transition-all">
						<div class="space-y-3">
							<div class="h-10 w-10 rounded-xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10 text-indigo-400">
								<Layers class="h-5.5 w-5.5" />
							</div>
							<div>
								<h3 class="text-base font-bold text-slate-200 leading-tight">{deck.subject}</h3>
								<p class="text-xs text-slate-500 mt-1">{deck.total} {deck.total === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}</p>
							</div>
						</div>

						<div class="flex items-center justify-between pt-6 mt-6 border-t border-slate-900/60">
							<!-- Badges for reviews status -->
							<div class="flex items-center gap-1.5">
								<span 
									class="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
									{deck.due > 0 ? 'bg-indigo-600/15 text-indigo-300' : 'bg-slate-950 text-slate-500'}"
								>
									{deck.due} pendentes
								</span>
							</div>

							<button 
								onclick={() => { activeDeckSubject = deck.subject; currentQueueIdx = 0; }}
								class="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
							>
								<span>Estudar</span>
								<ChevronRight class="h-4 w-4" />
							</button>
						</div>
					</div>
				{/each}
			{:else}
				<div class="glass-panel rounded-3xl p-12 text-center text-slate-500 text-sm md:col-span-3">
					Nenhum deck de memorização criado. Adicione um flashcard acima ou a partir do Gabarito do Simulado!
				</div>
			{/if}
		</div>

		<!-- DETAILED CARDS INVENTORY -->
		{#if flashcards.length > 0}
			<div class="space-y-4 pt-4">
				<h3 class="text-lg font-semibold text-slate-200">Seus Cartões Cadastrados</h3>
				
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#each flashcards as card (card.id)}
						<div class="glass-panel rounded-2xl p-4 flex justify-between gap-4 border-slate-900/60 text-xs">
							<div class="flex-1 space-y-1.5 min-w-0">
								<div class="flex items-center gap-2">
									<span class="px-2 py-0.5 rounded bg-indigo-500/10 text-[9px] font-bold text-indigo-300 uppercase tracking-wider">{card.subject}</span>
									<span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Intervalo: {card.interval}d</span>
								</div>
								<h4 class="font-semibold text-slate-200 truncate">{card.front}</h4>
								<p class="text-slate-400 truncate">{card.back}</p>
							</div>
							<button 
								onclick={(e) => deleteCard(card.id, e)}
								class="text-slate-600 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 self-center shrink-0 transition-colors"
								title="Excluir Flashcard"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

	<!-- ACTIVE REVIEW MODE WORKSPACE -->
	{:else}
		<div class="max-w-xl mx-auto space-y-6">
			
			<!-- Workspace Header -->
			<div class="flex justify-between items-center border-b border-slate-900 pb-3">
				<div>
					<span class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Estudando Deck</span>
					<h3 class="text-base font-bold text-slate-200">{activeDeckSubject}</h3>
				</div>
				<button 
					onclick={exitStudy}
					class="px-3.5 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
				>
					Sair do Deck
				</button>
			</div>

			<!-- Check if queue is completed -->
			{#if studyQueue.length === 0}
				<div class="glass-panel rounded-3xl p-8 text-center border-emerald-500/10 space-y-4">
					<div class="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
						<Award class="h-8 w-8" />
					</div>
					<div class="space-y-1">
						<h3 class="text-lg font-bold text-slate-200">Deck Concluído!</h3>
						<p class="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
							Parabéns! Você concluiu todos os cartões agendados para hoje nesta disciplina. Volte mais tarde para novas revisões!
						</p>
					</div>
					<button 
						onclick={exitStudy}
						class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
					>
						Voltar aos Decks
					</button>
				</div>
			{:else if currentQueueIdx >= studyQueue.length}
				<div class="glass-panel rounded-3xl p-8 text-center border-emerald-500/10 space-y-4">
					<div class="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
						<Check class="h-8 w-8" />
					</div>
					<div class="space-y-1">
						<h3 class="text-lg font-bold text-slate-200">Sessão Concluída!</h3>
						<p class="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
							Você finalizou a fila de estudos atual. Os cartões que você classificou foram reagendados no banco de dados.
						</p>
					</div>
					<button 
						onclick={exitStudy}
						class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
					>
						Voltar aos Decks
					</button>
				</div>
			{:else if activeCard}
				<!-- Progress tracker bar -->
				<div class="flex items-center justify-between text-xs text-slate-500 font-medium">
					<span>Progresso da Sessão</span>
					<span>Cartão {currentQueueIdx + 1} de {studyQueue.length}</span>
				</div>
				<div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-900">
					<div class="h-full bg-indigo-500 rounded-full transition-all duration-300" style="width: {((currentQueueIdx + 1)/studyQueue.length)*100}%"></div>
				</div>

				<!-- 3D FLIP CARD CONTAINER -->
				<div 
					role="button"
					tabindex="0"
					onclick={() => isFlipped = !isFlipped}
					onkeydown={(e) => e.key === 'Enter' && (isFlipped = !isFlipped)}
					class="flip-card w-full h-80 cursor-pointer select-none {isFlipped ? 'flipped' : ''}"
				>
					<div class="flip-card-inner">
						
						<!-- FRONT SIDE (Question) -->
						<div class="flip-card-front glass-panel rounded-3xl p-8 flex flex-col justify-between items-center text-center border-slate-800/80 hover:border-slate-700/60 bg-slate-900/20">
							<div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Frente do Cartão</div>
							
							<div class="text-sm sm:text-base text-slate-100 font-medium leading-relaxed max-w-sm">
								{activeCard.front}
							</div>
							
							<div class="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold animate-pulse">
								<RotateCw class="h-3.5 w-3.5" />
								<span>Clique para ver a resposta</span>
							</div>
						</div>

						<!-- BACK SIDE (Answer) -->
						<div class="flip-card-back glass-panel rounded-3xl p-8 flex flex-col justify-between items-center text-center border-indigo-500/25 bg-slate-900/40">
							<div class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Verso do Cartão</div>
							
							<div class="text-sm sm:text-base text-emerald-400 font-bold leading-relaxed max-w-sm overflow-y-auto max-h-40">
								<!-- Render newline text -->
								{#each activeCard.back.split('\n') as line}
									{#if line.trim().length > 0}
										<p class="mb-1 last:mb-0">{line}</p>
									{/if}
								{/each}
							</div>
							
							<div class="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
								<RotateCw class="h-3.5 w-3.5 text-slate-600" />
								<span>Clique para voltar à frente</span>
							</div>
						</div>

					</div>
				</div>

				<!-- RATING BUTTONS (Schedules review SM-2) -->
				{#if isFlipped}
					<div class="space-y-3 pt-2">
						<span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-center">Classifique seu nível de recordação</span>
						<div class="grid grid-cols-4 gap-2.5">
							
							<button 
								onclick={() => rateCard(1)}
								class="flex flex-col items-center justify-center p-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 active:scale-95 transition-all text-center"
							>
								<span class="text-xs font-bold font-display">Errei</span>
								<span class="text-[9px] text-red-500/70 font-semibold mt-0.5">Retorna amanhã</span>
							</button>

							<button 
								onclick={() => rateCard(3)}
								class="flex flex-col items-center justify-center p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 active:scale-95 transition-all text-center"
							>
								<span class="text-xs font-bold font-display">Difícil</span>
								<span class="text-[9px] text-amber-500/70 font-semibold mt-0.5">Em 3 dias</span>
							</button>

							<button 
								onclick={() => rateCard(4)}
								class="flex flex-col items-center justify-center p-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 hover:bg-indigo-500/10 active:scale-95 transition-all text-center"
							>
								<span class="text-xs font-bold font-display">Bom</span>
								<span class="text-[9px] text-indigo-400/70 font-semibold mt-0.5">Em 7 dias</span>
							</button>

							<button 
								onclick={() => rateCard(5)}
								class="flex flex-col items-center justify-center p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-all text-center"
							>
								<span class="text-xs font-bold font-display">Fácil</span>
								<span class="text-[9px] text-emerald-500/70 font-semibold mt-0.5">Em 14 dias</span>
							</button>

						</div>
					</div>
				{:else}
					<div class="h-20 flex items-center justify-center text-xs text-slate-500 italic">
						Revele a resposta do cartão acima para classificar sua repetição espaçada.
					</div>
				{/if}
			{/if}

		</div>
	{/if}
</div>
