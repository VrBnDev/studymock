<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { signInWithGoogle, signInWithGithub } from '$lib/services/authHelpers';
	import { authUser, authError } from '$lib/stores/auth';
	import { LoaderCircle, GitBranch} from 'lucide-svelte';

	let loading = $state(false);
	let error = $state('');

	// Redirecionar se já autenticado
	onMount(() => {
		if ($authUser) {
			goto('/dashboard');
		}
	});

	async function handleGoogleLogin() {
		try {
			error = '';
			loading = true;
			await signInWithGoogle();
		} catch (err) {
			error = $authError || 'Erro ao fazer login com Google';
			loading = false;
		}
	}

	async function handleGithubLogin() {
		try {
			error = '';
			loading = true;
			await signInWithGithub();
		} catch (err) {
			error = $authError || 'Erro ao fazer login com GitHub';
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-6 overflow-hidden">
	<div class="absolute inset-0">
		<div class="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div> 
		<div class="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"></div>
	</div>

	<div class="relative w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8">
		<div class="text-center space-y-4">
			<div class="mx-auto h-20 w-20 rounded-3xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
				<span class="text-3xl font-black text-white">S</span>
			</div>

			<div>
				<h1 class="text-3xl font-bold text-white">
					StudyMock
				</h1>

				<p class="text-slate-400 mt-2">
					Sua plataforma inteligente de simulados
				</p>
			</div>
		</div>

		<div class="mt-10 space-y-3">
			{#if error}
				<div class="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-400 text-center">
					{error}
				</div>
			{/if}

			<button 
				onclick={handleGoogleLogin}
				disabled={loading}
				class="w-full h-14 flex items-center justify-center gap-3 bg-white/95 text-slate-900 font-medium rounded-xl border border-white/20 hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<LoaderCircle class="h-5 w-5 animate-spin" />
				{:else}
					<svg class="w-5 h-5" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg">
						<path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
						<path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
						<path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
						<path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
					</svg>
				{/if}
				<span>{loading ? 'Conectando...' : 'Continuar com Google'}</span>
			</button>

			<button 
				onclick={handleGithubLogin}
				disabled={loading}
				class="w-full h-14 flex items-center justify-center gap-3 bg-slate-900 text-white font-medium rounded-xl border border-slate-700 hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<LoaderCircle class="h-5 w-5 animate-spin" />
				{:else}
					<GitBranch class='h-5 w-5' />
				{/if}
				<span>{loading ? 'Conectando...' : 'Continuar com GitHub'}</span>
			</button>
		</div>

		<div class="mt-8 text-center">
			<p class="text-sm text-slate-500">
				Ao entrar você concorda com nossos termos
				e política de privacidade.
			</p>
		</div>

		<div class="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/10">
			<div class="text-center">
				<p class="text-xl font-bold text-white">5k+</p>
				<p class="text-xs text-slate-400">
					Questões
				</p>
			</div>

			<div class="text-center">
				<p class="text-xl font-bold text-white">AI</p>
				<p class="text-xs text-slate-400">
					Tutoria
				</p>
			</div>

			<div class="text-center">
				<p class="text-xl font-bold text-white">24/7</p>
				<p class="text-xs text-slate-400">
					Estudos
				</p>
			</div>
		</div>
	</div>
</div>
