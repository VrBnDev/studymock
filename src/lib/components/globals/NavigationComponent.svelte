<script lang='ts'>
	import { Bot, Menu, Sparkles, LayoutDashboard, FileUp, FileText, GraduationCap, Layers, Settings, LogOut } from "@lucide/svelte";
	import { page } from '$app/state';
	import { authUser } from '$lib/stores/auth';
	import { signOut } from '$lib/services/authHelpers';

	// Navigation state
	let isMobileNavOpen = $state(false);
	let isUserMenuOpen = $state(false);
	let isLoggingOut = $state(false);
	
	// Navigation items
	const navItems = [
		{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
		{ name: 'Importar PDF', path: '/importar', icon: FileUp },
		{ name: 'Banco de Questões', path: '/questoes', icon: FileText },
		{ name: 'Simulados', path: '/simulados', icon: GraduationCap },
		{ name: 'Flashcards', path: '/flashcards', icon: Layers },
		{ name: 'Configurações', path: '/configuracoes', icon: Settings }
	];

	function getActivePath(currentPath: string, itemPath: string): boolean {
		if (itemPath === '/dashboard') {
			return currentPath === '/dashboard' || currentPath === '/';
		}
		return currentPath.startsWith(itemPath);
	}

	async function handleLogout() {
		try {
			isLoggingOut = true;
			await signOut();
		} catch (err) {
			console.error('Logout error:', err);
		} finally {
			isLoggingOut = false;
			isUserMenuOpen = false;
		}
	}

	function getUserInitials(email: string): string {
		return email
			.split('@')[0]
			.split('.')
			.map(part => part[0].toUpperCase())
			.join('')
			.slice(0, 2);
	}


</script>

<!-- MOBILE HEADER -->
<header class="flex md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 items-center justify-between z-40">
    <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles class="h-5 w-5 text-white" />
        </div>
        <span class="font-display font-bold text-xl tracking-tight bg-linear-to-r from-indigo-200 to-white bg-clip-text text-transparent">StudyMock</span>
    </div>
    
    <div class="flex items-center gap-2">
        <button onclick={() => isTutorOpen = !isTutorOpen} class="h-9 w-9 rounded-lg border border-slate-800 flex items-center justify-center bg-slate-900/50 hover:bg-slate-800 text-indigo-400" aria-label="Toggle Tutor">
            <Bot class="h-5 w-5" />
        </button>
        <button onclick={() => isMobileNavOpen = !isMobileNavOpen} class="h-9 w-9 rounded-lg border border-slate-800 flex items-center justify-center bg-slate-900/50 hover:bg-slate-800" aria-label="Toggle Menu">
            <Menu class="h-5 w-5" />
        </button>
    </div>
</header>

<!-- NAVIGATION SIDEBAR (DESKTOP & MOBILE) -->
<aside  class="fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 flex flex-col bg-slate-900/40 border-r border-slate-900 backdrop-blur-xl md:backdrop-blur-none transition-transform duration-300 md:translate-x-0 pt-16 md:pt-0 {isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}">
    <!-- Logo Section (Desktop only) -->
    <div class="hidden md:flex items-center gap-3 px-6 py-8">
        <div class="h-10 w-10 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-float">
            <Sparkles class="h-5.5 w-5.5 text-white" />
        </div>
        <div class="flex flex-col">
            <span class="font-display font-bold text-xl tracking-tight bg-linear-to-r from-indigo-200 to-white bg-clip-text text-transparent">StudyMock</span>
            <span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Estudos Inteligentes</span>
        </div>
    </div>

    <!-- Nav Links -->
    <nav class="flex-1 px-4 space-y-1 overflow-y-auto">
        {#each navItems as item}
            {@const Icon = item.icon}
            {@const isActive = getActivePath(page.url.pathname, item.path)}
            <a 
                href={item.path} 
                onclick={() => isMobileNavOpen = false}
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                {isActive 
                    ? 'bg-indigo-600/10 text-indigo-300 font-medium border border-indigo-500/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border border-transparent'}"
            >
                <Icon class="h-5 w-5 transition-transform duration-200 group-hover:scale-105 {isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}" />
                <span class="text-sm">{item.name}</span>
                
                {#if isActive}
                    <div class="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r"></div>
                {/if}
            </a>
        {/each}
    </nav>

    <!-- Bottom User Area -->
    <div class="p-4 border-t border-slate-900 relative">
        {#if $authUser}
            <button 
                onclick={() => isUserMenuOpen = !isUserMenuOpen}
                class="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/20 border border-slate-900/60 hover:bg-slate-900/40 transition-colors"
            >
                <div class="flex items-center gap-3 min-w-0">
                    <div class="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                        {getUserInitials($authUser.email || 'U')}
                    </div>
                    <div class="flex flex-col min-w-0">
                        <span class="text-sm font-medium text-slate-200 truncate">
                            {$authUser.user_metadata?.name || $authUser.email?.split('@')[0] || 'Usuário'}
                        </span>
                        <span class="text-xs text-slate-500 truncate">
                            {$authUser.email}
                        </span>
                    </div>
                </div>
            </button>

            <!-- User Menu Dropdown -->
            {#if isUserMenuOpen}
                <div class="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                    <a 
                        href="/configuracoes"
                        onclick={() => { isUserMenuOpen = false; isMobileNavOpen = false; }}
                        class="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:text-slate-100 hover:bg-slate-700/50 first:rounded-t-lg"
                    >
                        <Settings class="h-4 w-4" />
                        <span>Configurações</span>
                    </a>
                    <button 
                        onclick={handleLogout}
                        disabled={isLoggingOut}
                        class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/20 last:rounded-b-lg transition-colors disabled:opacity-50"
                    >
                        <LogOut class="h-4 w-4" />
                        <span>{isLoggingOut ? 'Desconectando...' : 'Sair'}</span>
                    </button>
                </div>
            {/if}
        {/if}
    </div>
</aside>

<!-- Mobile Sidebar Overlay -->
{#if isMobileNavOpen}
    <button 
        onclick={() => isMobileNavOpen = false} 
        class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
        aria-label="Close navigation overlay"
    ></button>
{/if}