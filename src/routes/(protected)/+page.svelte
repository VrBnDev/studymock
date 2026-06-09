<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/services/db';
	import { authUser } from '$lib/stores/auth';
	import { BookOpen, Brain, Trophy, Clock, TrendingUp } from 'lucide-svelte';
	import QuickStatsCard from '$lib/components/dashboard/QuickStatsCard.svelte';
	import ChartCard from '$lib/components/dashboard/ChartCard.svelte';
	import LatestActivity from '$lib/components/dashboard/LatestActivity.svelte';
	import LoadingCard from '$lib/components/dashboard/LoadingCard.svelte';

	let loading = $state(true);
	let stats = $state<any>({
		totalQuestions: 0,
		totalQuizzes: 0,
		averageScore: 0,
		studyStreak: 0
	});

	let recentQuizzes = $state<any[]>([]);
	let quizzesByDifficulty = $state<any>({});

	onMount(async () => {
		try {
			// Get dashboard stats
			stats = db.getStats();
			
			// Get recent quizzes
			const quizzes = await db.getQuizzes();
			recentQuizzes = quizzes.slice(0, 5);
			
			// Calculate quizzes by difficulty
			const byDifficulty = { facil: 0, medio: 0, dificil: 0 };
			quizzes.forEach((q) => {
				if (q.difficulty === 'facil') byDifficulty.facil++;
				if (q.difficulty === 'medio') byDifficulty.medio++;
				if (q.difficulty === 'dificil') byDifficulty.dificil++;
			});
			quizzesByDifficulty = byDifficulty;
		} catch (err) {
			console.error('Erro ao carregar dashboard:', err);
		} finally {
			loading = false;
		}
	});
</script>

<div class="space-y-8">
	<!-- Welcome Section -->
	<div>
		<h1 class="text-4xl font-bold text-white mb-2">
			Bem-vindo, {$authUser?.email?.split('@')[0]}! 👋
		</h1>
		<p class="text-slate-400">
			Veja seu progresso e continue estudando
		</p>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{#if loading}
			<LoadingCard />
			<LoadingCard />
			<LoadingCard />
			<LoadingCard />
		{:else}
			<QuickStatsCard 
				icon={BookOpen}
				title="Questões"
				value={stats.totalQuestions}
				subtitle="Total resolvidas"
				trend={12}
				color="indigo"
			/>
			<QuickStatsCard 
				icon={Brain}
				title="Flashcards"
				value={25}
				subtitle="Em estudo"
				trend={8}
				color="violet"
			/>
			<QuickStatsCard 
				icon={Trophy}
				title="Acertos"
				value="{stats.averageScore}%"
				subtitle="Taxa de acerto"
				trend={5}
				color="emerald"
			/>
			<QuickStatsCard 
				icon={Clock}
				title="Sequência"
				value={stats.studyStreak}
				subtitle="Dias seguidos"
				trend={-2}
				color="orange"
			/>
		{/if}
	</div>

	<!-- Charts Section -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2">
			<ChartCard 
				title="Desempenho por Dificuldade"
				data={quizzesByDifficulty}
				type="bar"
			/>
		</div>
		<div>
			<ChartCard 
				title="Progresso Semanal"
				data={{ seg: 2, ter: 3, qua: 2, qui: 4, sex: 3, sab: 5, dom: 2 }}
				type="line"
			/>
		</div>
	</div>

	<!-- Activity Section -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<LatestActivity 
			quizzes={recentQuizzes}
		/>
		<div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
			<div class="flex items-center gap-3 mb-6">
				<div class="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
					<TrendingUp class="h-5 w-5" />
				</div>
				<h3 class="text-lg font-semibold text-white">Próximas Ações</h3>
			</div>
			<div class="space-y-3">
				<a href="/questoes" class="block p-3 rounded-lg bg-slate-800/50 hover:bg-indigo-950/30 border border-slate-700 hover:border-indigo-700/50 transition-colors">
					<p class="font-medium text-slate-100">Resolver mais questões</p>
					<p class="text-sm text-slate-400">Continue seu treino</p>
				</a>
				<a href="/simulados" class="block p-3 rounded-lg bg-slate-800/50 hover:bg-violet-950/30 border border-slate-700 hover:border-violet-700/50 transition-colors">
					<p class="font-medium text-slate-100">Fazer um simulado</p>
					<p class="text-sm text-slate-400">Teste seu conhecimento</p>
				</a>
				<a href="/flashcards" class="block p-3 rounded-lg bg-slate-800/50 hover:bg-emerald-950/30 border border-slate-700 hover:border-emerald-700/50 transition-colors">
					<p class="font-medium text-slate-100">Revisar flashcards</p>
					<p class="text-sm text-slate-400">Reforce a memorização</p>
				</a>
			</div>
		</div>
	</div>
</div>
