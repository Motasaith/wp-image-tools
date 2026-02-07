document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const canvas = document.getElementById('main-canvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('image-upload');
    const dropZone = document.getElementById('drop-zone');
    const slider = document.getElementById('intensity-slider');
    const sliderVal = document.getElementById('intensity-val');
    const downloadBtn = document.getElementById('download-btn');
    const compareBtn = document.getElementById('compare-btn');
    const compareLabel = document.getElementById('compare-label');
    const placeholderMsg = document.getElementById('placeholder-msg');
    const settingsPanel = document.getElementById('settings-panel');

    // --- State ---
    let originalImage = null; // Image object
    let originalImageData = null; // Standard ImageData
    let processingRequest = null;

    // --- File Handling ---
    fileInput.addEventListener('change', handleFileSelect);
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    function handleFileSelect(e) { if (e.target.files.length) handleFile(e.target.files[0]); }
    function handleFile(file) {
        if (!file.type.match('image.*')) return;
        const reader = new FileReader();
        reader.onload = (e) => loadImage(e.target.result);
        reader.readAsDataURL(file);
    }

    function loadImage(src) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;
        img.onload = () => {
            originalImage = img;

            // Resize canvas
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original
            ctx.drawImage(img, 0, 0);

            // Store original data
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Enable UI
            placeholderMsg.style.display = 'none';
            settingsPanel.style.opacity = '1';
            settingsPanel.style.pointerEvents = 'auto';
            downloadBtn.disabled = false;
            compareBtn.style.display = 'flex';

            // Reset slider
            slider.value = 0;
            sliderVal.textContent = '0%';
        };
    }

    // --- Sharpen Logic (Convolution) ---
    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        sliderVal.textContent = val + '%';

        // Debounce/RequestAnimationFrame for performance
        if (processingRequest) cancelAnimationFrame(processingRequest);
        processingRequest = requestAnimationFrame(() => applySharpen(val));
    });

    function applySharpen(intensity) {
        if (!originalImageData) return;

        if (intensity === 0) {
            ctx.putImageData(originalImageData, 0, 0);
            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        const src = originalImageData.data;
        const output = ctx.createImageData(width, height);
        const dst = output.data;

        // Boost amount: Map 0-100 input to 0-4.0 range for stronger effect
        const amount = (intensity / 100.0) * 4.0;

        const w = width * 4;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Neighbors
                const n = idx - w;
                const s = idx + w;
                const w_idx = idx - 4;
                const e = idx + 4;

                for (let c = 0; c < 3; c++) {
                    const val = src[idx + c];

                    // Laplacian Sharpen Calculation:
                    // pixel = val + amount * (4*val - N - S - W - E)
                    const delta = (4 * val) - src[n + c] - src[s + c] - src[w_idx + c] - src[e + c];

                    dst[idx + c] = Math.min(255, Math.max(0, val + (delta * amount)));
                }
                dst[idx + 3] = 255; // Alpha
            }
        }

        ctx.putImageData(output, 0, 0);
    }

    // --- Compare Interaction ---
    let isComparing = false;

    const startCompare = (e) => {
        if (!originalImageData) return;
        // Don't prevent default on touch unless necessary (scrolling), but for button press it's okay
        if (e.cancelable && e.type !== 'touchstart') e.preventDefault();

        isComparing = true;
        ctx.putImageData(originalImageData, 0, 0);
        compareLabel.style.display = 'block';
        compareBtn.style.transform = 'translateX(-50%) scale(0.95)';
    };

    const stopCompare = (e) => {
        if (!isComparing) return;
        if (e.cancelable && e.type !== 'touchend') e.preventDefault();

        isComparing = false;
        compareLabel.style.display = 'none';
        compareBtn.style.transform = 'translateX(-50%)';
        // Re-apply current slider value
        applySharpen(parseInt(slider.value));
    };

    compareBtn.addEventListener('mousedown', startCompare);
    compareBtn.addEventListener('touchstart', startCompare);

    window.addEventListener('mouseup', stopCompare);
    window.addEventListener('touchend', stopCompare);

    // --- Download ---
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `sharpened-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // 457 (Approximation)
    if (window.transferManager) {
        // 1. Auto-Load
        transferManager.getTransfer().then(data => {
            if (data) {
                let blob = null;
                if (data.files && data.files.length > 0) {
                    blob = data.files[0].blob;
                } else if (data.blob) {
                    blob = data.blob;
                }

                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        loadImage(e.target.result);
                    };
                    reader.readAsDataURL(blob);
                    transferManager.clearData();
                }
            }
        });

        // 2. Intercept Sidebar
        const toolLinks = document.querySelectorAll('.tools-list a');
        toolLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                if (originalImageData) {
                    e.preventDefault();
                    link.innerHTML = '⏳ Processing...';
                    const originalHref = link.href;

                    try {
                        // Generate Sharpened Blob
                        canvas.toBlob(async (blob) => {
                            if (blob) {
                                await transferManager.saveImage(blob, 'sharpened_' + Date.now() + '.png');
                                window.location.href = originalHref;
                            } else {
                                window.location.href = originalHref;
                            }
                        }, 'image/png');
                    } catch (err) {
                        console.error("Transfer failed", err);
                        window.location.href = originalHref;
                    }
                }
            });
        });
    }

});
