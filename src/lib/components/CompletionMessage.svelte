<script>
	let { completionText, puzzleData, gameState, formatTime } = $props();

	let shareUrl = $state('');
	let showShareUrl = $state(false);
	let copyButtonText = $state('📋 Copy');
	let copyPngButtonText = $state('📋 Copy PNG');

	async function generateShareUrl() {
		try {
			const date = puzzleData.date;
			const currentTime = gameState.startTime ? formatTime(Date.now() - gameState.startTime) : '00:00.000';
			const hintsUsed = gameState.hintCount;
			const isRevealed = completionText.includes('revealed');
			
			// Generate share ID and prepare share data
			const shareId = generateShareId();
			const shareData = {
				date: date,
				time: currentTime,
				hints: hintsUsed,
				isRevealed: isRevealed,
				createdAt: new Date().toISOString()
			};
			
			const response = await fetch('/api/share', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					shareId: shareId,
					shareData: shareData
				})
			});
			
			const responseData = await response.json();
			
			if (!response.ok) {
				throw new Error(`Failed to create share: ${responseData.error || response.statusText}`);
			}
			
			// Generate and show share URL
			shareUrl = `${window.location.origin}/share/${date}/${shareId}`;
			showShareUrl = true;
			
		} catch (error) {
			console.error('Error generating share URL:', error);
		}
	}

	async function copyShareUrl() {
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(shareUrl);
				copyButtonText = '✓ Copied';
				setTimeout(() => {
					copyButtonText = '📋 Copy';
				}, 2000);
			} else {
				const textarea = document.createElement('textarea');
				textarea.value = shareUrl;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				document.body.removeChild(textarea);
				copyButtonText = '✓ Copied';
				setTimeout(() => {
					copyButtonText = '📋 Copy';
				}, 2000);
			}
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
			copyButtonText = '❌ Failed';
			setTimeout(() => {
				copyButtonText = '📋 Copy';
			}, 2000);
		}
	}

	async function createPngCanvas() {
		// Create canvas for PNG export - matches share URL template
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		
		// Set canvas size
		canvas.width = 600;
		canvas.height = 400;
		
		// Background
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		// Add subtle border/shadow
		ctx.fillStyle = '#f3f4f6';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
		
		// Drop shadow effect
		ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 4;
		ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
		ctx.shadowColor = 'transparent';
		
		// Title
		ctx.fillStyle = '#535353';
		ctx.font = 'bold 42px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('nanoword', canvas.width / 2, 80);
		
		// Date
		ctx.font = '20px monospace';
		ctx.fillStyle = '#666666';
		ctx.fillText(puzzleData.date, canvas.width / 2, 120);
		
		// Status - matches share URL page
		const isRevealed = completionText.includes('revealed');
		const statusEmoji = isRevealed ? '🔍' : '✅';
		const statusText = isRevealed ? 'REVEALED' : 'SOLVED';
		
		ctx.font = 'bold 32px monospace';
		ctx.fillStyle = isRevealed ? '#f59e0b' : '#10b981';
		ctx.fillText(`${statusEmoji} ${statusText}`, canvas.width / 2, 180);
		
		// Stats section - styled like share URL page
		const currentTime = gameState.startTime ? formatTime(Date.now() - gameState.startTime) : '00:00.000';
		const hintsUsed = gameState.hintCount;
		
		// Stats background boxes
		const statsY = 250;
		const boxWidth = 180;
		const boxHeight = 80;
		const leftBoxX = (canvas.width / 2) - boxWidth - 10;
		const rightBoxX = (canvas.width / 2) + 10;
		
		// Left stats box (Time)
		ctx.fillStyle = '#f8fafc';
		ctx.strokeStyle = '#e2e8f0';
		ctx.lineWidth = 1;
		ctx.fillRect(leftBoxX, statsY, boxWidth, boxHeight);
		ctx.strokeRect(leftBoxX, statsY, boxWidth, boxHeight);
		
		// Right stats box (Hints)
		ctx.fillRect(rightBoxX, statsY, boxWidth, boxHeight);
		ctx.strokeRect(rightBoxX, statsY, boxWidth, boxHeight);
		
		// Stats labels and values
		ctx.fillStyle = '#64748b';
		ctx.font = '14px sans-serif';
		ctx.textAlign = 'center';
		
		// Time stats
		ctx.fillText('Time', leftBoxX + boxWidth/2, statsY + 25);
		ctx.fillStyle = '#1e293b';
		ctx.font = 'bold 20px monospace';
		ctx.fillText(`⏱️ ${currentTime}`, leftBoxX + boxWidth/2, statsY + 50);
		
		// Hints stats
		ctx.fillStyle = '#64748b';
		ctx.font = '14px sans-serif';
		ctx.fillText('Hints Used', rightBoxX + boxWidth/2, statsY + 25);
		ctx.fillStyle = '#1e293b';
		ctx.font = 'bold 20px monospace';
		ctx.fillText(`💡 ${hintsUsed}`, rightBoxX + boxWidth/2, statsY + 50);
		
		return canvas;
	}

	async function copyPngToClipboard() {
		try {
			// Check if clipboard API is available
			if (!navigator.clipboard || !navigator.clipboard.write) {
				copyPngButtonText = '❌ Not supported';
				setTimeout(() => {
					copyPngButtonText = '📋 Copy PNG';
				}, 2000);
				return;
			}
			
			const canvas = await createPngCanvas();
			
			// Convert canvas to blob
			canvas.toBlob(async (blob) => {
				try {
					await navigator.clipboard.write([
						new ClipboardItem({
							'image/png': blob
						})
					]);
					copyPngButtonText = '✓ Copied';
					setTimeout(() => {
						copyPngButtonText = '📋 Copy PNG';
					}, 2000);
				} catch (err) {
					console.error('Failed to copy to clipboard:', err);
					copyPngButtonText = '❌ Failed';
					setTimeout(() => {
						copyPngButtonText = '📋 Copy PNG';
					}, 2000);
				}
			}, 'image/png');
			
		} catch (error) {
			console.error('Error copying PNG to clipboard:', error);
			copyPngButtonText = '❌ Failed';
			setTimeout(() => {
				copyPngButtonText = '📋 Copy PNG';
			}, 2000);
		}
	}

	async function downloadPng() {
		try {
			const canvas = await createPngCanvas();
			
			// Convert canvas to blob and download
			canvas.toBlob((blob) => {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `nanoword-${puzzleData.date}.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				
			}, 'image/png');
			
		} catch (error) {
			console.error('Error downloading PNG:', error);
		}
	}

	function generateShareId() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
</script>

<div class="text-center mt-12">
	<div class="card bg-base-100 max-w-md mx-auto">
		<div class="card-body">
			<h2 class="card-title justify-center text-3xl mb-4" style="font-family: 'Micro 5', monospace; color: #535353;">
				{completionText}
			</h2>
			<div class="card-actions justify-center">
				<div class="flex flex-col gap-3 items-center w-full">
					{#if !showShareUrl}
						<button class="btn bg-white border-gray-300 hover:bg-gray-50" style="font-family: 'Pixelify Sans', sans-serif; color: #535353;" on:click={generateShareUrl}>
							📤 Generate Share URL
						</button>
					{:else}
						<div class="w-full max-w-sm">
							<div class="flex gap-2 items-center">
								<input 
									type="text" 
									class="input input-bordered flex-1 text-sm" 
									style="font-family: 'Libre Franklin', sans-serif;"
									value={shareUrl} 
									readonly 
								/>
								<button 
									class="btn bg-white border-gray-300 hover:bg-gray-50 btn-sm" 
									style="font-family: 'Pixelify Sans', sans-serif; color: #535353;" 
									on:click={copyShareUrl}
								>
									{copyButtonText}
								</button>
							</div>
						</div>
					{/if}
					<div class="flex gap-2">
						<button class="btn bg-white border-gray-300 hover:bg-gray-50" style="font-family: 'Pixelify Sans', sans-serif; color: #535353;" on:click={copyPngToClipboard}>
							{copyPngButtonText}
						</button>
						<button class="btn bg-white border-gray-300 hover:bg-gray-50" style="font-family: 'Pixelify Sans', sans-serif; color: #535353;" on:click={downloadPng}>
							📥 Download PNG
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>