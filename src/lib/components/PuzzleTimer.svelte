<script>
	import { onMount, onDestroy } from 'svelte';
	
	let { gameState, formatTime, useHint, checkSolution, clearGrid, revealSolution, saveProgress } = $props();
	
	let currentTime = $state(0);
	let interval;

	onMount(() => {
		if (gameState.isTimerRunning && !gameState.isCompleted) {
			interval = setInterval(updateTimer, 10); // Update every 10ms for smooth millisecond display
		}
		updateTimer();
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});

	let lastSaveTime = 0;

	function updateTimer() {
		if (!gameState.startTime || !gameState.isTimerRunning) return;
		
		currentTime = Date.now() - gameState.startTime;
		
		// Save progress every second to persist timer state
		if (currentTime - lastSaveTime >= 1000) {
			saveProgress();
			lastSaveTime = currentTime;
		}
	}

	$effect(() => {
		if (gameState.isTimerRunning && !interval && !gameState.isCompleted) {
			interval = setInterval(updateTimer, 10); // Update every 10ms for smooth millisecond display
		} else if (!gameState.isTimerRunning && interval) {
			clearInterval(interval);
			interval = null;
		}
	});

	let hintButtonText = $derived(gameState.hintCount >= gameState.maxHints 
		? 'No Hints Left' 
		: `Hint (${gameState.maxHints - gameState.hintCount} left)`);
</script>

<div class="flex justify-between items-center p-4 border-t-2 border-b-2 border-gray-600 bg-white mb-6">
	<div class="flex items-center gap-4">
		<div class="flex items-center gap-2">
			<span class="text-sm" style="color: #535353;">Time:</span>
			<span class="text-lg font-bold text-blue-600">
				{formatTime(currentTime)}
			</span>
		</div>
		
		<div class="flex items-center gap-2">
			<span class="text-xs" style="color: #535353;">Hints:</span>
			<span class="px-2 py-1 text-sm font-bold text-orange-600 bg-orange-100 rounded">
				{gameState.hintCount}
			</span>
		</div>
	</div>

	<div class="flex items-center gap-3">
		<button 
			class="btn btn-sm"
			style="color: #535353; background-color: white; border: none;"
			disabled={gameState.hintCount >= gameState.maxHints || gameState.isCompleted}
			on:click={useHint}
		>
			{hintButtonText}
		</button>
		
		<button 
			class="btn btn-sm"
			style="color: #535353; background-color: white; border: none;"
			disabled={gameState.isCompleted}
			on:click={checkSolution}
		>
			Check
		</button>
		
		<button 
			class="btn btn-sm"
			style="color: #535353; background-color: white; border: none;"
			disabled={gameState.isCompleted}
			on:click={clearGrid}
		>
			Clear
		</button>
		
		<button 
			class="btn btn-sm"
			style="color: #535353; background-color: white; border: none;"
			disabled={gameState.isCompleted}
			on:click={revealSolution}
		>
			Reveal
		</button>
	</div>
</div>