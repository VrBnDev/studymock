<script lang="ts">
	import { db } from '$lib/services/db';
	import { extractTextFromPDF } from '$lib/services/pdf';
	import { gemini } from '$lib/services/gemini';
	import type { Question, PDFDocument } from '$lib/types';
	import { 
		FileUp, 
		Loader2, 
		CheckCircle, 
		AlertCircle, 
		Trash2, 
		Plus, 
		Sparkles,
		Check,
		Edit3,
		ChevronRight
	} from 'lucide-svelte';

	// Page states
	// 'idle' | 'reading' | 'structuring' | 'reviewing' | 'error'
	let status = $state<'idle' | 'reading' | 'structuring' | 'reviewing' | 'error'>('idle');
	
	let errorMessage = $state('');
	let fileName = $state('');
	let extractedText = $state('');
	let progressCurrent = $state(0);
	let progressTotal = $state(0);

	// Parsed questions being reviewed
	let tempQuestions = $state<Partial<Question>[]>([]);

	let isDragOver = $state(false);
	let fileInputRef = $state<HTMLInputElement | null>(null);

	// Trigger file selection
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			processFile(e.dataTransfer.files[0]);
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			processFile(target.files[0]);
		}
	}

	async function processFile(file: File) {
		if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
			status = 'error';
			errorMessage = 'Apenas arquivos PDF são aceitos para importação.';
			return;
		}

		fileName = file.name;
		status = 'reading';
		progressCurrent = 0;
		progressTotal = 0;
		errorMessage = '';
		extractedText = '';

		try {
			// Step 1: Extract Text from PDF (Client-Side)
			extractedText = await extractTextFromPDF(file, (current, total) => {
				progressCurrent = current;
				progressTotal = total;
			});

			if (!extractedText.trim()) {
				throw new Error('Nenhum texto pôde ser extraído do PDF.');
			}

			// Step 2: Structure Questions using Gemini or Fallback
			status = 'structuring';
			const apiKey = db.getGeminiApiKey();
			
			// Call Gemini parsing
			tempQuestions = await gemini.parseQuestionsFromText(extractedText, apiKey);
			
			// If we got questions, let's review them
			status = 'reviewing';
		} catch (err: any) {
			status = 'error';
			errorMessage = err.message || 'Falha ao processar o arquivo PDF.';
		}
	}

	// Question editor actions
	function removeQuestion(index: number) {
		tempQuestions = tempQuestions.filter((_, idx) => idx !== index);
		if (tempQuestions.length === 0) {
			status = 'idle';
		}
	}

	function addAlternative(qIdx: number) {
		if (!tempQuestions[qIdx].alternatives) {
			tempQuestions[qIdx].alternatives = [];
		}
		
		const id = `new_alt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
		tempQuestions[qIdx].alternatives = [
			...tempQuestions[qIdx].alternatives!,
			{ id, text: `Nova alternativa`, isCorrect: false }
		];
	}

	function removeAlternative(qIdx: number, altIdx: number) {
		tempQuestions[qIdx].alternatives = tempQuestions[qIdx].alternatives!.filter((_, idx) => idx !== altIdx);
	}

	function setCorrectAlternative(qIdx: number, altId: string) {
		tempQuestions[qIdx].alternatives = tempQuestions[qIdx].alternatives!.map(a => ({
			...a,
			isCorrect: a.id === altId
		}));
	}

	// Confirm final import
	function confirmImport() {
		if (tempQuestions.length === 0) return;

		// Add PDF entry to historical list
		const pdfId = `pdf_${Date.now()}`;
		const newPDF: PDFDocument = {
			id: pdfId,
			filename: fileName,
			createdAt: new Date().toISOString(),
			status: 'completed',
			questionsCount: tempQuestions.length
		};
		db.addPDF(newPDF);

		// Format and add questions to the database
		tempQuestions.forEach((q, idx) => {
			const fullQuestion: Question = {
				id: `q_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
				pdfId: pdfId,
				statement: q.statement || 'Enunciado vazio',
				alternatives: q.alternatives || [],
				difficulty: q.difficulty || 'Média',
				subject: q.subject || 'Geral',
				topic: q.topic || 'Importado',
				year: q.year || new Date().getFullYear(),
				source: q.source || 'PDF Importado',
				explanation: q.explanation || '',
				createdAt: new Date().toISOString()
			};
			db.addQuestion(fullQuestion);
		});

		// Reset page and redirect
		status = 'idle';
		tempQuestions = [];
		window.location.href = '/questoes';
	}
</script>

<svelte:head>
	<title>Importar PDF - StudyMock</title>
</svelte:head>

