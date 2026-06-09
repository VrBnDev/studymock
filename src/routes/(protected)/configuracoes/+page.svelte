<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/services/db';
	import { 
		Settings, 
		Key, 
		Database, 
		RefreshCw, 
		Check, 
		Eye, 
		EyeOff, 
		Bot, 
		Sparkles,
		AlertCircle
	} from 'lucide-svelte';

	let apiKey = $state('');
	let showKey = $state(false);
	
	// Stats
	let questionCount = $state(0);
	let pdfCount = $state(0);
	let quizCount = $state(0);
	let noteCount = $state(0);
	let flashcardCount = $state(0);

	onMount(() => {
		loadSettings();
	});

	async function loadSettings() {
		apiKey = db.getGeminiApiKey();
		
		// Load counts
		try {
			const questions = await db.getQuestions();
			const pdfs = await db.getPDFs();
			const quizzes = await db.getQuizzes();
			const notes = await db.getNotes();
			const flashcards = await db.getFlashcards();
			
			questionCount = questions.length;
			pdfCount = pdfs.length;
			quizCount = quizzes.length;
			noteCount = notes.length;
			flashcardCount = flashcards.length;
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	}

	function saveApiKey(e: Event) {
		e.preventDefault();
		db.saveGeminiApiKey(apiKey.trim());
		alert('Chave API do Gemini salva com sucesso! O aplicativo já pode utilizar inteligência artificial.');
		loadSettings();
		// Force reload window to sync key across services
		window.location.reload();
	}

	function resetData() {
		if (confirm('Atenção: Isso irá apagar todas as suas questões importadas, anotações de estudo, simulados e flashcards criados, e restaurar as configurações padrão de fábrica. Deseja continuar?')) {
			// Clear localStorage
			if (typeof window !== 'undefined') {
				localStorage.clear();
			}
			loadSettings();
			alert('Banco de dados redefinido para o estado inicial!');
			window.location.reload();
		}
	}
</script>

<svelte:head>
	<title>Configurações - StudyMock</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-display font-extrabold tracking-tight">Configurações do Sistema</h1>
		<p class="text-slate-400 text-sm mt-1">
			Gerencie suas integrações com inteligência artificial e limpe ou restaure seus dados de estudo locais.
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		
		<!-- Gemini config panel -->
		<div class="glass-panel rounded-3xl p-6 lg:col-span-2 space-y-6">
			<h3 class="text-lg font-semibold text-slate-200 flex items-center gap-2">
				<Key class="h-5 w-5 text-indigo-400" />
				<span>Chave de API do Gemini (Google)</span>
			</h3>
			
			<p class="text-xs text-slate-400 leading-relaxed">
				O StudyMock realiza todo o processamento de IA e extração de PDFs diretamente no seu navegador, sem custo de servidores intermediários. Para habilitar o Tutor inteligente e o parser automático, informe sua chave do Gemini.
			</p>

			<form onsubmit={saveApiKey} class="space-y-4">
				<div class="flex flex-col space-y-1.5">
					<label for="gemini-key" class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sua Chave de API</label>
					<div class="flex gap-2">
						<div class="flex-1 relative">
							<input 
								type={showKey ? 'text' : 'password'} 
								id="gemini-key"
								bind:value={apiKey} 
								placeholder="AIzaSy..." 
								class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none transition-colors text-slate-200" 
							/>
							<button 
								type="button"
								onclick={() => showKey = !showKey}
								class="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
							>
								{#if showKey}
									<EyeOff class="h-4.5 w-4.5" />
								{:else}
									<Eye class="h-4.5 w-4.5" />
								{/if}
							</button>
						</div>

						<button 
							type="submit" 
							class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
						>
							Salvar Chave
						</button>
					</div>
				</div>
			</form>

			<!-- Key Status Banner -->
			{#if apiKey}
				<div class="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
					<Sparkles class="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
					<div>
						<h4 class="text-sm font-semibold text-emerald-300">Conexão IA Habilitada</h4>
						<p class="text-xs text-slate-400 mt-1 leading-relaxed">
							O aplicativo está conectado à API do Google Generative Language. O parser inteligente de PDFs e o Tutor interativo em tempo real estão ativos!
						</p>
					</div>
				</div>
			{:else}
				<div class="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
					<AlertCircle class="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
					<div>
						<h4 class="text-sm font-semibold text-indigo-300">Modo Local Habilitado (Offline)</h4>
						<p class="text-xs text-slate-400 mt-1 leading-relaxed">
							Sem uma chave configurada, a importação dividirá os PDFs através de expressões regulares locais e o tutor trará respostas simplificadas baseadas no seu histórico.
						</p>
					</div>
				</div>
			{/if}

			<div class="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-[10px] text-slate-500 flex items-center gap-2">
				<Bot class="h-4 w-4 text-indigo-400" />
				<span>Como conseguir uma chave gratuita? Acesse o Google AI Studio em <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" class="text-indigo-400 hover:underline">aistudio.google.com</a>, crie uma chave e cole aqui.</span>
			</div>
		</div>

		<!-- Local storage db stats & reset -->
		<div class="glass-panel rounded-3xl p-6 space-y-6">
			<h3 class="text-lg font-semibold text-slate-200 flex items-center gap-2">
				<Database class="h-5 w-5 text-indigo-400" />
				<span>Banco de Dados Local</span>
			</h3>

			<p class="text-xs text-slate-400 leading-relaxed">
				Todos os dados do seu StudyMock são salvos de forma privada no cache local do seu navegador (LocalStorage).
			</p>

			<!-- Database Inventory Counts -->
			<div class="space-y-2 text-xs pt-1 border-b border-slate-900 pb-4">
				<div class="flex justify-between">
					<span class="text-slate-500">Questões no Banco</span>
					<span class="font-bold text-slate-300">{questionCount}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-slate-500">Documentos PDF salvos</span>
					<span class="font-bold text-slate-300">{pdfCount}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-slate-500">Simulados efetuados</span>
					<span class="font-bold text-slate-300">{quizCount}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-slate-500">Anotações vinculadas</span>
					<span class="font-bold text-slate-300">{noteCount}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-slate-500">Flashcards agendados</span>
					<span class="font-bold text-slate-300">{flashcardCount}</span>
				</div>
			</div>

			<!-- Reset Actions -->
			<div class="space-y-3">
				<button 
					onclick={resetData}
					class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-950/20 border border-red-500/20 hover:bg-red-950/40 text-red-400 font-semibold text-xs transition-all"
				>
					<RefreshCw class="h-4 w-4" />
					<span>Limpar e Restaurar de Fábrica</span>
				</button>
				<p class="text-[9px] text-slate-600 text-center leading-relaxed">
					Isso apagará o LocalStorage do navegador correspondente a este aplicativo, limpando todo o progresso de estudo.
				</p>
			</div>
		</div>

	</div>
</div>
