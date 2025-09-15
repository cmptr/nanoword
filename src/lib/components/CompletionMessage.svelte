<script>
	let { completionText, puzzleData, gameState, formatTime } = $props();

	async function shareResult() {
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
			
			// Generate share URL
			const shareUrl = `${window.location.origin}/share/${date}/${shareId}`;
			
			// Check if Web Share API is available
			if (navigator.share) {
				try {
					await navigator.share({
						url: shareUrl
					});
				} catch (err) {
					if (err.name !== 'AbortError') {
						copyToClipboard(shareUrl);
					}
				}
			} else {
				copyToClipboard(shareUrl);
			}
		} catch (error) {
			console.error('Error sharing result:', error);
			showShareFeedback('Failed to create share. Please try again.');
		}
	}

	function generateShareId() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	async function copyToClipboard(text) {
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
				showShareFeedback('Copied to clipboard!');
			} else {
				const textarea = document.createElement('textarea');
				textarea.value = text;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				document.body.removeChild(textarea);
				showShareFeedback('Copied to clipboard!');
			}
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
			showShareFeedback('Failed to copy. Please try again.');
		}
	}

	function showShareFeedback(message) {
		// Create temporary feedback element
		const feedback = document.createElement('div');
		feedback.textContent = message;
		feedback.className = 'toast toast-top toast-end';
		feedback.innerHTML = `
			<div class="alert alert-success">
				<span>${message}</span>
			</div>
		`;
		
		document.body.appendChild(feedback);
		
		setTimeout(() => {
			if (feedback.parentNode) {
				feedback.parentNode.removeChild(feedback);
			}
		}, 3000);
	}
</script>

<div class="text-center mt-12">
	<div class="card bg-base-100 max-w-md mx-auto">
		<div class="card-body">
			<h2 class="card-title justify-center text-3xl mb-4" style="font-family: 'Micro 5', monospace; color: #535353;">
				{completionText}
			</h2>
			<div class="card-actions justify-center">
				<button class="btn btn-primary btn-lg" style="font-family: 'Pixelify Sans', sans-serif;" on:click={shareResult}>
					Share Result
				</button>
			</div>
		</div>
	</div>
</div>