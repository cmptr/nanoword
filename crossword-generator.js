const fetch = require('node-fetch');

class CrosswordGenerator {
  constructor() {
    this.gridSize = 5;
    this.grid = [];
    this.words = { across: [], down: [] };
    this.dailySeed = null;
    this.disallowedWords = [
      "bitch", "sex", "cum", "homo", "ass", "lie", "eff", "effed", "anus", "ed", "eds"
    ];
    this.commonLetters = [
      "t", "l", "d", "e", "i", "s", "r", "a", "o", "y", "p", "c", "n", "m"
    ];
  }

  setDailySeed(dateString) {
    // Create a deterministic seed based on the date
    this.dailySeed = this.hashString(dateString);
    Math.random = this.seededRandom(this.dailySeed);
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  seededRandom(seed) {
    let currentSeed = seed;
    return function() {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  initializeGrid() {
    this.grid = [];
    for (let i = 0; i < this.gridSize; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        this.grid[i][j] = {
          row: i,
          col: j,
          contents: "",
          isBlack: false,
          number: "",
          acrossNumber: "",
          downNumber: "",
          acrossMarked: false,
          downMarked: false,
          above: i > 0 ? this.grid[i - 1]?.[j] : null,
          below: i < this.gridSize - 1 ? null : null,
          prev: j > 0 ? this.grid[i]?.[j - 1] : null,
          next: j < this.gridSize - 1 ? null : null,
          opposite: null
        };
      }
    }

    // Set up relationships
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cell = this.grid[i][j];
        cell.below = i < this.gridSize - 1 ? this.grid[i + 1][j] : null;
        cell.next = j < this.gridSize - 1 ? this.grid[i][j + 1] : null;
        cell.opposite = this.grid[this.gridSize - 1 - i][this.gridSize - 1 - j];
      }
    }
  }

