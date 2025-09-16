<script>
	import { onMount } from 'svelte';
	import PuzzleGrid from './PuzzleGrid.svelte';
	import PuzzleTimer from './PuzzleTimer.svelte';
	import CompletionMessage from './CompletionMessage.svelte';

	let { puzzleData } = $props();

	// Initialize game state for multi-word or single-word puzzles
	let gameState = $state({
		userInput: new Array(puzzleData.grid[0].length).fill(''),
		hintCount: 0,
		maxHints: 3,
		startTime: null,
		isTimerRunning: false,
		isCompleted: false,
		completionText: '',
		hintRevealed: new Array(puzzleData.grid[0].length).fill(false),
		// Multi-word specific state
		currentWordIndex: puzzleData.currentWordIndex || 0,
		isMultiWord: puzzleData.isMultiWord || false,
		completedWords: 0
	});

	let showRevealAlert = $state(false);
	let showingCheckResults = $state(false);

	let selectedCell = $state(0);

	// Reactive current word data
	let currentWordData = $derived(() => {
		if (gameState.isMultiWord && puzzleData.allWords) {
			return puzzleData.allWords[gameState.currentWordIndex];
		}
		return puzzleData.words.across[0];
	});

	// Reactive current puzzle state
	let currentPuzzleData = $derived(() => {
		if (gameState.isMultiWord && puzzleData.allWords) {
			const currentWord = puzzleData.allWords[gameState.currentWordIndex];
			const wordLength = currentWord.length;
			
			// Create grid for current word
			const grid = [
				Array.from({ length: wordLength }, (_, col) => ({
					row: 0,
					col: col,
					contents: "",
					isBlack: false,
					number: "",
					acrossNumber: 1,
					downNumber: ""
				}))
			];
			
			return {
				...puzzleData,
				grid: grid,
				solution: [currentWord.answer.split('')],
				clues: {
					across: [currentWord],
					down: []
				},
				words: {
					across: [currentWord],
					down: []
				}
			};
		}
		return puzzleData;
	});

	onMount(() => {
		loadProgress();
		if (!gameState.isCompleted) {
			startTimer();
		}
	});

	function getPuzzleStorageKey() {
		const puzzleWord = puzzleData.words.across[0].answer;
		return `nanoword-progress-${puzzleData.date}-${puzzleWord}`;
	}

	function saveProgress() {
		const progress = {
			date: puzzleData.date,
			userInput: gameState.userInput,
			hintCount: gameState.hintCount,
			elapsedTime: gameState.startTime ? (Date.now() - gameState.startTime) : 0,
			wasTimerRunning: gameState.isTimerRunning,
			isCompleted: gameState.isCompleted,
			completionText: gameState.completionText,
			hintRevealed: gameState.hintRevealed
		};

		console.log('Saving progress:', { 
			elapsedTime: progress.elapsedTime, 
			startTime: gameState.startTime,
			isTimerRunning: gameState.isTimerRunning,
			key: getPuzzleStorageKey()
		});

		// cleanupOldPuzzleStorage(); // Temporarily disabled to debug timer reset
		localStorage.setItem(getPuzzleStorageKey(), JSON.stringify(progress));
	}

	function cleanupOldPuzzleStorage() {
		const currentDate = puzzleData.date;
		const currentWord = puzzleData.words.across[0].answer;
		const keysToRemove = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(`nanoword-progress-${currentDate}-`) && !key.endsWith(`-${currentWord}`)) {
				keysToRemove.push(key);
			}
		}

		keysToRemove.forEach(key => localStorage.removeItem(key));
	}

	function loadProgress() {
		const savedProgress = localStorage.getItem(getPuzzleStorageKey());
		console.log('Loading progress for key:', getPuzzleStorageKey());
		console.log('Found saved progress:', savedProgress);
		
		if (!savedProgress) return false;

		try {
			const progress = JSON.parse(savedProgress);
			if (progress.date !== puzzleData.date) return false;

			console.log('Restoring progress:', {
				elapsedTime: progress.elapsedTime,
				userInput: progress.userInput,
				isCompleted: progress.isCompleted
			});

			gameState.userInput = progress.userInput || new Array(puzzleData.grid[0].length).fill('');
			gameState.hintCount = progress.hintCount || 0;
			gameState.hintRevealed = progress.hintRevealed || new Array(puzzleData.grid[0].length).fill(false);

			// Restore timer state for all puzzles
			if (progress.elapsedTime !== undefined) {
				gameState.startTime = Date.now() - progress.elapsedTime;
				console.log('Restored timer with startTime:', gameState.startTime);
			}

			if (progress.isCompleted) {
				gameState.isCompleted = true;
				gameState.completionText = progress.completionText || 'Success!';
				gameState.isTimerRunning = false;
			}

			return true;
		} catch (e) {
			console.error('Error loading saved progress:', e);
			return false;
		}
	}

	function startTimer() {
		if (gameState.isTimerRunning || gameState.isCompleted) return;
		
		if (!gameState.startTime) {
			gameState.startTime = Date.now();
		}
		
		gameState.isTimerRunning = true;
		saveProgress();
	}

	function stopTimer() {
		gameState.isTimerRunning = false;
	}

	function handleCellInput(index, value) {
		gameState.userInput[index] = value.toUpperCase();
		saveProgress();
		
		// Auto-advance to next cell
		if (value && index < gameState.userInput.length - 1) {
			selectedCell = index + 1;
			// Focus the next input field
			setTimeout(() => {
				const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
				if (nextInput) {
					nextInput.focus();
				}
			}, 10);
		}
		
		// Check if puzzle is complete after this input
		setTimeout(() => {
			checkForCompletion();
		}, 50);
	}

	function handleCellSelect(index) {
		selectedCell = index;
	}

	function checkForCompletion() {
		// Don't check if already completed
		if (gameState.isCompleted) return;
		
		const solution = currentPuzzleData().solution[0];
		
		// Check if all cells are filled
		const allFilled = gameState.userInput.every(cell => cell !== '');
		if (!allFilled) return;
		
		// Check if all cells are correct
		const allCorrect = gameState.userInput.every((cell, index) => cell === solution[index]);
		if (allCorrect) {
			if (gameState.isMultiWord) {
				completeCurrentWord();
			} else {
				completeGame();
			}
		}
	}

	function completeCurrentWord() {
		gameState.completedWords++;
		
		// Check if all words are completed
		if (gameState.completedWords >= puzzleData.totalWords) {
			completeGame();
			return;
		}
		
		// Advance to next word
		gameState.currentWordIndex++;
		
		// Reset user input for new word
		const nextWordLength = puzzleData.allWords[gameState.currentWordIndex].length;
		gameState.userInput = new Array(nextWordLength).fill('');
		gameState.hintRevealed = new Array(nextWordLength).fill(false);
		
		// Reset selected cell
		selectedCell = 0;
		
		// Save progress
		saveProgress();
		
		// Focus first cell of new word
		setTimeout(() => {
			const firstInput = document.querySelector(`input[data-index="0"]`);
			if (firstInput) {
				firstInput.focus();
			}
		}, 100);
	}

	function checkSolution() {
		console.log('Check button clicked');
		showingCheckResults = true;
		console.log('showingCheckResults set to true');
		
		// Auto-hide check results after 3 seconds
		setTimeout(() => {
			showingCheckResults = false;
			console.log('Check results hidden');
		}, 3000);
		
		// Check if complete
		const solution = puzzleData.solution[0];
		let correct = 0;
		for (let i = 0; i < solution.length; i++) {
			if (gameState.userInput[i] === solution[i]) {
				correct++;
			}
		}
		console.log(`Correct letters: ${correct}/${solution.length}`);

		if (correct === solution.length) {
			showingCheckResults = false;
			completeGame();
		}
	}

	function completeGame() {
		stopTimer();
		
		const finalTime = gameState.startTime ? (Date.now() - gameState.startTime) : 0;
		const timeText = formatTime(finalTime);
		const hintText = gameState.hintCount === 0 ? 'no hints' : gameState.hintCount === 1 ? '1 hint' : `${gameState.hintCount} hints`;
		
		gameState.completionText = `Success! Completed in ${timeText}, used ${hintText}.`;
		gameState.isCompleted = true;
		saveProgress();
	}

	function revealSolution() {
		showRevealAlert = true;
	}

	function confirmReveal() {
		const solution = puzzleData.solution[0];
		gameState.userInput = [...solution];
		
		stopTimer();
		
		const finalTime = gameState.startTime ? (Date.now() - gameState.startTime) : 0;
		const timeText = formatTime(finalTime);
		const hintText = gameState.hintCount === 0 ? 'no hints' : gameState.hintCount === 1 ? '1 hint' : `${gameState.hintCount} hints`;
		
		gameState.completionText = `Puzzle revealed after ${timeText}, used ${hintText}.`;
		gameState.isCompleted = true;
		saveProgress();
		showRevealAlert = false;
	}

	function cancelReveal() {
		showRevealAlert = false;
	}

	function clearGrid() {
		gameState.userInput = new Array(puzzleData.grid[0].length).fill('');
		gameState.hintCount = 0;
		gameState.hintRevealed = new Array(puzzleData.grid[0].length).fill(false);
		gameState.isCompleted = false;
		gameState.completionText = '';
		
		localStorage.removeItem(getPuzzleStorageKey());
		
		stopTimer();
		gameState.startTime = Date.now();
		startTimer();
	}

	function useHint() {
		if (gameState.hintCount >= gameState.maxHints) return;
		
		const emptyCells = [];
		for (let i = 0; i < gameState.userInput.length; i++) {
			if (gameState.userInput[i] === '') {
				emptyCells.push(i);
			}
		}
		
		if (emptyCells.length === 0) {
			alert('All cells are already filled!');
			return;
		}
		
		const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
		const solution = puzzleData.solution[0];
		
		gameState.userInput[randomIndex] = solution[randomIndex];
		gameState.hintRevealed[randomIndex] = true;
		gameState.hintCount++;
		
		saveProgress();
		
		showHintFeedback(randomIndex, solution[randomIndex]);
	}

	function showHintFeedback(index, letter) {
		// This would show a toast notification in a real implementation
		console.log(`Hint: ${letter} revealed at position ${index + 1}`);
	}

	function formatTime(milliseconds) {
		const totalSeconds = Math.floor(milliseconds / 1000);
		const mins = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		const ms = Math.floor(milliseconds % 1000);
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
	}
