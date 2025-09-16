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

<div class="bg-white mb-6">
	<div class="p-4">
		<!-- Stats Row -->
		<div class="flex justify-center gap-6 mb-4">
			<div class="stat px-0 text-right">
				<div class="stat-title text-xs" style="color: #535353;">Time</div>
				<div class="stat-value text-lg font-bold text-blue-600">
					{formatTime(currentTime)}
				</div>
			</div>
			
			<div class="stat px-0 text-left">
				<div class="stat-title text-xs" style="color: #535353;">
					{#if gameState.isMultiWord}
						Word {gameState.currentWordIndex + 1}/5
					{:else}
						Hints
					{/if}
				</div>
				<div class="stat-value text-lg font-bold text-orange-600">
					{#if gameState.isMultiWord}
						💡 {gameState.hintCount}
					{:else}
						{gameState.hintCount}
					{/if}
				</div>
			</div>
		</div>

		<!-- Controls Row -->
		<div class="flex flex-wrap justify-center gap-2">
			<button 
				class="btn btn-sm flex-none"
				style="color: #535353; background-color: white; border: 1px solid #d1d5db;"
				disabled={gameState.hintCount >= gameState.maxHints || gameState.isCompleted}
				on:click={useHint}
			>
				{hintButtonText}
			</button>
			
			<button 
				class="btn btn-sm flex-none"
				style="color: #535353; background-color: white; border: 1px solid #d1d5db;"
				disabled={gameState.isCompleted}
				on:click={checkSolution}
			>
				Check
			</button>
			
			<button 
				class="btn btn-sm flex-none"
				style="color: #535353; background-color: white; border: 1px solid #d1d5db;"
				disabled={gameState.isCompleted}
				on:click={clearGrid}
			>
				Clear
			</button>
			
			<button 
				class="btn btn-sm flex-none"
				style="color: #535353; background-color: white; border: 1px solid #d1d5db;"
				disabled={gameState.isCompleted}
				on:click={revealSolution}
			>
				Reveal
			</button>
		</div>
	</div>
</div>