<div class="space-y-8">
	<div>
		<h1 class="text-3xl font-display font-extrabold tracking-tight">Importação de PDFs</h1>
		<p class="text-slate-400 text-sm mt-1">
			Faça upload de provas e simulados. A inteligência artificial irá segmentar, identificar alternativas e cadastrar no seu banco de questões.
		</p>
	</div>

	<!-- Gemini Key Warning Banner -->
	{#if !db.getGeminiApiKey()}
		<div class="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
			<Sparkles class="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
			<div>
				<h4 class="text-sm font-semibold text-indigo-300">Dica: Use sua Chave de API do Gemini</h4>
				<p class="text-xs text-slate-400 mt-1 leading-relaxed">
					Sem a chave de API, utilizaremos expressões regulares locais para dividir o texto. Para uma extração automática perfeita de assuntos, gabaritos e explicações geradas por IA, adicione uma chave gratuita do Gemini nas <a href="/configuracoes" class="text-indigo-400 hover:underline font-semibold">Configurações</a>.
				</p>
			</div>
		</div>
	{/if}

	{#if status === 'idle'}
		<!-- Drag and Drop Dropzone -->
		<div 
			role="button"
			tabindex="0"
			onclick={() => fileInputRef?.click()}
			onkeydown={(e) => e.key === 'Enter' && fileInputRef?.click()}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			class="border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[300px] bg-slate-900/10
			{isDragOver 
				? 'border-indigo-500 bg-indigo-500/5 scale-[0.99] shadow-md shadow-indigo-500/5' 
				: 'border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/20'}"
		>
			<input 
				type="file" 
				accept=".pdf" 
				bind:this={fileInputRef} 
				onchange={handleFileSelect} 
				class="hidden" 
			/>
			
			<div class="h-16 w-16 rounded-2xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10 text-indigo-400 mb-4 animate-pulse-slow">
				<FileUp class="h-8 w-8" />
			</div>
			
			<h3 class="text-lg font-semibold text-slate-200">Arraste e solte o PDF de sua prova</h3>
			<p class="text-slate-500 text-xs mt-1.5 max-w-sm">
				Suporta simulados, apostilas e provas anteriores. Certifique-se de que o PDF contém textos selecionáveis.
			</p>
			
			<button class="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm font-semibold text-slate-200 transition-colors">
				Selecionar Arquivo
			</button>
		</div>
	{/if}

	{#if status === 'reading' || status === 'structuring'}
		<!-- Processing pipeline spinner -->
		<div class="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
			<Loader2 class="h-10 w-10 text-indigo-500 animate-spin mb-4" />
			
			{#if status === 'reading'}
				<h3 class="text-lg font-semibold text-slate-200">Lendo e extraindo PDF...</h3>
				<p class="text-slate-500 text-xs mt-1.5 max-w-xs">
					{progressTotal > 0 ? `Lendo página ${progressCurrent} de ${progressTotal}...` : 'Carregando arquivo e iniciando extração de texto...'}
				</p>
				<!-- Progress bar -->
				{#if progressTotal > 0}
					<div class="w-64 h-1.5 bg-slate-950 rounded-full mt-4 overflow-hidden border border-slate-900">
						<div class="h-full bg-indigo-500 rounded-full transition-all duration-300" style="width: {(progressCurrent/progressTotal)*100}%"></div>
					</div>
				{/if}
			{:else}
				<div class="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-semibold mb-2 animate-bounce">
					<Sparkles class="h-3.5 w-3.5" />
					<span>Mapeando Questões com IA</span>
				</div>
				<h3 class="text-lg font-semibold text-slate-200">Estruturando banco de questões...</h3>
				<p class="text-slate-500 text-xs mt-1.5 max-w-xs">
					A Inteligência Artificial está identificando enunciados, separando as alternativas e selecionando o gabarito. Isso pode levar alguns segundos.
				</p>
			{/if}
		</div>
	{/if}

	{#if status === 'error'}
		<!-- Error state -->
		<div class="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] border-red-500/10">
			<div class="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
				<AlertCircle class="h-6 w-6" />
			</div>
			
			<h3 class="text-lg font-semibold text-slate-200">Falha ao processar PDF</h3>
			<p class="text-red-400/80 text-sm mt-1.5 max-w-md">
				{errorMessage}
			</p>
			
			<div class="flex gap-4 mt-6">
				<button 
					onclick={() => status = 'idle'}
					class="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm font-semibold text-slate-200 transition-colors"
				>
					Tentar Novamente
				</button>
			</div>
		</div>
	{/if}

	{#if status === 'reviewing'}
		<!-- Questions Editor Panel -->
		<div class="space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
				<div>
					<span class="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Pipeline Concluído</span>
					<h3 class="text-lg font-bold text-slate-200 mt-0.5">Detectamos {tempQuestions.length} Questões</h3>
					<p class="text-xs text-slate-500">Revise os textos, disciplinas e configure o gabarito oficial antes de cadastrar no banco.</p>
				</div>
				<div class="flex gap-3">
					<button 
						onclick={() => { status = 'idle'; tempQuestions = []; }}
						class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
					>
						Descartar
					</button>
					<button 
						onclick={confirmImport}
						class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/15"
					>
						Confirmar e Importar Banco
					</button>
				</div>
			</div>

			<!-- List of Parsed Questions -->
			<div class="space-y-8">
				{#each tempQuestions as q, qIdx}
					<div class="glass-panel rounded-3xl p-6 relative border-slate-800/80 hover:border-slate-700/60 transition-all">
						
						<!-- Header index & Delete button -->
						<div class="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
							<span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Questão #{qIdx + 1}</span>
							<button 
								onclick={() => removeQuestion(qIdx)} 
								class="text-red-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
								title="Descartar Questão"
							>
								<Trash2 class="h-4.5 w-4.5" />
							</button>
						</div>

						<!-- Core inputs grid -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
							<div class="flex flex-col">
								<label for="subject-{qIdx}" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Disciplina</label>
								<input 
									type="text" 
									id="subject-{qIdx}"
									bind:value={q.subject} 
									class="bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none" 
								/>
							</div>
							<div class="flex flex-col">
								<label for="topic-{qIdx}" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Assunto</label>
								<input 
									type="text" 
									id="topic-{qIdx}"
									bind:value={q.topic} 
									class="bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none" 
								/>
							</div>
							<div class="flex flex-col">
								<label for="difficulty-{qIdx}" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Dificuldade</label>
								<select 
									id="difficulty-{qIdx}"
									bind:value={q.difficulty} 
									class="bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
								>
									<option value="Fácil">Fácil</option>
									<option value="Média">Média</option>
									<option value="Difícil">Difícil</option>
								</select>
							</div>
						</div>

						<!-- Statement Editor -->
						<div class="flex flex-col mb-4">
							<label for="statement-{qIdx}" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Enunciado</label>
							<textarea 
								id="statement-{qIdx}"
								bind:value={q.statement} 
								rows="3" 
								class="bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none resize-y leading-relaxed"
							></textarea>
						</div>

						<!-- Alternatives Editor -->
						<div class="space-y-2 mb-4">
							<span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Alternativas (Selecione a correta)</span>
							{#if q.alternatives}
								{#each q.alternatives as alt, altIdx}
									<div class="flex items-center gap-3">
										<button 
											onclick={() => setCorrectAlternative(qIdx, alt.id)}
											class="h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all
											{alt.isCorrect 
												? 'bg-indigo-600 border-indigo-500 text-white' 
												: 'border-slate-800 hover:border-slate-700 bg-slate-950 text-transparent'}"
										>
											<Check class="h-3 w-3" />
										</button>
										
										<input 
											type="text" 
											bind:value={alt.text} 
											class="flex-1 bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none
											{alt.isCorrect ? 'border-indigo-900/40 bg-indigo-950/5' : ''}" 
										/>
										
										<button 
											onclick={() => removeAlternative(qIdx, altIdx)} 
											class="text-slate-600 hover:text-red-500 transition-colors p-1"
											title="Excluir alternativa"
										>
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								{/each}
							{/if}
							
							<button 
								onclick={() => addAlternative(qIdx)}
								class="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold pt-1 transition-all"
							>
								<Plus class="h-3.5 w-3.5" />
								<span>Adicionar Alternativa</span>
							</button>
						</div>

						<!-- Explanation Editor -->
						<div class="flex flex-col">
							<label for="explanation-{qIdx}" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Explicação / Resolução</label>
							<textarea 
								id="explanation-{qIdx}"
								bind:value={q.explanation} 
								rows="2" 
								placeholder="Explicação pedagógica de por que o gabarito está correto..."
								class="bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-400 focus:text-slate-200 outline-none resize-y leading-relaxed"
							></textarea>
						</div>

					</div>
				{/each}
			</div>

			<!-- Floating Confirm Actions -->
			<div class="flex items-center justify-end gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900 mt-6">
				<button 
					onclick={() => { status = 'idle'; tempQuestions = []; }}
					class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
				>
					Descartar Tudo
				</button>
				<button 
					onclick={confirmImport}
					class="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/15"
				>
					Confirmar e Importar {tempQuestions.length} Questões
				</button>
			</div>
		</div>
	{/if}
</div>
