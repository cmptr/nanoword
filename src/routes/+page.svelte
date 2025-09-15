<script>
	import { onMount } from 'svelte';
	import PuzzleGame from '$lib/components/PuzzleGame.svelte';
	
	let puzzleData = null;
	let loading = true;
	let error = null;

	onMount(async () => {
		try {
			// In development, we'll need to fetch from our API
			// In production, this will be provided by the Cloudflare Worker
			const response = await fetch('/api/puzzle');
			if (!response.ok) {
				throw new Error('Failed to load puzzle');
			}
			puzzleData = await response.json();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>nanoword - Daily Word Puzzle</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<div class="container mx-auto px-4 py-8" style="color: #535353;">
		{#if loading}
			<div class="flex items-center justify-center min-h-screen">
				<div class="loading loading-spinner loading-lg"></div>
			</div>
		{:else if error}
			<div class="alert alert-error max-w-md mx-auto">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>Error: {error}</span>
			</div>
		{:else if puzzleData}
			<PuzzleGame {puzzleData} />
		{/if}
	</div>
</div>