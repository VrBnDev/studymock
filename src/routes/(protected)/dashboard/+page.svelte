<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/services/db';
	import type { PerformanceStats } from '$lib/types';
	import { TrendingUp, Clock, BookOpen, AlertTriangle, Sparkles, Flame, ArrowRight, CircleCheck, CircleX } from 'lucide-svelte';

	let stats = $state<PerformanceStats>({
		totalAnswered: 0,
		totalCorrect: 0,
		totalIncorrect: 0,
		accuracyRate: 0,
		averageTime: 0,
		bySubject: {},
		byDate: []
	});

	let studyStreak = $state(0);
	let loading = $state(true);

	onMount(() => {
		stats = db.getStats();
		calculateStreak();
		loading = false;
	});

	function calculateStreak() {
		if (stats.byDate.length === 0) {
			studyStreak = 0;
			return;
		}

		let streak = 0;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		let checkDate = new Date(today);
		
		// Map dates to a set for O(1) checks
		const studyDates = new Set(stats.byDate.map(d => d.date));

		// Check if studied today
		const todayStr = today.toISOString().split('T')[0];
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().split('T')[0];

		// If did not study today or yesterday, streak is broken
		if (!studyDates.has(todayStr) && !studyDates.has(yesterdayStr)) {
			studyStreak = 0;
			return;
		}

		// Calculate consecutive days backwards
		let currentCheck = studyDates.has(todayStr) ? today : yesterday;
		
		while (true) {
			const checkStr = currentCheck.toISOString().split('T')[0];
			if (studyDates.has(checkStr)) {
				streak++;
				currentCheck.setDate(currentCheck.getDate() - 1);
			} else {
				break;
			}
		}
		
		studyStreak = streak;
	}

	// Computes SVG coordinates for the history line chart
	const chartPoints = $derived.by(() => {
		if (stats.byDate.length < 2) return '';
		
		const width = 500;
		const height = 150;
		const padding = 20;
		
		const data = stats.byDate.slice(-10); // Take last 10 entries
		const xStep = (width - padding * 2) / (data.length - 1);
		
		return data.map((d, index) => {
			const x = padding + index * xStep;
			// Invert Y coordinate because SVG 0 is top
			const y = height - padding - (d.rate / 100) * (height - padding * 2);
			return `${x},${y}`;
		}).join(' ');
	});

	const chartAreaPoints = $derived.by(() => {
		if (stats.byDate.length < 2) return '';
		const points = chartPoints;
		const width = 500;
		const height = 150;
		const padding = 20;
		const data = stats.byDate.slice(-10);
		
		const startX = padding;
		const endX = padding + (data.length - 1) * ((width - padding * 2) / (data.length - 1));
		const baseY = height - padding;
		
		return `${startX},${baseY} ${points} ${endX},${baseY}`;
	});

	// GitHub style heatmap grid (last 30 days)
	const heatmapDays = $derived.by(() => {
		const days = [];
		const today = new Date();
		
		// Map stats date list for lookup
		const studyActivity: Record<string, number> = {};
		stats.byDate.forEach(d => {
			studyActivity[d.date] = d.count;
		});

		for (let i = 29; i >= 0; i--) {
			const d = new Date();
			d.setDate(today.getDate() - i);
			const dateStr = d.toISOString().split('T')[0];
			const count = studyActivity[dateStr] || 0;
			
			days.push({
				date: dateStr,
				count,
				colorClass: count === 0 
					? 'bg-slate-900 border-slate-800/40' 
					: count <= 2 
						? 'bg-indigo-900/40 border-indigo-800/20' 
						: count <= 5 
							? 'bg-indigo-700/60 border-indigo-600/30' 
							: 'bg-indigo-500 border-indigo-400/40 shadow-sm shadow-indigo-500/20'
			});
		}
		return days;
	});

	// Weak subjects identifying
	const weakSubjects = $derived.by(() => {
		return Object.entries(stats.bySubject)
			.filter(([_, data]) => data.rate < 70)
			.map(([name, data]) => ({ name, ...data }));
	});
</script>

<svelte:head>
	<title>Dashboard - StudyMock</title>
</svelte:head>

