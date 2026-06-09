<script lang="ts">
	import '../layout.css';
	import { onMount, onDestroy } from 'svelte';
	import { db } from '$lib/services/db';
	import { gemini } from '$lib/services/gemini';
	import { setupAuthListener } from '$lib/services/authHelpers';
	import { authUser, authLoading, isAuthenticated } from '$lib/stores/auth';
	import { Bot, Send, X, ArrowRight, LoaderCircle } from 'lucide-svelte';
	import NavigationComponent from '$lib/components/globals/NavigationComponent.svelte';

	let { children } = $props();
	let unsubscribe: any;

	onMount(() => {
		// Setup listener para mudanças de autenticação
		unsubscribe = setupAuthListener();
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
	
	// Tutor Sidebar state
	let isTutorOpen = $state(false);
	let tutorMessages = $state<{ sender: 'user' | 'tutor'; text: string; time: string }[]>([
		{ 
			sender: 'tutor', 
			text: 'Olá! Sou seu Tutor de IA StudyMock. Posso ajudar a analisar seus pontos fracos nos simulados, explicar questões complexas ou criar dicas de memorização baseadas nas suas notas de estudo. Como posso ajudar você hoje?',
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		}
	]);
	let currentInput = $state('');
	let isTutorLoading = $state(false);

	// Suggestion chips
	const suggestions = [
		'Quais são meus pontos fracos?',
		'Dicas para memorizar portas TCP',
		'Explicar chave assimétrica'
	];

	async function sendTutorMessage(text: string) {
		if (!text.trim() || isTutorLoading) return;
		
		const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		tutorMessages = [...tutorMessages, { sender: 'user', text, time: timeStr }];
		currentInput = '';
		isTutorLoading = true;

		try {
			const stats = db.getStats();
			const apiKey = db.getGeminiApiKey();
			const reply = await gemini.getGeneralTutorAdvice(stats, text, apiKey);
			
			tutorMessages = [...tutorMessages, { 
				sender: 'tutor', 
				text: reply,
				time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			}];
		} catch (err: any) {
			tutorMessages = [...tutorMessages, { 
				sender: 'tutor', 
				text: `Erro ao obter conselhos: ${err.message}. Certifique-se de configurar sua chave de API do Gemini nas Configurações.`,
				time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			}];
		} finally {
			isTutorLoading = false;
			// Scroll tutor chat container
			setTimeout(() => {
				const container = document.getElementById('tutor-messages-container');
				if (container) container.scrollTop = container.scrollHeight;
			}, 100);
		}
	}
</script>

<!-- Main authenticated layout -->
<div class="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
	
	<NavigationComponent />

	<!-- MAIN CONTENT WINDOW -->
	<main class="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
		<div class="flex-1 overflow-y-auto p-4 md:p-8">
			<div class="max-w-6xl mx-auto w-full pb-12">
				{@render children()}
			</div>
		</div>
	</main>

	<!-- FLOATING AI TUTOR PANEL -->
	<aside 
		class="fixed inset-y-0 right-0 z-50 w-full sm:w-96 flex flex-col bg-slate-900/90 border-l border-slate-800 shadow-2xl backdrop-blur-xl transition-all duration-300
		{isTutorOpen ? 'translate-x-0' : 'translate-x-full'}"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
			<div class="flex items-center gap-2">
				<div class="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
					<Bot class="h-5 w-5" />
				</div>
				<div>
					<h3 class="font-display font-semibold text-sm">Tutor de IA StudyMock</h3>
					<div class="flex items-center gap-1.5">
						<div class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
						<span class="text-[10px] text-slate-400">Pronto para ajudar</span>
					</div>
				</div>
			</div>
			<button 
				onclick={() => isTutorOpen = false} 
				class="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<!-- Chat Messages Container -->
		<div id="tutor-messages-container" class="flex-1 overflow-y-auto p-4 space-y-4">
			{#each tutorMessages as msg}
				<div class="flex flex-col {msg.sender === 'user' ? 'items-end' : 'items-start'}">
					<div 
						class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
						{msg.sender === 'user' 
							? 'bg-indigo-600 text-white rounded-tr-none' 
							: 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none'}"
					>
						<!-- Markdown rendering (simplified client-side parser for layout/bullets) -->
						{#each msg.text.split('\n') as paragraph}
							{#if paragraph.startsWith('- ')}
								<div class="pl-4 -indent-4 my-1">
									• {@html paragraph.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
								</div>
							{:else if paragraph.startsWith('**') && paragraph.endsWith('**')}
								<p class="font-semibold text-slate-100 mt-2 mb-1">
									{@html paragraph.replace(/\*\*(.*?)\*\*/g, '$1')}
								</p>
							{:else if paragraph.trim().length > 0}
								<p class="mb-2 last:mb-0">
									{@html paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
								</p>
							{/if}
						{/each}
					</div>
					<span class="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
				</div>
			{/each}

			{#if isTutorLoading}
				<div class="flex flex-col items-start">
					<div class="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
						<div class="flex space-x-1">
							<div class="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
							<div class="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
							<div class="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
						</div>
						<span class="text-xs">Tutor está pensando...</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Suggestion list -->
		<div class="px-4 py-2 border-t border-slate-800/40 bg-slate-900/30">
			<span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Perguntas Sugeridas</span>
			<div class="flex flex-wrap gap-1.5">
				{#each suggestions as sug}
					<button 
						onclick={() => sendTutorMessage(sug)}
						class="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40 text-indigo-300 hover:bg-indigo-950/20 hover:border-indigo-800/50 transition-all text-left flex items-center gap-1 group"
					>
						<span>{sug}</span>
						<ArrowRight class="h-3 w-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
					</button>
				{/each}
			</div>
		</div>

		<!-- Input Area -->
		<div class="p-4 border-t border-slate-800 bg-slate-900/50">
			<form 
				onsubmit={(e) => { e.preventDefault(); sendTutorMessage(currentInput); }} 
				class="flex items-center gap-2"
			>
				<input 
					type="text" 
					bind:value={currentInput}
					placeholder="Pergunte ao tutor de IA..." 
					class="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors text-slate-200 placeholder:text-slate-600"
				/>
				<button 
					type="submit" 
					disabled={!currentInput.trim() || isTutorLoading}
					class="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
				>
					<Send class="h-4.5 w-4.5" />
				</button>
			</form>
		</div>
	</aside>

	<!-- Button to open tutor when closed -->
	{#if !isTutorOpen}
		<button 
			onclick={() => isTutorOpen = true}
			class="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-linear-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all animate-float"
			title="Falar com Tutor de IA"
		>
			<Bot class="h-6 w-6" />
			<div class="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
		</button>
	{/if}

</div>
