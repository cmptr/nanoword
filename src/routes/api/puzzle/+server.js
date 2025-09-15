import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
	try {
		// Get today's date in America/Chicago timezone
		const today = new Date().toLocaleDateString('en-CA', {
			timeZone: 'America/Chicago'
		});
		
		// Try to get today's puzzle from KV
		const puzzleKey = `puzzle-${today}`;
		let puzzleData = await platform?.env?.PUZZLES?.get(puzzleKey, 'json');
		
		// If no puzzle exists for today, generate one
		if (!puzzleData) {
			console.log(`No puzzle found for ${today}, generating new one...`);
			puzzleData = await generateDailyPuzzle(today, platform?.env);
			
			// Store the generated puzzle in KV
			if (platform?.env?.PUZZLES) {
				await platform.env.PUZZLES.put(puzzleKey, JSON.stringify(puzzleData));
				console.log(`Stored puzzle for ${today} in KV`);
			}
		} else {
			console.log(`Using cached puzzle for ${today}`);
		}
		
		return json(puzzleData);
	} catch (error) {
		console.error('Error getting puzzle:', error);
		return json({ error: 'Failed to load puzzle' }, { status: 500 });
	}
}

async function generateDailyPuzzle(dateString, env) {
	try {
		// Fetch RSS feed from memeorandum
		const rssResponse = await fetch('https://www.memeorandum.com/feed.xml');
		const rssText = await rssResponse.text();
		
		// Parse RSS feed to extract headlines and descriptions
		const headlines = parseRSSFeed(rssText);
		console.log('Parsed headlines:', headlines.length, headlines);
		
		// Check if we have any headlines
		if (headlines.length === 0) {
			console.log('No headlines found, using fallback');
			throw new Error('No headlines available');
		}
		
		// Clean headlines to remove site references
		const cleanedHeadlines = cleanHeadlines(headlines);
		
		// Analyze with Cloudflare Llama3 worker
		const analysisResult = await analyzeWithLlama3(cleanedHeadlines, env);
		
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
	// Title is plain text, description uses CDATA
	const titleRegex = /<title>(.*?)<\/title>/g;
	const descriptionRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/g;
	
	let titleMatch;
	while ((titleMatch = titleRegex.exec(rssText)) !== null) {
		// Skip the channel title (first title element)
		const title = titleMatch[1].trim();
		if (title && !title.includes('memeorandum')) {
			headlines.push({
				title: title,
				description: ''
			});
		}
	}
	
	let descMatch;
	let index = 0;
	while ((descMatch = descriptionRegex.exec(rssText)) !== null && index < headlines.length) {
		headlines[index].description = descMatch[1].trim();
		index++;
	}
	
	return headlines.slice(0, 20); // Limit to first 20 items
}

function cleanHeadlines(headlines) {
	// Remove any mentions of problematic sites from headlines
	const forbiddenTerms = ['techmeme', 'memeorandum', 'aggregator', 'aggregation'];
	
	return headlines.map(headline => ({
		title: cleanText(headline.title, forbiddenTerms),
		description: cleanText(headline.description, forbiddenTerms)
	})).filter(headline => headline.title && headline.title.length > 10); // Filter out overly cleaned headlines
}

function cleanText(text, forbiddenTerms) {
	if (!text) return text;
	
	let cleaned = text;
	
	// Remove mentions of forbidden terms (case insensitive)
	forbiddenTerms.forEach(term => {
		const regex = new RegExp(term, 'gi');
		cleaned = cleaned.replace(regex, 'a news source');
	});
	
	// Clean up any awkward phrasing that might result
	cleaned = cleaned.replace(/a news source's/gi, 'a publication\'s');
	cleaned = cleaned.replace(/a news source\s+/gi, 'a publication ');
	
	return cleaned.trim();
}

async function analyzeWithLlama3(headlines, env) {
	let response;
	try {
		// Use Cloudflare AI binding
		response = await env?.AI?.run('@cf/meta/llama-3.1-8b-instruct', {
			messages: [
				{
					role: 'system',
					content: 'You\'re writing a crossword clue based on current events. Choose a solid English word (4-10 letters) and write an elegant clue. Focus on the underlying themes and concepts in the news, not the sources. Your clue should work standalone without referencing any specific publications, websites, or news organizations. Create clever wordplay or double meanings that relate to the news content itself. Examples: For tech developments → STREAM ("Netflix offering or data flow"), UPLOAD ("Send to the cloud"), MATRIX ("Neo\'s reality or math grid"). For political events → SUMMIT ("Mountain peak or diplomatic meeting"), AGENDA ("Meeting plan or hidden purpose"). Write only the JSON: {"word": "STREAM", "clue": "Netflix offering or data flow"}'
				},
				{
					role: 'user',
					content: `Analyze these current headlines and provide a clever word: ${JSON.stringify(headlines)}`
				}
			],
			max_tokens: 200,
			temperature: 0.7
		});
		
		console.log('Raw AI response:', response.response);
		
		// Try to extract JSON from response if it's wrapped in text
		let jsonString = response.response.trim();
		
		// Multiple strategies to extract JSON
		let analysis;
		
		// Try 1: Direct parse
		try {
			analysis = JSON.parse(jsonString);
		} catch {
			// Try 2: Extract JSON object from text
			const jsonMatch = jsonString.match(/\{[^{}]*"word"[^{}]*"clue"[^{}]*\}/);
			if (jsonMatch) {
				analysis = JSON.parse(jsonMatch[0]);
			} else {
				// Try 3: Look for any JSON-like structure
				const looserMatch = jsonString.match(/\{.*?\}/s);
				if (looserMatch) {
					analysis = JSON.parse(looserMatch[0]);
				} else {
					throw new Error('No valid JSON found in response');
				}
			}
		}
		
		// Validate the response has required fields
		if (!analysis.word || !analysis.clue) {
			throw new Error('Invalid response format: missing word or clue');
		}
		
		// Check for forbidden site mentions in the clue
		const clue = analysis.clue.toLowerCase();
		if (clue.includes('techmeme') || clue.includes('memeorandum') || clue.includes('aggregator')) {
			throw new Error('Clue contains forbidden site reference');
		}
		
		// Validate word length before using it
		const word = analysis.word.toUpperCase();
		if (word.length < 4 || word.length > 10) {
			throw new Error(`Invalid word length: ${word} (${word.length} letters, must be 4-10)`);
		}
		
		return {
			word: word,
			clue: analysis.clue
		};
	} catch (error) {
		console.error('Error with Llama3 analysis:', error);
		console.error('Raw response was:', response?.response);
		throw error;
	}
}

function generateFallbackPuzzle(dateString) {
	// Fallback words if RSS/LLM fails - varied and creative options (4-10 letters)
	const fallbackWords = [
		{ word: "MATRIX", clue: "Mathematical array, or place where Neo awakens" },
		{ word: "STREAM", clue: "Flow of water or data" },
		{ word: "AGENDA", clue: "Meeting plan or hidden motive" },
		{ word: "UPLOAD", clue: "Send files to the cloud" },
		{ word: "SUMMIT", clue: "Mountain peak or diplomatic meeting" },
		{ word: "BRIDGE", clue: "Structure that connects or card game declaration" },
		{ word: "CANVAS", clue: "Artist's surface or campaign activity" },
		{ word: "THREAD", clue: "Sewing material or discussion topic" },
		{ word: "LAUNCH", clue: "Rocket takeoff or product debut" },
		{ word: "FILTER", clue: "Coffee maker part or social media feature" },
		{ word: "FRAME", clue: "Picture border or set up falsely" },
		{ word: "PATCH", clue: "Software update or garden plot" },
		{ word: "SIGNAL", clue: "Traffic light or WiFi strength" },
		{ word: "SWITCH", clue: "Light toggle or change course" }
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