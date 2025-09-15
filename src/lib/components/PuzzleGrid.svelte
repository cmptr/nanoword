<script>
	let { puzzleData, gameState, selectedCell, handleCellInput, handleCellSelect, showingCheckResults } = $props();

	function onInput(event, index) {
		const value = event.target.value;
		handleCellInput(index, value);
	}

	function onKeydown(event, index) {
		if (event.key === 'ArrowLeft' && index > 0) {
			event.preventDefault();
			handleCellSelect(index - 1);
		} else if (event.key === 'ArrowRight' && index < gameState.userInput.length - 1) {
			event.preventDefault();
			handleCellSelect(index + 1);
		} else if (event.key === 'Backspace' && event.target.value === '' && index > 0) {
			event.preventDefault();
			handleCellSelect(index - 1);
		}
	}

	function getCellSize() {
		const wordLength = puzzleData.grid[0].length;
		const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
		
		if (screenWidth <= 360) {
			return Math.min(45, Math.floor((screenWidth - 40) / wordLength));
		} else if (screenWidth <= 480) {
			return Math.min(50, Math.floor((screenWidth - 40) / wordLength));
		} else if (screenWidth <= 768) {
			return Math.min(60, Math.floor((screenWidth - 40) / wordLength));
		} else if (screenWidth <= 1024) {
			return Math.min(100, Math.floor((screenWidth - 80) / wordLength));
		} else {
			return 125;
		}
	}

	let cellSize = $derived(getCellSize());
	let fontSize = $derived(Math.floor(cellSize * 0.6));

	function getCellCheckClass(index) {
		console.log(`Getting class for cell ${index}, showingCheckResults: ${showingCheckResults}`);
		if (!showingCheckResults) return '';
		
		const solution = puzzleData.solution[0];
		const userValue = gameState.userInput[index];
		const correctValue = solution[index];
		
		console.log(`Cell ${index}: user="${userValue}", correct="${correctValue}"`);
		
		if (userValue === correctValue && userValue !== '') {
			console.log(`Cell ${index}: correct - returning green`);
			return '!bg-green-100 !border-green-300';
		} else if (userValue !== '' && userValue !== correctValue) {
			console.log(`Cell ${index}: incorrect - returning red`);
			return '!bg-red-100 !border-red-300';
		} else if (userValue === '') {
			console.log(`Cell ${index}: empty - returning pale red`);
			return '!bg-red-50 !border-red-200';
		}
		return '';
	}
</script>

<div class="flex justify-center">
	<div class="inline-flex border-4 border-gray-600 bg-gray-600">
		{#each puzzleData.grid[0] as cell, index}
			{#if cell.isBlack}
				<div 
					class="bg-gray-600"
					style="width: {cellSize}px; height: {cellSize}px; min-width: {cellSize}px; min-height: {cellSize}px;"
				></div>
			{:else}
				<div class="relative border border-gray-600 bg-white">
					<input
						type="text"
						maxlength="1"
						data-index={index}
						class="w-full h-full text-center font-bold border-none outline-none bg-transparent focus:bg-blue-50 focus:ring-2 focus:ring-blue-500 {gameState.hintRevealed[index] ? 'bg-orange-50 text-orange-600' : ''} {selectedCell === index && !showingCheckResults ? 'ring-2 ring-blue-500 bg-blue-50' : ''} {getCellCheckClass(index)}"
						style="width: {cellSize}px; height: {cellSize}px; min-width: {cellSize}px; min-height: {cellSize}px; font-size: {fontSize}px; font-family: 'Libre Franklin', sans-serif;"
						value={gameState.userInput[index] || ''}
						disabled={gameState.isCompleted}
						on:input={(e) => onInput(e, index)}
						on:focus={() => handleCellSelect(index)}
						on:keydown={(e) => onKeydown(e, index)}
						autocomplete="off"
						autocorrect="off"
						spellcheck="false"
					/>
					{#if index === 0}
						<div 
							class="absolute top-0 left-1 pointer-events-none font-normal"
							style="font-size: {Math.floor(cellSize * 0.26)}px; font-family: 'Micro 5', monospace; color: #535353;"
						>
							1
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
</div>