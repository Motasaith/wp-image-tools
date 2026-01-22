document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const convertBtn = document.getElementById('convert-btn');
    const resultImage = document.getElementById('result-image');
    const downloadBtn = document.getElementById('download-btn');
    const errorMsg = document.getElementById('error-msg');

    const inputZone = document.getElementById('input-zone');
    const previewArea = document.getElementById('preview-area');

    // Settings
    // Format selector removed from UI
    const widthSelect = document.getElementById('width-select');
    const fullPageCheckbox = document.getElementById('full-page');

    convertBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            showError('Please enter a valid URL');
            return;
        }
        if (!isValidUrl(url)) {
            showError('Please enter a valid URL (include http:// or https://)');
            return;
        }

        // Reset UI before starting
        errorMsg.style.display = 'none';

        // Dynamic Status
        const statusMessages = ["Scanning link...", "Waiting for site...", "Generating capture...", "Almost there..."];
        let msgIndex = 0;
        convertBtn.disabled = true;
        convertBtn.textContent = statusMessages[0];

        const statusInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % statusMessages.length;
            convertBtn.textContent = statusMessages[msgIndex];
        }, 1500);

        const stopStatus = () => {
            clearInterval(statusInterval);
            convertBtn.textContent = 'Convert to Image';
            convertBtn.disabled = false;
        };

        try {
            const isFullPage = fullPageCheckbox.checked;
            const width = widthSelect.value;
            // Removed format selection, defaulting to png

            // Correct logic for viewport size in Microlink
            // We need to pass the full viewport string e.g., '1920x1080'
            const viewport = `${width}x1080`;

            // Build API URL with correct parameters
            // Note: screenshot.type defaults to png if not specified, which is what we want.
            // Using explicit viewport parameter for Microlink (width x height)
            let apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&viewport.width=${width}&viewport.height=1080`;

            if (isFullPage) {
                apiUrl += '&fullPage=true';
            }

            // Fetch the metadata first
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.status === 'success' && data.data && data.data.screenshot && data.data.screenshot.url) {
                resultImage.src = data.data.screenshot.url;

                resultImage.onload = () => {
                    stopStatus();
                    showPreview();
                };
                resultImage.onerror = () => {
                    stopStatus();
                    // User requested to remove this error message
                    console.warn('Failed to load image resource event triggered');
                };
            } else {
                // If Microlink fails, it usually means the site blocked the bot or timed out.
                stopStatus();
                console.warn('Microlink failed:', data);
                let failMsg = 'Could not generate screenshot.';
                if (data.message) failMsg += ' ' + data.message;
                failMsg += ' The site may be protected (e.g., Cloudflare) or blocking bots.';

                throw new Error(failMsg);
            }

        } catch (err) {
            stopStatus();
            showError(err.message);
        }
    });

    downloadBtn.addEventListener('click', async () => {
        if (!resultImage.src) return;

        try {
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.disabled = true;

            const response = await fetch(resultImage.src);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `screenshot-${Date.now()}.png`; // Always PNG
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(blobUrl);
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        } catch (e) {
            console.error('Download failed:', e);
            // Fallback
            window.open(resultImage.src, '_blank');
            downloadBtn.textContent = 'Download Image';
            downloadBtn.disabled = false;
        }
    });

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Removed old startLoading/stopLoading in favor of inline logic for status messages

    function showPreview() {
        inputZone.style.display = 'none';
        previewArea.style.display = 'flex';
        downloadBtn.disabled = false;
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }

    window.resetApp = function () {
        inputZone.style.display = 'flex';
        previewArea.style.display = 'none';
        urlInput.value = '';
        downloadBtn.disabled = true;
        resultImage.src = '';
        errorMsg.style.display = 'none';
    };
});