  populateBlackSquares() {
    let blackSqCount = 0;
    const targetBlackSquares = 6;

    while (blackSqCount < targetBlackSquares) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < this.gridSize; j++) {
          const random = Math.random();

          if (random < 0.3) {
            this.grid[i][j].contents = "#";
            this.grid[i][j].isBlack = true;
            this.grid[this.gridSize - 1 - i][this.gridSize - 1 - j].contents = "#";
            this.grid[this.gridSize - 1 - i][this.gridSize - 1 - j].isBlack = true;

            blackSqCount += 2;

            if (blackSqCount > targetBlackSquares - 1) {
              break;
            }
          }
        }
      }
    }

    this.preventBlockedWhiteSquares();
    this.eliminateTwoLetterWords();
    this.reduceLargeBlocks();
    this.preventBlockedWhiteSquares(); // Run again after modifications
  }

  preventBlockedWhiteSquares() {
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const currentCell = this.grid[i][j];

        const blocked =
          (!currentCell.above || currentCell.above.contents === "#") &&
          (!currentCell.below || currentCell.below.contents === "#") &&
          (!currentCell.prev || currentCell.prev.contents === "#") &&
          (!currentCell.next || currentCell.next.contents === "#");

        if (blocked && !currentCell.isBlack) {
          let surrounding = [];

          currentCell.above &&
            surrounding.push([currentCell.above, currentCell.above.opposite]);
          currentCell.below &&
            surrounding.push([currentCell.below, currentCell.below.opposite]);
          currentCell.prev &&
            surrounding.push([currentCell.prev, currentCell.prev.opposite]);
          currentCell.next &&
            surrounding.push([currentCell.next, currentCell.next.opposite]);

          if (surrounding.length > 0) {
            const index = Math.floor(Math.random() * surrounding.length);
            surrounding[index].forEach((gridItem) => {
              gridItem.cell.contents = "";
              gridItem.cell.isBlack = false;
            });
          }
        }
      }
    }
  }

  eliminateTwoLetterWords() {
    // Process rows left to right, top to bottom
    for (let i = 0; i < this.gridSize; i++) {
      let letterCount = 0;
      for (let j = 0; j < this.gridSize; j++) {
        letterCount = this.processTwoLetterWords(i, j, "across", letterCount);
      }
    }

    // Process rows right to left, bottom to top
    for (let i = this.gridSize - 1; i >= 0; i--) {
      let letterCount = 0;
      for (let j = this.gridSize - 1; j >= 0; j--) {
        letterCount = this.processTwoLetterWords(i, j, "across", letterCount);
      }
    }

    // Process columns top to bottom, left to right
    for (let j = 0; j < this.gridSize; j++) {
      let letterCount = 0;
      for (let i = 0; i < this.gridSize; i++) {
        letterCount = this.processTwoLetterWords(i, j, "down", letterCount);
      }
    }

    // Process columns bottom to top, right to left
    for (let j = this.gridSize - 1; j >= 0; j--) {
      let letterCount = 0;
      for (let i = this.gridSize - 1; i >= 0; i--) {
        letterCount = this.processTwoLetterWords(i, j, "down", letterCount);
      }
    }
  }

  processTwoLetterWords(i, j, direction, letterCount) {
    const currentCell = direction === "across" ? this.grid[i][j] : this.grid[j][i];

    if (currentCell.contents === "") {
      letterCount++;
    }

    if (letterCount === 2 && currentCell.contents === "#") {
      currentCell.contents = "";
      currentCell.isBlack = false;
      currentCell.opposite.contents = "";
      currentCell.opposite.isBlack = false;
      letterCount = 0;
    }

    if (currentCell.contents === "#") {
      letterCount = 0;
    }

    return letterCount;
  }

  reduceLargeBlocks() {
    for (let i = 1; i < this.gridSize - 1; i++) {
      for (let j = 1; j < this.gridSize - 1; j++) {
        let currentCell = this.grid[i][j];

        let nineSquare = [
          this.grid[i - 1][j - 1],
          currentCell.above,
          this.grid[i - 1][j + 1],
          this.grid[i + 1][j - 1],
          currentCell.below,
          this.grid[i + 1][j + 1],
          currentCell.prev,
          currentCell.next,
          currentCell,
        ];

        let whiteSquareCount = 0;

        nineSquare.forEach((square) => {
          square.contents !== "#" && whiteSquareCount++;
        });

        if (whiteSquareCount > 7) {
          currentCell.contents = "#";
          currentCell.isBlack = true;
          currentCell.opposite.contents = "#";
          currentCell.opposite.isBlack = true;
        }
      }
    }
  }

  buildWordsAndNumbers() {
    this.words = { across: [], down: [] };
    let numberCount = 1;
    let totalWords = 0;
    const maxWords = 10;

    // First pass: process across words
    for (let i = 0; i < this.gridSize; i++) {
      if (totalWords >= maxWords) break;
      let wordAdded = false;

      for (let j = 0; j < this.gridSize; j++) {
        if (totalWords >= maxWords) break;
        let current = this.grid[i][j];

        if (current.contents === "#") {
          current.acrossMarked = true;
          current.downMarked = true;
        }

        if (current.acrossMarked === true && current.downMarked === true) {
          continue;
        }

        // Mark across words
        if (!current.acrossMarked) {
          if (this.grid[i][j + 1] && this.grid[i][j + 1].contents !== "#") {
            current.number = numberCount.toString();
            current.acrossNumber = numberCount;

            let wordLength = 1;
            for (let x = 1; x < this.gridSize - j; x++) {
              let next = this.grid[i][j + x];
              if (!next || next.contents === "#") {
                break;
              }
              next.acrossMarked = true;
              next.acrossNumber = numberCount;
              wordLength++;
            }

            if (wordLength > 1) {
              const word = {
                number: numberCount,
                length: wordLength,
                clue: "",
                answer: "",
                positions: []
              };

              for (let z = 0; z < wordLength; z++) {
                word.positions.push({ row: i, col: j + z });
              }

              this.words.across.push(word);
              wordAdded = true;
            }
          }
        }

        if (wordAdded) {
          wordAdded = false;
          numberCount++;
          totalWords++;
        }
      }
    }

    // Second pass: process down words
    for (let i = 0; i < this.gridSize; i++) {
      if (totalWords >= maxWords) break;
      let wordAdded = false;

      for (let j = 0; j < this.gridSize; j++) {
        if (totalWords >= maxWords) break;
        let current = this.grid[i][j];

        if (current.contents === "#") {
          current.acrossMarked = true;
          current.downMarked = true;
        }

        if (current.acrossMarked === true && current.downMarked === true) {
          continue;
        }

        // Mark down words only in second pass
        if (!current.downMarked) {
          if (this.grid[i + 1] && this.grid[i + 1][j] && this.grid[i + 1][j].contents !== "#") {
            current.number = numberCount.toString();
            current.downNumber = numberCount;

            let wordLength = 1;
            for (let x = 1; x < this.gridSize - i; x++) {
              if (!this.grid[i + x] || this.grid[i + x][j].contents === "#") {
                break;
              }
              let next = this.grid[i + x][j];
              next.downMarked = true;
              next.downNumber = numberCount;
              wordLength++;
            }

            if (wordLength > 1) {
              const word = {
                number: numberCount,
                length: wordLength,
                clue: "",
                answer: "",
                positions: []
              };

              for (let z = 0; z < wordLength; z++) {
                word.positions.push({ row: i + z, col: j });
              }

              this.words.down.push(word);
              wordAdded = true;
            }
          }
        }

        if (wordAdded) {
          wordAdded = false;
          numberCount++;
          totalWords++;
        }
      }
    }
  }

  validateWord(result, targetLength) {
    if (!result || !result.word) return true;

    return (
      !result.defs ||
      result.word.length !== targetLength ||
      result.word.match(" ") ||
      result.word.match(/[0-9]/) ||
      result.word.match(/["!£$%&:-@/<>]/) ||
      this.disallowedWords.includes(result.word.toLowerCase())
    );
  }

  async getNewWord(searchParams) {
    try {
      const response = await fetch(
        `https://api.datamuse.com/words?sp=${searchParams}&md=df`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (err) {
      console.warn("API call failed:", err.message);
      return [];
    }
  }

  async generateWordsAndClues() {
    // Fill across words first
    for (let word of this.words.across) {
      await this.fillWord(word, 'across');
    }

    // Fill down words
    for (let word of this.words.down) {
      await this.fillWord(word, 'down');
    }
  }

  canPlaceWord(word, candidateWord) {
    // Check if the candidate word can be placed without conflicts
    for (let i = 0; i < word.positions.length; i++) {
      const pos = word.positions[i];
      
      // Validate grid bounds
      if (pos.row < 0 || pos.row >= this.gridSize || pos.col < 0 || pos.col >= this.gridSize) {
        return false;
      }
      
      const cell = this.grid[pos.row][pos.col];
      if (!cell) {
        return false;
      }
      
      const letter = candidateWord[i].toUpperCase();
      
      // If there's already a letter in this cell, it must match
      if (cell.contents && cell.contents !== "" && cell.contents !== letter) {
        return false;
      }
    }
    return true;
  }

  async fillWord(word, direction) {
    const len = word.length;
    let queryParams = "?".repeat(len);

    // Try to use intersecting letters
    word.positions.forEach((pos, index) => {
      const cell = this.grid[pos.row][pos.col];
      if (cell.contents && cell.contents !== "") {
        queryParams = queryParams.substring(0, index) + cell.contents.toLowerCase() + queryParams.substring(index + 1);
      }
    });

    // If no intersecting letters, add a common letter
    if (queryParams === "?".repeat(len)) {
      const randomIndex = Math.floor(Math.random() * queryParams.length);
      const randomLetter = this.commonLetters[Math.floor(Math.random() * this.commonLetters.length)];
      queryParams = queryParams.substring(0, randomIndex) + randomLetter + queryParams.substring(randomIndex + 1);
    }

    let retrievedWordList = await this.getNewWord(queryParams);

    if (retrievedWordList.length === 0) {
      // Fallback to simple words
      const fallbackWords = {
        3: ["cat", "dog", "sun", "car", "hat", "cup", "box", "pen"],
        4: ["love", "time", "home", "book", "tree", "bird", "fish", "hand"],
        5: ["happy", "world", "light", "water", "music", "dream", "peace", "heart"]
      };

        const fallback = fallbackWords[len] || ["word"];
        
        // Try fallback words until we find one that fits
        let selectedFallback = null;
        for (let fallbackWord of fallback) {
          if (this.canPlaceWord(word, fallbackWord)) {
            selectedFallback = fallbackWord;
            break;
          }
        }
        
        // If no fallback fits, use the first one anyway (with warning)
        if (!selectedFallback) {
          selectedFallback = fallback[0];
          console.warn(`Fallback word '${selectedFallback}' may cause intersection conflicts`);
        }

        word.answer = selectedFallback.toUpperCase();
        word.clue = "A simple word for the crossword puzzle";
    } else {
      // Shuffle and find a suitable word
      const shuffledWordList = retrievedWordList.sort((a, b) => Math.random() - 0.5);

      let retrievedWord = null;
      for (let candidate of shuffledWordList) {
        if (!this.validateWord(candidate, len) && this.canPlaceWord(word, candidate.word)) {
          retrievedWord = candidate;
          break;
        }
      }

      if (!retrievedWord) {
        // Use fallback
        const fallbackWords = {
          3: ["cat", "dog", "sun", "car", "hat", "cup", "box", "pen"],
          4: ["love", "time", "home", "book", "tree", "bird", "fish", "hand"],
          5: ["happy", "world", "light", "water", "music", "dream", "peace", "heart"]
        };
        const fallback = fallbackWords[len] || ["word"];
        
        // Try fallback words until we find one that fits
        let selectedFallback = null;
        for (let fallbackWord of fallback) {
          if (this.canPlaceWord(word, fallbackWord)) {
            selectedFallback = fallbackWord;
            break;
          }
        }
        
        // If no fallback fits, use the first one anyway (with warning)
        if (!selectedFallback) {
          selectedFallback = fallback[0];
          console.warn(`Fallback word '${selectedFallback}' may cause intersection conflicts`);
        }
        
        retrievedWord = {
          word: selectedFallback,
          defs: ["n\tA simple word for the crossword puzzle"]
        };
      }

      word.answer = retrievedWord.word.toUpperCase();
      
      // Get clue from definitions
      if (retrievedWord.defs && retrievedWord.defs.length > 0) {
        word.clue = retrievedWord.defs[0].split('\t')[1] || "A crossword word";
      } else {
        word.clue = "A crossword word";
      }
    }

    // Fill the word in the grid, but validate intersections first
    for (let i = 0; i < word.positions.length; i++) {
      const pos = word.positions[i];
      
      // Validate grid bounds
      if (pos.row < 0 || pos.row >= this.gridSize || pos.col < 0 || pos.col >= this.gridSize) {
        console.warn(`Invalid position: [${pos.row}][${pos.col}]`);
        continue;
      }
      
      const cell = this.grid[pos.row][pos.col];
      if (!cell) {
        console.warn(`Cell not found at position: [${pos.row}][${pos.col}]`);
        continue;
      }
      
      const letter = word.answer[i];
      
      // Check if there's already a letter in this cell
      if (cell.contents && cell.contents !== "") {
        // If the existing letter doesn't match, we have a conflict
        if (cell.contents !== letter) {
          console.warn(`Intersection conflict: cell [${pos.row}][${pos.col}] has '${cell.contents}' but word needs '${letter}'`);
          // For now, we'll overwrite, but this indicates a problem with word selection
          // TODO: Implement better word selection that avoids conflicts
        }
      }
      
      cell.contents = letter;
    }
  }

  generateSolution() {
    const solution = [];
    for (let i = 0; i < this.gridSize; i++) {
      solution[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        solution[i][j] = this.grid[i][j].contents;
      }
    }
    return solution;
  }

  formatForCLI() {
    // Create a clean grid without circular references
    const cleanGrid = [];
    for (let i = 0; i < this.gridSize; i++) {
      cleanGrid[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        const cell = this.grid[i][j];
        cleanGrid[i][j] = {
          row: cell.row,
          col: cell.col,
          contents: cell.contents,
          isBlack: cell.isBlack,
          number: cell.number,
          acrossNumber: cell.acrossNumber,
          downNumber: cell.downNumber
        };
      }
    }

    return {
      date: this.getDateString(),
      grid: cleanGrid,
      words: {
        across: this.words.across.map(w => ({
          number: w.number,
          length: w.length,
          clue: w.clue,
          answer: w.answer,
          positions: w.positions
        })),
        down: this.words.down.map(w => ({
          number: w.number,
          length: w.length,
          clue: w.clue,
          answer: w.answer,
          positions: w.positions
        }))
      },
      solution: this.generateSolution(),
      clues: {
        across: this.words.across.map(w => ({
          number: w.number,
          clue: w.clue,
          length: w.length,
          answer: w.answer
        })),
        down: this.words.down.map(w => ({
          number: w.number,
          clue: w.clue,
          length: w.length,
          answer: w.answer
        }))
      }
    };
  }

  getDateString() {
    // Use America/Chicago timezone for consistency
    return new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Chicago'
    });
  }

  async generatePuzzle() {
    this.initializeGrid();
    this.populateBlackSquares();
    this.buildWordsAndNumbers();
    await this.generateWordsAndClues();
    
    return this.formatForCLI();
  }
}

module.exports = { CrosswordGenerator };
