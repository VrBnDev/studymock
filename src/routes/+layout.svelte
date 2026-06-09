<script lang="ts">
	import './layout.css';
	import { onMount, onDestroy } from 'svelte';
	import { setupAuthListener } from '$lib/services/authHelpers';
	import { authLoading } from '$lib/stores/auth';
	import { LoaderCircle } from 'lucide-svelte';

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
</script>

{#if $authLoading}
	<!-- Loading state -->
	<div class="h-screen w-screen bg-slate-950 flex items-center justify-center">
		<div class="flex flex-col items-center gap-4">
			<LoaderCircle class="h-10 w-10 text-indigo-500 animate-spin" />
			<p class="text-slate-400 text-sm">Inicializando StudyMock...</p>
		</div>
	</div>
{:else}
	{@render children()}
{/if}