</script>

<div class="max-w-6xl mx-auto">
	<!-- Header -->
	<div class="text-center mb-8">
		<h1 class="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-2" style="font-family: 'Pixelify Sans', monospace; color: #535353;">
			nanoword
		</h1>
		<div class="text-sm sm:text-lg md:text-xl italic text-gray-600 mb-2">/næn.oʊ-wɜː(r)d/</div>
		<div class="text-4xl" style="font-family: 'Libre Franklin', sans-serif; color: #666;">
			{puzzleData.date}
		</div>
	</div>

	<!-- Timer and Controls -->
	<PuzzleTimer 
		{gameState} 
		{formatTime}
		{useHint}
		{checkSolution}
		{clearGrid}
		{revealSolution}
		{saveProgress}
	/>

	<!-- Main Game Area -->
	{#if !gameState.isCompleted}
		<div class="flex flex-col items-center mt-8">
			<!-- Clue -->
			<div class="w-full max-w-2xl mb-8">
				<div class="bg-white rounded-lg p-6 text-center">
					{#if gameState.isMultiWord}
						<div class="text-sm mb-2" style="color: #666; font-family: 'Libre Franklin', sans-serif;">
							Word {gameState.currentWordIndex + 1} of {puzzleData.totalWords}
						</div>
					{/if}
					<div class="text-3xl leading-relaxed" style="font-family: 'Libre Baskerville', serif; color: #535353;">
						{currentWordData().clue}
					</div>
				</div>
			</div>

			<!-- Grid -->
			<PuzzleGrid 
				puzzleData={currentPuzzleData()}
				{gameState}
				{selectedCell}
				{handleCellInput}
				{handleCellSelect}
				{showingCheckResults}
			/>
		</div>
	{/if}

	<!-- Completion Message -->
	{#if gameState.isCompleted}
		<CompletionMessage 
			completionText={gameState.completionText}
			{puzzleData}
			{gameState}
			{formatTime}
		/>
	{/if}

	<!-- Reveal Confirmation Alert -->
	{#if showRevealAlert}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="alert alert-warning max-w-md mx-auto">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<div class="flex-1">
					<h3 class="font-bold">Reveal Answer?</h3>
					<div class="text-sm">Are you sure you want to reveal the entire puzzle? This will end the game.</div>
				</div>
				<div class="flex-none">
					<button class="btn btn-sm btn-ghost" on:click={cancelReveal}>Cancel</button>
					<button class="btn btn-sm btn-warning" on:click={confirmReveal}>Reveal</button>
				</div>
			</div>
		</div>
	{/if}
</div>