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
      puzzleData = await generateDailyPuzzle(today, env);
      
      // Store the generated puzzle in KV
      await env.PUZZLES.put(puzzleKey, JSON.stringify(puzzleData));
      console.log(`Stored puzzle for ${today} in KV`);
    } else {
      console.log(`Using cached puzzle for ${today}`);
    }
    
    // Return the HTML page with the puzzle data
    return new Response(generateHTML(puzzleData), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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

async function generateDailyPuzzle(dateString, env) {
  try {
    // Fetch RSS feed from memeorandum
    const rssResponse = await fetch('https://www.memeorandum.com/feed.xml');
    const rssText = await rssResponse.text();
    
    // Parse RSS feed to extract headlines and descriptions
    const headlines = parseRSSFeed(rssText);
    
    // Analyze with Cloudflare Llama3 worker
    const analysisResult = await analyzeWithLlama3(headlines, env);
    
    // Extract word and clue from the analysis
    const { word, clue } = analysisResult;
    const wordLength = word.length;
    
    // Create a single row grid for the word
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
    
    const solution = [word.split('')];
    
    const clues = {
      across: [
        { number: 1, clue: clue, length: wordLength, answer: word }
      ],
      down: []
    };
    
    const wordsData = {
      across: [
        {
          number: 1,
          length: wordLength,
          clue: clue,
          answer: word,
          positions: Array.from({ length: wordLength }, (_, col) => ({ row: 0, col: col }))
        }
      ],
      down: []
    };
    
    return {
      date: dateString,
      grid: grid,
      solution: solution,
      clues: clues,
      words: wordsData
    };
  } catch (error) {
    console.error('Error generating puzzle:', error);
    // Fallback to a default word if RSS/LLM fails
    return generateFallbackPuzzle(dateString);
  }
}

function parseRSSFeed(rssText) {
  // Simple RSS parsing to extract headlines and descriptions
  const headlines = [];
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
  const descriptionRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/g;
  
  let titleMatch;
  while ((titleMatch = titleRegex.exec(rssText)) !== null) {
    headlines.push({
      title: titleMatch[1].trim(),
      description: ''
    });
  }
  
  let descMatch;
  let index = 0;
  while ((descMatch = descriptionRegex.exec(rssText)) !== null && index < headlines.length) {
    headlines[index].description = descMatch[1].trim();
    index++;
  }
  
  return headlines.slice(0, 20); // Limit to first 20 items
}

async function analyzeWithLlama3(headlines, env) {
  try {
    // Use Cloudflare AI binding
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a critical dark political satirist. Analyze the provided headlines and descriptions from current news events. Based on the aggregate summary of the overall mood of current events, select a single clever word up to 7 letters that captures the essence of today\'s political climate. Provide both the word and a witty, satirical clue for it. Respond in JSON format: {"word": "WORD", "clue": "Your satirical clue here"}'
        },
        {
          role: 'user',
          content: `Analyze these current headlines and provide a clever word: ${JSON.stringify(headlines)}`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });
    
    const analysis = JSON.parse(response.response);
    
    return {
      word: analysis.word.toUpperCase(),
      clue: analysis.clue
    };
  } catch (error) {
    console.error('Error with Llama3 analysis:', error);
    throw error;
  }
}

