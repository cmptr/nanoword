/**
 * Cloudflare Worker for Nanowords Daily Puzzle
 * Serves daily crossword puzzles from KV storage
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Only serve the daily puzzle at the root path
    if (url.pathname === '/' || url.pathname === '') {
      return handleDailyPuzzle(request, env);
    }
    
    // For any other path, redirect to root
    return Response.redirect(url.origin, 301);
  }
};

async function handleDailyPuzzle(request, env) {
  try {
    // Get today's date in America/Chicago timezone
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Chicago'
    });
    
    // Try to get today's puzzle from KV
    const puzzleKey = `puzzle-${today}`;
    let puzzleData = await env.PUZZLES.get(puzzleKey, 'json');
    
    // If no puzzle exists for today, generate one
    if (!puzzleData) {
      console.log(`No puzzle found for ${today}, generating new one...`);
      puzzleData = await generateDailyPuzzle(today);
      
      // Store the generated puzzle in KV
      await env.PUZZLES.put(puzzleKey, JSON.stringify(puzzleData));
      console.log(`Stored puzzle for ${today} in KV`);
    }
    
    // Return the HTML page with the puzzle data
    return new Response(generateHTML(puzzleData), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
    
  } catch (error) {
    console.error('Error handling daily puzzle:', error);
    return new Response(generateErrorHTML(), {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
}

async function generateDailyPuzzle(dateString) {
  // This is a simplified puzzle generator for the worker
  // In a real implementation, you might want to pre-generate puzzles
  // or use a more sophisticated generation algorithm
  
  const words = [
    { word: "DUSK", clue: "Tending to darkness or blackness; moderately dark or black; dusky." },
    { word: "ILLO", clue: "(informal) An illustration." },
    { word: "DOL", clue: "(medicine) The unit of measurement for pain." },
    { word: "SHELL", clue: "A hard external covering of an animal." },
    { word: "NAO", clue: "(nautical, historical, rare) A Spanish or Portuguese carrack." }
  ];
  
  // Simple 5x5 grid with the words arranged
  const grid = [
    [
      { row: 0, col: 0, contents: "", isBlack: false, number: "3", acrossNumber: 1, downNumber: 3 },
      { row: 0, col: 1, contents: "", isBlack: false, number: "", acrossNumber: 1, downNumber: "" },
      { row: 0, col: 2, contents: "", isBlack: false, number: "4", acrossNumber: 1, downNumber: 4 },
      { row: 0, col: 3, contents: "", isBlack: false, number: "", acrossNumber: 1, downNumber: "" },
      { row: 0, col: 4, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" }
    ],
    [
      { row: 1, col: 0, contents: "", isBlack: false, number: "", acrossNumber: "", downNumber: 3 },
      { row: 1, col: 1, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" },
      { row: 1, col: 2, contents: "", isBlack: false, number: "", acrossNumber: "", downNumber: 4 },
      { row: 1, col: 3, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" },
      { row: 1, col: 4, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" }
    ],
    [
      { row: 2, col: 0, contents: "", isBlack: false, number: "", acrossNumber: "", downNumber: 3 },
      { row: 2, col: 1, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" },
      { row: 2, col: 2, contents: "", isBlack: false, number: "", acrossNumber: "", downNumber: 4 },
      { row: 2, col: 3, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" },
      { row: 2, col: 4, contents: "", isBlack: false, number: "5", acrossNumber: "", downNumber: 5 }
    ],
    [
      { row: 3, col: 0, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" },
      { row: 3, col: 1, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" },
      { row: 3, col: 2, contents: "", isBlack: false, number: "", acrossNumber: "", downNumber: 4 },
      { row: 3, col: 3, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" },
      { row: 3, col: 4, contents: "", isBlack: false, number: "", acrossNumber: "", downNumber: 5 }
    ],
    [
      { row: 4, col: 0, contents: "#", isBlack: true, number: "", acrossNumber: "", downNumber: "" },
      { row: 4, col: 1, contents: "", isBlack: false, number: "2", acrossNumber: 2, downNumber: "" },
      { row: 4, col: 2, contents: "", isBlack: false, number: "", acrossNumber: 2, downNumber: 4 },
      { row: 4, col: 3, contents: "", isBlack: false, number: "", acrossNumber: 2, downNumber: "" },
      { row: 4, col: 4, contents: "", isBlack: false, number: "", acrossNumber: 2, downNumber: 5 }
    ]
  ];
  
  const solution = [
    ["D", "U", "S", "K", "#"],
    ["O", "#", "H", "#", "#"],
    ["L", "#", "E", "#", "N"],
    ["#", "#", "L", "#", "A"],
    ["#", "I", "L", "L", "O"]
  ];
  
  const clues = {
    across: [
      { number: 1, clue: words[0].clue, length: 4, answer: words[0].word },
      { number: 2, clue: words[1].clue, length: 4, answer: words[1].word }
    ],
    down: [
      { number: 3, clue: words[2].clue, length: 3, answer: words[2].word },
      { number: 4, clue: words[3].clue, length: 5, answer: words[3].word },
      { number: 5, clue: words[4].clue, length: 3, answer: words[4].word }
    ]
  };
  
  const wordsData = {
    across: [
      {
        number: 1,
        length: 4,
        clue: words[0].clue,
        answer: words[0].word,
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 }
        ]
      },
      {
        number: 2,
        length: 4,
        clue: words[1].clue,
        answer: words[1].word,
        positions: [
          { row: 4, col: 1 },
          { row: 4, col: 2 },
          { row: 4, col: 3 },
          { row: 4, col: 4 }
        ]
      }
    ],
    down: [
      {
        number: 3,
        length: 3,
        clue: words[2].clue,
        answer: words[2].word,
        positions: [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
          { row: 2, col: 0 }
        ]
      },
      {
        number: 4,
        length: 5,
        clue: words[3].clue,
        answer: words[3].word,
        positions: [
          { row: 0, col: 2 },
          { row: 1, col: 2 },
          { row: 2, col: 2 },
          { row: 3, col: 2 },
          { row: 4, col: 2 }
        ]
      },
      {
        number: 5,
        length: 3,
        clue: words[4].clue,
        answer: words[4].word,
        positions: [
          { row: 2, col: 4 },
          { row: 3, col: 4 },
          { row: 4, col: 4 }
        ]
      }
    ]
  };
  
  return {
    date: dateString,
    grid: grid,
    solution: solution,
    clues: clues,
    words: wordsData
  };
}

function generateHTML(puzzleData) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <title>nanoword</title>
    <style>
      .daily-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .puzzle-header {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .puzzle-date {
        font-size: 1.2rem;
        color: #666;
        margin-top: 10px;
      }
      
      .loading {
        text-align: center;
        padding: 50px;
        font-size: 1.2rem;
        color: #666;
      }
      
      .error {
        text-align: center;
        padding: 50px;
        color: #d32f2f;
        background: #ffebee;
        border: 1px solid #ffcdd2;
        border-radius: 8px;
        margin: 20px;
      }
      
      .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        margin: 20px 0;
        padding: 15px 0;
        border-top: 1px solid black;
        border-bottom: 1px solid black;
        background: transparent;
        box-shadow: none;
        width: 100%;
      }
      
      .timer-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .timer-label {
        font-size: 1rem;
        color: #666;
      }
      
      .timer-display {
        font-size: 1.2rem;
        font-weight: bold;
        color: #1976d2;
      }
      
      .hint-counter {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-left: 20px;
      }
      
      .hint-label {
        font-size: 0.9rem;
        color: #666;
      }
      
      #hintCount {
        font-size: 1rem;
        font-weight: bold;
        color: #f57c00;
        background-color: #fff3e0;
        padding: 2px 8px;
        border-radius: 4px;
        min-width: 20px;
        text-align: center;
      }
      
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-family: "Libre Franklin", sans-serif;
        font-weight: 600;
        text-transform: uppercase;
        transition: all 0.3s ease;
      }
      
      .btn-primary {
        background: linear-gradient(rgb(1, 94, 89), rgb(1, 67, 70));
        color: white;
      }
      
      .btn-primary:hover {
        background: linear-gradient(rgb(1, 77, 73), rgb(1, 49, 51));
      }
      
      .btn-secondary {
        background: linear-gradient(rgb(61, 61, 61), rgb(15, 15, 15));
        color: #eee;
      }
      
      .btn-secondary:hover {
        background: linear-gradient(rgb(75, 75, 75), rgb(32, 32, 32));
      }
      
      .content-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .puzzle-main {
        display: flex;
        gap: 40px;
        align-items: flex-start;
        width: 100%;
        justify-content: center;
        margin-top: 20px;
      }
      
      .table-container {
        display: flex;
        flex-direction: column;
        width: auto;
      }
      
      table {
        border: 4px solid #535353;
        background-color: #535353;
        text-align: center;
        cursor: pointer;
        width: 600px;
        height: 600px;
        min-width: 600px;
        min-height: 600px;
        margin-right: 60px;
        margin-left: 60px;
      }
      
      td {
        height: 50px;
        width: 50px;
        border: 1px solid #535353;
        background-color: white;
        padding: 0px;
        display: table-cell;
        position: relative;
      }
      
      td .contents {
        text-align: center;
        font-size: 30px;
        font-weight: bold;
        padding: auto;
        width: 100%;
        z-index: 0;
        pointer-events: none;
        font-family: "Libre Franklin", sans-serif;
      }
      
      td .number {
        position: absolute;
        top: 0;
        left: 0.3rem;
        font-size: 42px;
        height: 10px;
        z-index: 5;
        pointer-events: none;
        font-family: "Libre Franklin", sans-serif;
        font-weight: 600;
      }
      
      .puzzle-info {
        font-size: 12px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-self: flex-start;
        height: min-content;
        min-height: 600px;
        width: 400px;
        border-radius: 0.5rem;
        padding: 2rem;
        background: white;
        gap: 2rem;
      }
      
      .clues-section {
        flex: 1;
      }
      
      .clues-section h3 {
        font-size: 1.9rem;
        font-weight: bold;
        margin-bottom: 1rem;
        font-family: "Libre Franklin", sans-serif;
        color: black;
        border-bottom: 2px solid black;
        padding-bottom: 5px;
      }
      
      .line-break {
        width: 100%;
        height: 0.2rem;
        background-color: black;
        margin-bottom: 1rem;
      }
      
      .clue-item {
        margin-top: 1rem;
        margin-bottom: 1rem;
        font-size: 1.2rem;
        font-family: "Libre Franklin", sans-serif;
      }
      
      .clue-number {
        font-weight: bold;
        color: black;
        margin-right: 8px;
      }
      
      .clue-text {
        color: black;
      }
      
      .clue-length {
        color: black;
        font-size: 0.9rem;
        margin-left: 8px;
      }
      
      td.selected {
        background-color: #e3f2fd !important;
        border: 2px solid #1976d2 !important;
      }
      
      td:focus {
        outline: none;
      }
      
      td.hint-revealed .contents {
        color: #f57c00;
        font-weight: bold;
        background-color: #fff8e1;
        border-radius: 3px;
        padding: 1px 3px;
      }
      
      .pronunciation {
        font-size: 1.2rem;
        font-style: italic;
        color: #666;
        font-weight: 400;
        text-align: center;
        margin-top: 5px;
      }
      
      .text-button {
        background: none !important;
        border: none !important;
        color: black;
        font-size: 1.5rem;
        font-weight: 700;
        cursor: pointer;
        padding: 10px 15px;
        text-decoration: none;
        font-family: "Libre Franklin", sans-serif;
        box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
        transition: color 0.3s ease;
      }
      
      .text-button:hover {
        color: #333;
        background-color: #f0f0f0;
        border-radius: 4px;
      }
      
      .text-button:disabled {
        color: #999;
        cursor: not-allowed;
        background-color: transparent;
      }
      
      /* Override any potential Tailwind or browser defaults */
      .controls button,
      .controls .text-button,
      .flex.gap-4 button {
        box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
        background: none !important;
        border: none !important;
        outline: none !important;
        font-family: "Libre Franklin", sans-serif !important;
        font-weight: 700 !important;
      }
      
      @media screen and (max-width: 1400px) {
        .puzzle-main {
          flex-direction: column;
          align-items: center;
        }

        .puzzle-info {
          margin-top: 3rem;
          width: 140%;
          align-self: center;
          margin-right: 0rem;
          flex-direction: row;
          min-height: min-content;
          margin-bottom: 4rem;
        }

        .clues-section {
          margin-right: 4rem;
          min-width: 35%;
        }
      }

      @media screen and (max-width: 1050px) {
        .puzzle-info {
          width: 110%;
        }
      }

      @media screen and (max-width: 850px) {
        .puzzle-info {
          width: 60rem;
        }
      }

      @media screen and (max-width: 750px) {
        .puzzle-info {
          font-size: 12px;
          word-wrap: break-word;
          width: 47.2rem;
          padding: 0px 2rem;
        }

        .clues-section {
          margin: 10px;
        }
      }

      @media screen and (max-width: 550px) {
        .puzzle-info {
          margin-top: 1rem;
        }

        .clues-section {
          margin: 10px;
        }
      }

      @media screen and (max-width: 1250px) {
        td {
          height: 45px;
          width: 45px;
          min-height: 45px;
          min-width: 45px;
        }
        
        td .number {
          font-size: 36px;
        }
      }
      
      @media screen and (max-width: 750px) {
        .puzzle-main {
          flex-direction: column;
          align-items: center;
        }

        .puzzle-info {
          margin-top: 3rem;
          width: 100%;
          align-self: center;
          margin-right: 0rem;
          flex-direction: row;
          min-height: min-content;
          margin-bottom: 4rem;
        }

        .clues-section {
          margin-right: 4rem;
          min-width: 35%;
        }
        
        .table-container {
          width: 100%;
        }

        table {
          height: 45rem;
          width: 45rem;
          max-height: 45rem;
          min-height: 45rem;
          max-width: 45rem;
          min-width: 45rem;
          margin: 0 auto;
        }
        
        td .contents {
          font-size: 2rem;
        }
      }

      @media screen and (max-width: 550px) {
        td {
          width: 2.5rem;
          height: 2.5rem;
          min-width: 25px;
          min-height: 25px;
        }
        
        td .number {
          font-size: 24px;
        }
        
        td .contents {
          font-size: 1.7rem;
        }
        
        .puzzle-info {
          margin-top: 1rem;
        }
      }

      @media screen and (max-width: 500px) {
        table {
          width: 30rem;
          height: 30rem;
          min-width: 30rem;
          max-width: 30rem;
          min-height: 30rem;
          max-height: 30rem;
        }
        
        .puzzle-info {
          width: 30rem;
        }
        
        td .contents {
          font-size: 1.4rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="daily-container">
      <div class="puzzle-header">
        <h1>
          <span class="title-word">nanoword</span>
        </h1>
        <div class="pronunciation">/næn.oʊ-/</div>
        <div class="puzzle-date" id="puzzleDate">${puzzleData.date}</div>
      </div>

      <div id="puzzleContent">
        <div class="content-container">
          <div class="controls">
            <div class="timer-container">
              <div class="timer-label">Time:</div>
              <div class="timer-display" id="timer">00:00</div>
              <div class="hint-counter">
                <span class="hint-label">Hints:</span>
                <span id="hintCount">0</span>
              </div>
            </div>
            <div class="flex gap-4" style="box-shadow: none !important; background: transparent !important;">
              <button id="hintBtn" class="text-button">Hint</button>
              <button id="checkBtn" class="text-button">Check</button>
              <button id="clearBtn" class="text-button">Clear</button>
              <button id="revealBtn" class="text-button">Reveal</button>
            </div>
          </div>
          
          <div class="puzzle-main">
            <div class="table-container">
              <table id="puzzleGrid">
                <!-- Grid will be generated here -->
              </table>
            </div>
            
            <div class="puzzle-info">
              <div class="clues-section">
                <h3>Across</h3>
                <div class="line-break"></div>
                <div id="acrossClues">
                  <!-- Across clues will be populated here -->
                </div>
              </div>
              
              <div class="clues-section">
                <h3>Down</h3>
                <div class="line-break"></div>
                <div id="downClues">
                  <!-- Down clues will be populated here -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="message" id="completionMessage" style="display: none;">
        <h2>🎉 Congratulations! You've completed today's nanoword puzzle!</h2>
      </div>
    </div>

    <script
      src="https://code.jquery.com/jquery-3.6.0.min.js"
      integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
      crossorigin="anonymous"
    ></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      const puzzleData = ${JSON.stringify(puzzleData)};
      let timerInterval = null;
      let startTime = null;
      let isTimerRunning = false;
      let hintCount = 0;
      let maxHints = 10;

      // Timer functionality
      function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
      }

      function updateTimer() {
        if (!startTime || !isTimerRunning) return;
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('timer').textContent = formatTime(elapsed);
      }

      function startTimer() {
        if (isTimerRunning) return;
        
        startTime = Date.now();
        isTimerRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
      }

      function stopTimer() {
        if (!isTimerRunning) return;
        
        isTimerRunning = false;
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }

      function displayPuzzle() {
        // Generate grid
        generateGrid();
        
        // Display clues
        displayClues();
        
        // Start timer
        startTimer();
        
        // Select first available cell
        setTimeout(() => {
          const firstCell = document.querySelector('td:not([style*="background-color"])');
          if (firstCell) {
            const row = parseInt(firstCell.dataset.row);
            const col = parseInt(firstCell.dataset.col);
            selectCell(row, col);
          }
        }, 100);
        
        // Setup event listeners
        setupEventListeners();
      }

      function generateGrid() {
        const grid = puzzleData.grid;
        const table = document.getElementById('puzzleGrid');
        table.innerHTML = '';

        for (let i = 0; i < grid.length; i++) {
          const row = document.createElement('tr');
          row.id = i;
          
          for (let j = 0; j < grid[i].length; j++) {
            const cell = document.createElement('td');
            const cellData = grid[i][j];
            
            if (cellData.isBlack) {
              cell.style.backgroundColor = '#535353';
            } else {
              cell.innerHTML = \`
                <div class="number">\${cellData.number || ''}</div>
                <div class="contents"></div>
              \`;
              cell.tabIndex = 0; // Make cell focusable
              cell.dataset.row = i;
              cell.dataset.col = j;
              cell.addEventListener('click', (e) => {
                e.preventDefault();
                selectCell(i, j);
              });
              cell.addEventListener('keydown', handleCellKeydown);
            }
            
            row.appendChild(cell);
          }
          
          table.appendChild(row);
        }
      }

      function displayClues() {
        // Display across clues
        const acrossClues = document.getElementById('acrossClues');
        acrossClues.innerHTML = '';
        
        puzzleData.clues.across.forEach(clue => {
          const clueDiv = document.createElement('div');
          clueDiv.className = 'clue-item';
          clueDiv.innerHTML = \`
            <span class="clue-number">\${clue.number}.</span>
            <span class="clue-text">\${clue.clue}</span>
            <span class="clue-length">(\${clue.length})</span>
          \`;
          acrossClues.appendChild(clueDiv);
        });

        // Display down clues
        const downClues = document.getElementById('downClues');
        downClues.innerHTML = '';
        
        puzzleData.clues.down.forEach(clue => {
          const clueDiv = document.createElement('div');
          clueDiv.className = 'clue-item';
          clueDiv.innerHTML = \`
            <span class="clue-number">\${clue.number}.</span>
            <span class="clue-text">\${clue.clue}</span>
            <span class="clue-length">(\${clue.length})</span>
          \`;
          downClues.appendChild(clueDiv);
        });
      }

      function selectCell(row, col) {
        // Remove focus from all cells
        document.querySelectorAll('td').forEach(cell => {
          cell.classList.remove('selected');
        });
        
        const cell = document.querySelector(\`tr[id="\${row}"] td:nth-child(\${col + 1})\`);
        if (cell && !cell.style.backgroundColor) {
          cell.classList.add('selected');
          cell.focus();
        }
      }

      function handleCellKeydown(e) {
        const cell = e.target;
        const contents = cell.querySelector('.contents');
        
        if (e.key.match(/^[a-zA-Z]$/)) {
          e.preventDefault();
          contents.textContent = e.key.toUpperCase();
          
          // Move to next cell (across)
          moveToNextCell(cell, 1);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (contents.textContent === '') {
            // Move to previous cell and clear it
            moveToNextCell(cell, -1);
          } else {
            contents.textContent = '';
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          moveToNextCell(cell, 1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          moveToNextCell(cell, -1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveToCellBelow(cell);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveToCellAbove(cell);
        }
      }

      function moveToNextCell(currentCell, direction) {
        const currentRow = parseInt(currentCell.dataset.row);
        const currentCol = parseInt(currentCell.dataset.col);
        
        let nextCol = currentCol + direction;
        let nextRow = currentRow;
        
        // Handle wrapping to next/previous row
        if (nextCol < 0) {
          nextRow = Math.max(0, currentRow - 1);
          nextCol = 4; // Last column
        } else if (nextCol > 4) {
          nextRow = Math.min(4, currentRow + 1);
          nextCol = 0; // First column
        }
        
        const nextCell = document.querySelector(\`tr[id="\${nextRow}"] td:nth-child(\${nextCol + 1})\`);
        if (nextCell && !nextCell.style.backgroundColor) {
          nextCell.focus();
          selectCell(nextRow, nextCol);
        }
      }

      function moveToCellBelow(currentCell) {
        const currentRow = parseInt(currentCell.dataset.row);
        const currentCol = parseInt(currentCell.dataset.col);
        const nextRow = Math.min(4, currentRow + 1);
        
        const nextCell = document.querySelector(\`tr[id="\${nextRow}"] td:nth-child(\${currentCol + 1})\`);
        if (nextCell && !nextCell.style.backgroundColor) {
          nextCell.focus();
          selectCell(nextRow, currentCol);
        }
      }

      function moveToCellAbove(currentCell) {
        const currentRow = parseInt(currentCell.dataset.row);
        const currentCol = parseInt(currentCell.dataset.col);
        const nextRow = Math.max(0, currentRow - 1);
        
        const nextCell = document.querySelector(\`tr[id="\${nextRow}"] td:nth-child(\${currentCol + 1})\`);
        if (nextCell && !nextCell.style.backgroundColor) {
          nextCell.focus();
          selectCell(nextRow, currentCol);
        }
      }

      function checkSolution() {
        const grid = puzzleData.grid;
        const solution = puzzleData.solution;
        let correct = 0;
        let total = 0;
        let hasErrors = false;

        for (let i = 0; i < grid.length; i++) {
          for (let j = 0; j < grid[i].length; j++) {
            if (!grid[i][j].isBlack) {
              total++;
              const cell = document.querySelector(\`tr[id="\${i}"] td:nth-child(\${j + 1})\`);
              const userInput = cell.children[1].textContent.toUpperCase();
              const correctAnswer = solution[i][j];
              
              if (userInput === correctAnswer) {
                correct++;
                cell.style.border = '2px solid green';
              } else if (userInput !== '') {
                cell.style.border = '2px solid red';
                hasErrors = true;
              }
            }
          }
        }

        const percentage = Math.round((correct / total) * 100);
        alert(\`Progress: \${correct}/\${total} letters correct (\${percentage}%)\`);

        if (correct === total) {
          stopTimer();
          document.getElementById('completionMessage').style.display = 'block';
        }
      }

      function revealAnswers() {
        const grid = puzzleData.grid;
        const solution = puzzleData.solution;
        
        for (let i = 0; i < grid.length; i++) {
          for (let j = 0; j < grid[i].length; j++) {
            if (!grid[i][j].isBlack) {
              const cell = document.querySelector(\`tr[id="\${i}"] td:nth-child(\${j + 1})\`);
              cell.children[1].textContent = solution[i][j];
              cell.style.border = '2px solid green';
            }
          }
        }
        
        stopTimer();
        document.getElementById('completionMessage').style.display = 'block';
      }
      
      function revealSolution() {
        if (confirm('Are you sure you want to reveal the entire puzzle? This will end the game.')) {
          revealAnswers();
          
          // Disable all buttons
          document.getElementById('hintBtn').disabled = true;
          document.getElementById('checkBtn').disabled = true;
          document.getElementById('revealBtn').disabled = true;
        }
      }

      function clearGrid() {
        const grid = puzzleData.grid;
        
        for (let i = 0; i < grid.length; i++) {
          for (let j = 0; j < grid[i].length; j++) {
            if (!grid[i][j].isBlack) {
              const cell = document.querySelector(\`tr[id="\${i}"] td:nth-child(\${j + 1})\`);
              cell.children[1].textContent = '';
              cell.style.border = '1px solid black';
            }
          }
        }
      }

      function updateHintCounter() {
        document.getElementById('hintCount').textContent = hintCount;
        const hintBtn = document.getElementById('hintBtn');
        if (hintCount >= maxHints) {
          hintBtn.disabled = true;
          hintBtn.textContent = 'No Hints Left';
        } else {
          hintBtn.disabled = false;
          hintBtn.textContent = \`Hint (\${maxHints - hintCount} left)\`;
        }
      }
      
      function setupEventListeners() {
        document.getElementById('hintBtn').addEventListener('click', useHint);
        document.getElementById('checkBtn').addEventListener('click', checkSolution);
        document.getElementById('clearBtn').addEventListener('click', clearGrid);
        document.getElementById('revealBtn').addEventListener('click', revealSolution);
      }
      
      function useHint() {
        if (hintCount >= maxHints) return;
        
        // Get all empty cells that aren't black
        const emptyCells = [];
        const grid = puzzleData.grid;
        
        for (let i = 0; i < grid.length; i++) {
          for (let j = 0; j < grid[i].length; j++) {
            const cell = document.querySelector(\`tr[id="\${i}"] td:nth-child(\${j + 1})\`);
            const contents = cell.querySelector('.contents');
            if (!grid[i][j].isBlack && contents.textContent === '') {
              emptyCells.push({ row: i, col: j, cell: cell, contents: contents });
            }
          }
        }
        
        if (emptyCells.length === 0) {
          alert('All cells are already filled!');
          return;
        }
        
        // Pick a random empty cell
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const solution = puzzleData.solution;
        
        // Fill in the correct letter
        const correctLetter = solution[randomCell.row][randomCell.col];
        randomCell.contents.textContent = correctLetter;
        
        // Add hint styling
        randomCell.cell.classList.add('hint-revealed');
        
        // Increment hint counter
        hintCount++;
        updateHintCounter();
        
        // Show feedback
        showHintFeedback(randomCell.row, randomCell.col, correctLetter);
      }
      
      function showHintFeedback(row, col, letter) {
        // Create a temporary feedback element
        const feedback = document.createElement('div');
        feedback.textContent = \`Hint: \${letter} revealed at \${String.fromCharCode(65 + row)}\${col + 1}\`;
        feedback.style.cssText = \`
          position: fixed;
          top: 20px;
          right: 20px;
          background: #fff3e0;
          color: #f57c00;
          padding: 10px 15px;
          border-radius: 6px;
          border: 1px solid #ffb74d;
          z-index: 1000;
          font-size: 0.9rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        \`;
        
        document.body.appendChild(feedback);
        
        // Remove after 3 seconds
        setTimeout(() => {
          if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
          }
        }, 3000);
      }

      // Display puzzle when page loads
      document.addEventListener('DOMContentLoaded', displayPuzzle);
    </script>
  </body>
</html>`;
}

function generateErrorHTML() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>nanoword - Error</title>
  </head>
  <body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
      <h1>nanoword</h1>
      <h2>❌ Error loading puzzle</h2>
      <p>Sorry, there was an error loading today's puzzle. Please try again later.</p>
    </div>
  </body>
</html>`;
}