<div class="space-y-8">
	<!-- Welcome Banner -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-display font-extrabold tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
				Bons estudos, Vitória!
			</h1>
			<p class="text-slate-400 text-sm mt-1">
				Acompanhe suas estatísticas de aprendizado e simulados baseados nos seus PDFs.
			</p>
		</div>
		
		<div class="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-2xl">
			<div class="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
				<Flame class="h-6 w-6 fill-orange-500/10" />
			</div>
			<div class="flex flex-col">
				<span class="text-sm font-semibold text-slate-200">{studyStreak} {studyStreak === 1 ? 'Dia' : 'Dias'}</span>
				<span class="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Ofensiva de estudos</span>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			{#each Array(4) as _}
				<div class="h-28 rounded-2xl bg-slate-900/30 border border-slate-900 animate-pulse"></div>
			{/each}
		</div>
	{:else}
		<!-- QUICK STATS -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			
			<div class="glass-panel rounded-3xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-slate-800/80">
				<div class="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
					<BookOpen class="h-6 w-6" />
				</div>
				<div>
					<span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Questões Feitas</span>
					<h3 class="text-2xl font-bold font-display text-slate-100 mt-0.5">{stats.totalAnswered}</h3>
				</div>
			</div>

			<div class="glass-panel rounded-3xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-slate-800/80">
				<div class="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
					<CircleCheck class="h-6 w-6" />
				</div>
				<div>
					<span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Taxa de Acerto</span>
					<h3 class="text-2xl font-bold font-display text-emerald-400 mt-0.5">{stats.accuracyRate}%</h3>
				</div>
			</div>

			<div class="glass-panel rounded-3xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-slate-800/80">
				<div class="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
					<CircleX class="h-6 w-6" />
				</div>
				<div>
					<span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Erros Registrados</span>
					<h3 class="text-2xl font-bold font-display text-red-400 mt-0.5">{stats.totalIncorrect}</h3>
				</div>
			</div>

			<div class="glass-panel rounded-3xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-slate-800/80">
				<div class="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
					<Clock class="h-6 w-6" />
				</div>
				<div>
					<span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tempo Médio</span>
					<h3 class="text-2xl font-bold font-display text-slate-100 mt-0.5">{stats.averageTime}s</h3>
				</div>
			</div>

		</div>

		<!-- CHARTS SECTION -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			
			<!-- Historical Area Chart -->
			<div class="glass-panel rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="text-lg font-semibold text-slate-200">Evolução Temporal</h3>
						<p class="text-xs text-slate-500">Taxa de acertos nos últimos simulados</p>
					</div>
					<div class="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10">
						<TrendingUp class="h-3.5 w-3.5" />
						<span>+{stats.accuracyRate > 50 ? 'Estável' : 'Revisar'}</span>
					</div>
				</div>

				<div class="w-full flex-1 flex items-center justify-center py-4">
					{#if stats.byDate.length >= 2}
						<svg viewBox="0 0 500 150" class="w-full h-44 overflow-visible">
							<defs>
								<linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="rgba(99, 102, 241, 0.45)" />
									<stop offset="100%" stop-color="rgba(99, 102, 241, 0.0)" />
								</linearGradient>
							</defs>
							
							<!-- Grid Lines -->
							<line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" stroke-dasharray="4" />
							<line x1="20" y1="65" x2="480" y2="65" stroke="rgba(255,255,255,0.03)" stroke-dasharray="4" />
							<line x1="20" y1="110" x2="480" y2="110" stroke="rgba(255,255,255,0.03)" stroke-dasharray="4" />
							
							<!-- Area under the curve -->
							<polygon points={chartAreaPoints} fill="url(#chartGrad)" />
							
							<!-- Line -->
							<polyline
								fill="none"
								stroke="#6366f1"
								stroke-width="3"
								points={chartPoints}
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							
							<!-- Interactive dots -->
							{#each stats.byDate.slice(-10) as pt, index}
								{@const coords = chartPoints.split(' ')[index].split(',')}
								<circle
									cx={coords[0]}
									cy={coords[1]}
									r="4"
									fill="#9f55ff"
									stroke="#ffffff"
									stroke-width="1.5"
									class="transition-all hover:r-6 cursor-pointer"
								>
									<title>{pt.date}: {pt.rate}% ({pt.count} q)</title>
								</circle>
							{/each}
						</svg>
					{:else}
						<div class="text-center py-8 text-slate-500 text-sm">
							Gere e conclua simulados para traçar seu gráfico de desempenho.
						</div>
					{/if}
				</div>

				<div class="flex justify-between text-[10px] text-slate-600 px-4 mt-2 border-t border-slate-900 pt-3">
					<span>Início</span>
					<span>Apenas simulados concluídos</span>
					<span>Atual</span>
				</div>
			</div>

			<!-- Heatmap Calendar -->
			<div class="glass-panel rounded-3xl p-6 flex flex-col justify-between">
				<div>
					<h3 class="text-lg font-semibold text-slate-200">Frequência de Estudos</h3>
					<p class="text-xs text-slate-500 mb-4">Seus últimos 30 dias de dedicação</p>
				</div>

				<div class="grid grid-cols-6 gap-2.5 max-w-xs mx-auto py-2">
					{#each heatmapDays as day}
						<div 
							class="aspect-square rounded-md border flex items-center justify-center text-[10px] text-slate-400/30 hover:border-indigo-500/40 hover:text-white transition-all cursor-pointer {day.colorClass}"
							title="{day.date}: {day.count} questões resolvidas"
						>
							{new Date(day.date).getDate()}
						</div>
					{/each}
				</div>

				<div class="flex items-center justify-between text-[10px] text-slate-600 mt-4 border-t border-slate-900 pt-3">
					<span>Menos ativo</span>
					<div class="flex gap-1">
						<div class="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800/40"></div>
						<div class="w-2.5 h-2.5 rounded bg-indigo-900/40 border border-indigo-800/20"></div>
						<div class="w-2.5 h-2.5 rounded bg-indigo-700/60 border border-indigo-600/30"></div>
						<div class="w-2.5 h-2.5 rounded bg-indigo-500"></div>
					</div>
					<span>Mais ativo</span>
				</div>
			</div>

		</div>

		<!-- DISCIPLINES AND WEAKNESSES -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			
			<!-- Disciplines Progress -->
			<div class="glass-panel rounded-3xl p-6">
				<h3 class="text-lg font-semibold text-slate-200 mb-4">Desempenho por Disciplina</h3>
				
				<div class="space-y-4">
					{#if Object.keys(stats.bySubject).length > 0}
						{#each Object.entries(stats.bySubject) as [name, data]}
							<div class="space-y-1.5">
								<div class="flex justify-between text-sm">
									<span class="text-slate-300 font-medium">{name}</span>
									<span class="font-bold text-slate-200">{data.rate}% <span class="text-xs text-slate-500 font-normal">({data.correct}/{data.total})</span></span>
								</div>
								<!-- Progress Bar -->
								<div class="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-900">
									<div 
										class="h-full rounded-full transition-all duration-500
										{data.rate >= 80 
											? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/20' 
											: data.rate >= 60 
												? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-sm shadow-indigo-500/20' 
												: 'bg-gradient-to-r from-amber-500 to-red-500 shadow-sm shadow-amber-500/20'}"
										style="width: {data.rate}%"
									></div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-center py-8 text-slate-500 text-sm">
							Nenhum dado por disciplina registrado. Faça um simulado!
						</div>
					{/if}
				</div>
			</div>

			<!-- Weaknesses & AI tutor recommendations -->
			<div class="glass-panel rounded-3xl p-6 flex flex-col justify-between border-indigo-500/10">
				<div>
					<div class="flex items-center gap-2 mb-3">
						<div class="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
							<Sparkles class="h-4.5 w-4.5" />
						</div>
						<h3 class="text-lg font-semibold text-slate-200">Recomendações do Tutor</h3>
					</div>

					<div class="space-y-4">
						{#if weakSubjects.length > 0}
							<div class="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
								<AlertTriangle class="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
								<div>
									<h4 class="text-sm font-semibold text-amber-400">Atenção Necessária</h4>
									<p class="text-xs text-slate-400 mt-1 leading-relaxed">
										Identificamos que você possui desempenho abaixo de 70% em: 
										<span class="text-slate-200 font-medium">
											{weakSubjects.map(s => s.name).join(', ')}
										</span>.
									</p>
								</div>
							</div>

							<div class="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
								<strong>Recomendação de Estudo:</strong> Revise os flashcards de criptografia e portas lógicas. Utilize a barra lateral de IA para fazer perguntas rápidas como "Como funciona o handshake do TLS?" ou "Diferenças de portas TCP 80 e 443" para sanar as dúvidas recorrentes.
							</div>
						{:else if stats.totalAnswered > 0}
							<div class="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
								<CircleCheck class="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
								<div>
									<h4 class="text-sm font-semibold text-emerald-400">Excelente Desempenho!</h4>
									<p class="text-xs text-slate-400 mt-1 leading-relaxed">
										Você mantém médias sólidas em todas as disciplinas estudadas. Continue fazendo simulados periódicos e revisando flashcards agendados para fixar o aprendizado a longo prazo.
									</p>
								</div>
							</div>
						{:else}
							<div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
								<Sparkles class="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
								<div>
									<h4 class="text-sm font-semibold text-slate-300">Comece sua jornada</h4>
									<p class="text-xs text-slate-500 mt-1 leading-relaxed">
										Para habilitar a análise de fraquezas e as recomendações automatizadas do Tutor, faça o upload de um PDF com questões ou resolva um simulado de teste.
									</p>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="mt-6">
					<a 
						href="/simulados" 
						class="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/15"
					>
						<span>Iniciar Novo Simulado</span>
						<ArrowRight class="h-4 w-4" />
					</a>
				</div>
			</div>

		</div>
	{/if}
</div>