function generateFallbackPuzzle(dateString) {
  // Fallback words if RSS/LLM fails
  const fallbackWords = [
    { word: "CHAOS", clue: "Complete disorder and confusion; the current state of affairs." },
    { word: "FARCE", clue: "A comic dramatic work using buffoonery and horseplay; also, a ridiculous situation." },
    { word: "CIRCUS", clue: "A traveling company of performers; also, a chaotic or confused situation." },
    { word: "THEATER", clue: "A building for dramatic performances; also, the dramatic quality of events." },
    { word: "DRAMA", clue: "A composition in prose or verse presenting a story in pantomime or dialogue." },
    { word: "SATIRE", clue: "The use of humor, irony, or exaggeration to criticize people's vices or follies." },
    { word: "COMEDY", clue: "A dramatic work that is light and often humorous in tone." }
  ];
  
  const selectedWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
  const wordLength = selectedWord.word.length;
  
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
  
  const solution = [selectedWord.word.split('')];
  
  const clues = {
    across: [
      { number: 1, clue: selectedWord.clue, length: wordLength, answer: selectedWord.word }
    ],
    down: []
  };
  
  const wordsData = {
    across: [
      {
        number: 1,
        length: wordLength,
        clue: selectedWord.clue,
        answer: selectedWord.word,
        positions: Array.from({ length: wordLength }, (_, col) => ({ row: 0, col: col }))
      }
    ],
    down: []
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
        gap: 10px;
        margin: 20px 0;
        padding: 15px 0;
        border-top: 1px solid #535353;
        border-bottom: 1px solid #535353;
        background: transparent;
        box-shadow: none;
        width: 100%;
        flex-wrap: wrap;
      }
      
      .timer-container {
        display: flex;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
        min-width: 0;
      }
      
      .timer-label {
        font-size: 0.9rem;
        color: #666;
        white-space: nowrap;
      }
      
      .timer-display {
        font-size: 1.1rem;
        font-weight: bold;
        color: #1976d2;
        white-space: nowrap;
      }
      
      .hint-counter {
        display: flex;
        align-items: center;
        gap: 3px;
        margin-left: 10px;
        flex-shrink: 0;
        min-width: 0;
      }
      
      .hint-label {
        font-size: 0.8rem;
        color: #666;
        white-space: nowrap;
      }
      
      #hintCount {
        font-size: 0.9rem;
        font-weight: bold;
        color: #f57c00;
        background-color: #fff3e0;
        padding: 2px 6px;
        border-radius: 4px;
        min-width: 18px;
        text-align: center;
        white-space: nowrap;
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
        flex-direction: column;
        align-items: center;
        width: 100%;
        justify-content: center;
        margin-top: 20px;
      }
      
      .word-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        width: 100%;
        max-width: 100%;
      }
      
      .clue-display {
        text-align: center;
        width: 100%;
        max-width: 600px;
        margin-bottom: 20px;
        padding: 0 20px;
      }
      
      .clue-text {
        font-size: 2.1rem;
        font-family: "Libre Franklin", sans-serif;
        color: #535353;
        line-height: 1.4;
        padding: 20px;
        background: white;
        border-radius: 8px;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      
      .table-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
        padding: 0 10px;
      }
      
      table {
        border: 4px solid #535353 !important;
        background-color: #535353;
        text-align: center;
        cursor: pointer;
        width: auto;
        height: auto;
        min-width: auto;
        min-height: auto;
        margin: 0 auto;
        max-width: 100%;
      }
      
      table#puzzleGrid {
        border: 4px solid #535353 !important;
      }
      
      td {
        height: 125px;
        width: 125px;
        min-width: 60px;
        max-width: 125px;
        border: 1px solid #535353 !important;
        background-color: white;
        padding: 0px;
        display: table-cell;
        position: relative;
      }
      
      table#puzzleGrid td {
        border: 1px solid #535353 !important;
      }
      
      td .contents {
        text-align: center;
        font-size: 75px;
        font-weight: bold;
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
        font-family: "Libre Franklin", sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        caret-color: #1976d2;
      }
      
      td .cell-input {
        text-align: center;
        font-size: 75px;
        font-weight: bold;
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
        font-family: "Libre Franklin", sans-serif;
        outline: none;
        caret-color: #1976d2;
        text-transform: uppercase;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        resize: none;
        -webkit-user-select: text;
        -moz-user-select: text;
        user-select: text;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }
      
      td .cell-input:disabled {
        background-color: #f5f5f5;
        color: #666;
        cursor: not-allowed;
      }
      
      td .number {
        position: absolute;
        top: 0;
        left: 0.3rem;
        font-size: 32.805px;
        height: 10px;
        z-index: 5;
        pointer-events: none;
        font-family: "Libre Franklin", sans-serif;
        font-weight: 400;
        color: #535353;
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
        color: #535353;
        border-bottom: 2px solid #535353;
        padding-bottom: 5px;
      }
      
      .line-break {
        width: 100%;
        height: 0.2rem;
        background-color: #535353;
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
        color: #535353;
        margin-right: 8px;
      }
      
      .clue-text {
        color: #535353;
      }
      
      .clue-length {
        color: #535353;
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
      
      td.hint-revealed .contents,
      td.hint-revealed .cell-input {
        color: #f57c00;
        font-weight: bold;
        background-color: #fff8e1;
        border-radius: 3px;
        padding: 1px 3px;
      }
      
      .title-word {
        color: #535353;
        font-family: "Libre Franklin", sans-serif;
        font-weight: 700;
        font-size: 4rem;
        line-height: 1.1;
        word-wrap: break-word;
        overflow-wrap: break-word;
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
        color: #535353;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        padding: 8px 12px;
        text-decoration: none;
        font-family: "Libre Franklin", sans-serif;
        box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
        transition: color 0.3s ease;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100px;
        flex-shrink: 1;
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
      
      .message {
        text-align: center;
        margin-top: 30px;
        padding: 20px;
      }
      
      .message h2 {
        font-family: "Libre Franklin", sans-serif;
        font-size: 2.1rem;
        font-weight: normal;
        color: #535353;
        margin: 0;
        line-height: 1.4;
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
          height: 100px;
          width: 100px;
          min-height: 100px;
          min-width: 100px;
        }
        
        td .contents,
        td .cell-input {
          font-size: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
      
      @media screen and (max-width: 768px) {
        .daily-container {
          padding: 10px;
        }
        
        .title-word {
          font-size: 3rem;
        }
        
        .pronunciation {
          font-size: 1rem;
        }
        
        .controls {
          flex-direction: column;
          gap: 15px;
          align-items: stretch;
        }
        
        .timer-container {
          justify-content: center;
          margin-bottom: 10px;
        }
        
        .text-button {
          font-size: 1rem;
          padding: 6px 10px;
          max-width: none;
          flex: 1;
          text-align: center;
        }
        
        .clue-text {
          font-size: 1.4rem;
          padding: 15px;
          margin: 0 10px;
        }
        
        .word-container {
          gap: 15px;
        }
        
        .table-container {
          width: 100%;
          overflow-x: hidden;
          padding: 0 10px;
        }
        
        table {
          margin: 0 auto;
          width: auto;
          min-width: fit-content;
        }
        
        td {
          height: 60px;
          width: 60px;
          min-height: 60px;
          min-width: 60px;
        }
        
        td .contents,
        td .cell-input {
          font-size: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      @media screen and (max-width: 480px) {
        .title-word {
          font-size: 2.5rem;
        }
        
        .pronunciation {
          font-size: 0.9rem;
        }
        
        .controls {
          gap: 10px;
          padding: 10px 0;
        }
        
        .timer-container {
          gap: 3px;
        }
        
        .timer-label {
          font-size: 0.8rem;
        }
        
        .timer-display {
          font-size: 1rem;
        }
        
        .hint-label {
          font-size: 0.7rem;
        }
        
        #hintCount {
          font-size: 0.8rem;
          padding: 1px 4px;
        }
        
        .text-button {
          font-size: 0.9rem;
          padding: 5px 8px;
        }
        
        .clue-text {
          font-size: 1.2rem;
          padding: 12px;
          margin: 0 5px;
        }
        
        td {
          height: 50px;
          width: 50px;
          min-height: 50px;
          min-width: 50px;
        }
        
        td .contents,
        td .cell-input {
          font-size: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      @media screen and (max-width: 360px) {
        .title-word {
          font-size: 2rem;
        }
        
        .pronunciation {
          font-size: 0.8rem;
        }
        
        .clue-text {
          font-size: 1rem;
          padding: 10px;
        }
        
        td {
          height: 45px;
          width: 45px;
          min-height: 45px;
          min-width: 45px;
        }
        
        td .contents,
        td .cell-input {
          font-size: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
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
        <div class="pronunciation">/næn.oʊ-wɜː(r)d/</div>
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
            <div class="word-container">
              <div class="clue-display">
                <div class="clue-text" id="wordClue">
                  <!-- Word clue will be populated here -->
                </div>
              </div>
              <div class="table-container">
                <table id="puzzleGrid">
                  <!-- Grid will be generated here -->
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="message" id="completionMessage" style="display: none;">
        <h2 id="completionText">Success!</h2>
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

      // Local storage functions
      function getPuzzleStorageKey() {
        return \`nanoword-progress-\${puzzleData.date}\`;
      }

      function saveProgress() {
        const grid = puzzleData.grid;
        const currentElapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        const progress = {
          date: puzzleData.date,
          cells: [],
          hintCount: hintCount,
          elapsedTime: currentElapsedTime,
          wasTimerRunning: isTimerRunning,
          isCompleted: document.getElementById('completionMessage').style.display === 'block',
          completionText: document.getElementById('completionText').textContent
        };

        // Save cell values
        for (let j = 0; j < grid[0].length; j++) {
          if (!grid[0][j].isBlack) {
            const cell = document.querySelector(\`tr[id="0"] td:nth-child(\${j + 1})\`);
            const input = cell.querySelector('.cell-input');
            progress.cells.push({
              col: j,
              value: input.value,
              isHint: cell.classList.contains('hint-revealed')
            });
          }
        }

        localStorage.setItem(getPuzzleStorageKey(), JSON.stringify(progress));
      }

      function loadProgress() {
        const savedProgress = localStorage.getItem(getPuzzleStorageKey());
        if (!savedProgress) return false;

        try {
          const progress = JSON.parse(savedProgress);
          if (progress.date !== puzzleData.date) return false;

          // Restore cell values
          progress.cells.forEach(cellData => {
            const cell = document.querySelector(\`tr[id="0"] td:nth-child(\${cellData.col + 1})\`);
            const input = cell.querySelector('.cell-input');
            if (input) {
              input.value = cellData.value;
              if (cellData.isHint) {
                cell.classList.add('hint-revealed');
              }
            }
          });

          // Restore hint count
          hintCount = progress.hintCount || 0;
          updateHintCounter();

          // Restore timer state - adjust startTime to preserve elapsed time
          if (progress.elapsedTime !== undefined) {
            // Calculate what startTime should be to preserve the elapsed time
            startTime = Date.now() - (progress.elapsedTime * 1000);
          }

          // Restore completion state
          if (progress.isCompleted) {
            document.getElementById('completionMessage').style.display = 'block';
            if (progress.completionText) {
              document.getElementById('completionText').textContent = progress.completionText;
            }
            disablePuzzleInputs();
            // Don't start timer if puzzle is completed
            isTimerRunning = false;
            // Update timer display with final time
            document.getElementById('timer').textContent = formatTime(progress.elapsedTime);
          }

          return true;
        } catch (e) {
          console.error('Error loading saved progress:', e);
          return false;
        }
      }

      function clearProgress() {
        localStorage.removeItem(getPuzzleStorageKey());
      }

      function disablePuzzleInputs() {
        // Disable all input fields
        const inputs = document.querySelectorAll('.cell-input');
        inputs.forEach(input => {
          input.disabled = true;
          input.style.cursor = 'not-allowed';
        });
        
        // Disable control buttons
        document.getElementById('hintBtn').disabled = true;
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('clearBtn').disabled = true;
        document.getElementById('revealBtn').disabled = true;
      }

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
        
        // Don't start timer if puzzle is completed
        const isCompleted = document.getElementById('completionMessage').style.display === 'block';
        if (isCompleted) return;
        
        // Only set startTime if it's not already set (from loadProgress)
        if (!startTime) {
          startTime = Date.now();
        }
        
        isTimerRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
        
        // Save initial progress to establish timer persistence
        saveProgress();
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
        
        // Try to load saved progress (this will adjust startTime if needed)
        const progressLoaded = loadProgress();
        
        // Start the timer only if puzzle is not completed
        const isCompleted = document.getElementById('completionMessage').style.display === 'block';
        if (!isCompleted) {
          startTimer();
        }
        
        // Select first available cell
        setTimeout(() => {
          const firstInput = document.querySelector('td .cell-input');
          if (firstInput) {
            const cell = firstInput.closest('td');
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
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

        // Calculate optimal cell size based on word length and screen width
        const wordLength = grid[0].length;
        const screenWidth = window.innerWidth;
        let cellSize;
        
        if (screenWidth <= 360) {
          // Very small screens - smaller cells
          cellSize = Math.min(45, Math.floor((screenWidth - 40) / wordLength));
        } else if (screenWidth <= 480) {
          // Small screens
          cellSize = Math.min(50, Math.floor((screenWidth - 40) / wordLength));
        } else if (screenWidth <= 768) {
          // Medium screens
          cellSize = Math.min(60, Math.floor((screenWidth - 40) / wordLength));
        } else if (screenWidth <= 1024) {
          // Large screens
          cellSize = Math.min(100, Math.floor((screenWidth - 80) / wordLength));
        } else {
          // Desktop - use full size
          cellSize = 125;
        }
        
        // Ensure minimum cell size
        cellSize = Math.max(cellSize, 40);

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
                <input type="text" class="contents cell-input" maxlength="1" autocomplete="off" autocorrect="off" spellcheck="false" inputmode="text" enterkeyhint="next">
              \`;
              const input = cell.querySelector('.cell-input');
              cell.tabIndex = -1; // Remove cell focusability, let input handle it
              cell.dataset.row = i;
              cell.dataset.col = j;
              cell.style.width = cellSize + 'px';
              cell.style.height = cellSize + 'px';
              cell.style.minWidth = cellSize + 'px';
              cell.style.minHeight = cellSize + 'px';
              
              input.addEventListener('focus', (e) => {
                selectCell(i, j);
              });
              input.addEventListener('click', (e) => {
                e.stopPropagation();
                selectCell(i, j);
              });
              input.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                selectCell(i, j);
                input.focus();
              });
              input.addEventListener('input', handleCellInput);
              input.addEventListener('keydown', handleCellKeydown);
            }
            
            row.appendChild(cell);
          }
          
          table.appendChild(row);
        }
        
        // Adjust font size based on cell size
        const fontSize = Math.floor(cellSize * 0.6);
        const inputs = table.querySelectorAll('.cell-input');
        inputs.forEach(input => {
          input.style.fontSize = fontSize + 'px';
        });
      }

      function displayClues() {
        // Display the single word clue
        const wordClue = document.getElementById('wordClue');
        const clue = puzzleData.clues.across[0]; // Get the single clue
        wordClue.textContent = clue.clue;
      }

      function selectCell(row, col) {
        // Remove focus from all cells
        document.querySelectorAll('td').forEach(cell => {
          cell.classList.remove('selected');
        });
        
        const cell = document.querySelector(\`tr[id="\${row}"] td:nth-child(\${col + 1})\`);
        if (cell && !cell.style.backgroundColor) {
          cell.classList.add('selected');
          const input = cell.querySelector('.cell-input');
          if (input && !input.disabled) {
            // Force focus on mobile devices
            setTimeout(() => {
              input.focus();
              input.click();
            }, 10);
          }
        }
      }

      function handleCellInput(e) {
        const input = e.target;
        const cell = input.closest('td');
        
        // Ensure uppercase and single character
        if (input.value) {
          input.value = input.value.toUpperCase().slice(-1);
          // Move to next cell after input
          setTimeout(() => moveToNextCell(cell, 1), 10);
        }
        
        // Save progress after input
        saveProgress();
      }

      function handleCellKeydown(e) {
        const input = e.target;
        const cell = input.closest('td');
        
        if (e.key === 'Backspace') {
          if (input.value === '') {
            // Move to previous cell and clear it
            moveToNextCell(cell, -1);
          } else {
            // Save progress after backspace
            setTimeout(() => saveProgress(), 10);
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
        
        // Handle wrapping within the single row
        const maxCol = puzzleData.grid[0].length - 1;
        if (nextCol < 0) {
          nextCol = maxCol; // Wrap to last column
        } else if (nextCol > maxCol) {
          nextCol = 0; // Wrap to first column
        }
        
        const nextCell = document.querySelector(\`tr[id="\${nextRow}"] td:nth-child(\${nextCol + 1})\`);
        if (nextCell && !nextCell.style.backgroundColor) {
          const nextInput = nextCell.querySelector('.cell-input');
          if (nextInput) {
            nextInput.focus();
            selectCell(nextRow, nextCol);
          }
        }
      }

      function moveToCellBelow(currentCell) {
        // For single row, just move to next cell
        moveToNextCell(currentCell, 1);
      }

      function moveToCellAbove(currentCell) {
        // For single row, just move to previous cell
        moveToNextCell(currentCell, -1);
      }

      function checkSolution() {
        const grid = puzzleData.grid;
        const solution = puzzleData.solution;
        let correct = 0;
        let total = 0;
        let hasErrors = false;

        // Check only the single row
        for (let j = 0; j < grid[0].length; j++) {
          if (!grid[0][j].isBlack) {
            total++;
            const cell = document.querySelector(\`tr[id="0"] td:nth-child(\${j + 1})\`);
            const input = cell.querySelector('.cell-input');
            const userInput = input.value.toUpperCase();
            const correctAnswer = solution[0][j];
            
            if (userInput === correctAnswer) {
              correct++;
              cell.style.border = '2px solid green';
            } else if (userInput !== '') {
              cell.style.border = '2px solid red';
              hasErrors = true;
            }
          }
        }

        const percentage = Math.round((correct / total) * 100);
        alert(\`Progress: \${correct}/\${total} letters correct (\${percentage}%)\`);

        if (correct === total) {
          stopTimer();
          
          // Set completion message with time and hints
          const finalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
          const timeText = formatTime(finalTime);
          const hintText = hintCount === 0 ? 'no hints' : hintCount === 1 ? '1 hint' : \`\${hintCount} hints\`;
          const completionText = \`Success! Completed in \${timeText}, used \${hintText}.\`;
          document.getElementById('completionText').textContent = completionText;
          
          document.getElementById('completionMessage').style.display = 'block';
          disablePuzzleInputs();
          // Save completion state
          saveProgress();
        }
      }

      function revealAnswers() {
        const grid = puzzleData.grid;
        const solution = puzzleData.solution;
        
        // Reveal only the single row
        for (let j = 0; j < grid[0].length; j++) {
          if (!grid[0][j].isBlack) {
            const cell = document.querySelector(\`tr[id="0"] td:nth-child(\${j + 1})\`);
            const input = cell.querySelector('.cell-input');
            input.value = solution[0][j];
            cell.style.border = '2px solid green';
          }
        }
        
        stopTimer();
        
        // Set completion message for revealed puzzle
        const finalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        const timeText = formatTime(finalTime);
        const hintText = hintCount === 0 ? 'no hints' : hintCount === 1 ? '1 hint' : \`\${hintCount} hints\`;
        const completionText = \`Puzzle revealed after \${timeText}, used \${hintText}.\`;
        document.getElementById('completionText').textContent = completionText;
        
        document.getElementById('completionMessage').style.display = 'block';
        disablePuzzleInputs();
        
        // Save completion state when revealed
        saveProgress();
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
        
        // Clear only the single row
        for (let j = 0; j < grid[0].length; j++) {
          if (!grid[0][j].isBlack) {
            const cell = document.querySelector(\`tr[id="0"] td:nth-child(\${j + 1})\`);
            const input = cell.querySelector('.cell-input');
            input.value = '';
            cell.style.border = '1px solid #535353';
            cell.classList.remove('hint-revealed');
          }
        }
        
        // Reset hint count and timer
        hintCount = 0;
        updateHintCounter();
        
        // Clear saved progress
        clearProgress();
        
        // Restart timer
        stopTimer();
        startTimer();
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
        
        // Get all empty cells that aren't black in the single row
        const emptyCells = [];
        const grid = puzzleData.grid;
        
        for (let j = 0; j < grid[0].length; j++) {
          const cell = document.querySelector(\`tr[id="0"] td:nth-child(\${j + 1})\`);
          const input = cell.querySelector('.cell-input');
          if (!grid[0][j].isBlack && input.value === '') {
            emptyCells.push({ row: 0, col: j, cell: cell, input: input });
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
        const correctLetter = solution[0][randomCell.col];
        randomCell.input.value = correctLetter;
        
        // Add hint styling
        randomCell.cell.classList.add('hint-revealed');
        
        // Increment hint counter
        hintCount++;
        updateHintCounter();
        
        // Save progress after hint
        saveProgress();
        
        // Show feedback
        showHintFeedback(randomCell.row, randomCell.col, correctLetter);
      }
      
      function showHintFeedback(row, col, letter) {
        // Create a temporary feedback element
        const feedback = document.createElement('div');
        feedback.textContent = \`Hint: \${letter} revealed at position \${col + 1}\`;
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

      // Handle window resize to recalculate cell sizes
      window.addEventListener('resize', () => {
        if (puzzleData) {
          generateGrid();
        }
      });

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
