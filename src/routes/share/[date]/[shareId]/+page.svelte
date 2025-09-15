<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let shareData = $state(null);
	let loading = $state(true);
	let error = $state(null);

	onMount(async () => {
		try {
			const { date, shareId } = $page.params;
			console.log('Share page mounting with params:', { date, shareId });
			
			const response = await fetch(`/api/share/${date}/${shareId}`);
			console.log('Share page response status:', response.status);
			console.log('Share page response headers:', Object.fromEntries(response.headers.entries()));
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('Share page response error:', errorText);
				if (response.status === 404) {
					throw new Error('Share not found');
				}
				throw new Error('Failed to load share');
			}
			
			const data = await response.json();
			console.log('Share page received data:', data);
			shareData = data.shareData;
			console.log('Share page shareData set to:', shareData);
		} catch (err) {
			console.error('Error in share page:', err);
			error = err.message;
		} finally {
			console.log('Share page loading set to false');
			loading = false;
		}
	});

	let statusEmoji = $derived(shareData?.isRevealed ? '🔍' : '✅');
	let statusText = $derived(shareData?.isRevealed ? 'REVEALED' : 'SOLVED');
</script>

<svelte:head>
	{#if shareData}
		<title>nanoword {shareData.date} - {statusText}</title>
		<meta property="og:title" content="nanoword {shareData.date} - {statusText}" />
		<meta property="og:description" content="I {shareData.isRevealed ? 'revealed' : 'solved'} today's nanoword puzzle in {shareData.time}!" />
		<meta property="og:type" content="website" />
		<meta name="twitter:card" content="summary" />
		<meta name="twitter:title" content="nanoword {shareData.date} - {statusText}" />
		<meta name="twitter:description" content="I {shareData.isRevealed ? 'revealed' : 'solved'} today's nanoword puzzle in {shareData.time}!" />
	{/if}
</svelte:head>

<div class="min-h-screen bg-white flex items-center justify-center p-4" style="color: #535353;">
	{#if loading}
		<div class="loading loading-spinner loading-lg"></div>
	{:else if error}
		<div class="card bg-base-100 shadow-xl max-w-md">
			<div class="card-body text-center">
				<h2 class="card-title justify-center text-error">❌ {error}</h2>
				<p>Sorry, this share link could not be found.</p>
				<div class="card-actions justify-center">
					<a href="/" class="btn btn-primary" style="font-family: 'Pixelify Sans', sans-serif;">Play Today's Puzzle</a>
				</div>
			</div>
		</div>
	{:else if shareData}
		<div class="card bg-base-100 shadow-xl max-w-lg">
			<div class="card-body text-center">
				<h1 class="text-4xl font-bold mb-2" style="font-family: 'Pixelify Sans', monospace; color: #535353;">
					nanoword
				</h1>
				<div class="text-lg mb-4" style="font-family: 'Tiny5', monospace; color: #666;">
					{shareData.date}
				</div>
				<div class="text-2xl mb-6 {shareData.isRevealed ? 'text-warning' : 'text-success'}">
					{statusEmoji} {statusText}
				</div>
				
				<div class="stats stats-horizontal shadow mb-6">
					<div class="stat">
						<div class="stat-title">Time</div>
						<div class="stat-value text-lg">⏱️ {shareData.time}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Hints Used</div>
						<div class="stat-value text-lg">💡 {shareData.hints}</div>
					</div>
				</div>
				
				<div class="card-actions justify-center">
					<a href="/" class="btn btn-primary btn-lg" style="font-family: 'Pixelify Sans', sans-serif;">Play Today's Puzzle</a>
				</div>
			</div>
		</div>
	{/if}
</div>