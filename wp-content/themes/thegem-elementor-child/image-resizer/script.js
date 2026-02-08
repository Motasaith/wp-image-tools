
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const uploadScreen = document.getElementById('upload-screen');
    const fileInput = document.getElementById('file-input');
    const editorBox = document.getElementById('editor-box');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    const fileQueueDiv = document.getElementById('file-queue');

    // Controls
    const presetSelect = document.getElementById('preset-select');
    const inputWidth = document.getElementById('input-width');
    const inputHeight = document.getElementById('input-height');
    const linkAspectBtn = document.getElementById('link-aspect');
    const scaleSlider = document.getElementById('scale-slider');
    const scaleVal = document.getElementById('scale-val');
    const downloadBtn = document.getElementById('download-btn');

    // Smart Mode Controls
    const smartControlsDiv = document.getElementById('smart-controls');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const colorPickerWrap = document.getElementById('color-picker-wrap');

    // State
    let fileQueue = [];
    let activeIndex = 0;

    // Resize State
    let resizeMode = 'absolute';
    let targetW = 0;
    let targetH = 0;
    let targetPercent = 100;
    let isLocked = true;
    let lockedRatio = 1;

    // Smart Mode State
    let isSmartMode = true;
    let smartBgType = 'blur';
    let smartBgColor = '#ffffff';

    // Cached image for active item
    let cachedImage = null;

    // --- Mode Switching Logic ---
    window.switchMode = (mode) => {
        isSmartMode = (mode === 'smart');
        document.getElementById('mode-normal').classList.toggle('active', !isSmartMode);
        document.getElementById('mode-smart').classList.toggle('active', isSmartMode);
        smartControlsDiv.style.display = isSmartMode ? 'block' : 'none';
        renderPreview();
    };

    window.setSmartBg = (type) => {
        smartBgType = type;
        document.getElementById('bg-blur-opt').classList.toggle('active', type === 'blur');
        document.getElementById('bg-color-opt').classList.toggle('active', type === 'color');
        colorPickerWrap.style.display = (type === 'color') ? 'block' : 'none';
        renderPreview();
    };

    bgColorPicker.addEventListener('input', (e) => {
        smartBgColor = e.target.value;
        renderPreview();
    });

    // Initialize Smart Mode
    switchMode('smart');

    // --- Upload Handling ---
    window.handleFileSelect = (input) => {
        if (input.files && input.files.length > 0) handleFiles(Array.from(input.files));
    };

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault(); dropZone.style.backgroundColor = '#eef2ff';
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault(); dropZone.style.backgroundColor = '';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dropZone.style.backgroundColor = '';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFiles(Array.from(e.dataTransfer.files));
    });

    async function handleFiles(files) {
        const validFiles = files.filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) return;

        for (const file of validFiles) {
            await addToFileQueue(file);
        }

        updateQueueUI();
        if (fileQueue.length > 0) {
            uploadScreen.classList.add('hidden');
            editorBox.style.display = 'flex';
            fileQueueDiv.style.display = 'flex';
            editorBox.offsetHeight; // Force reflow
            setActiveImage(fileQueue.length - 1);
        }
    }

    function addToFileQueue(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    fileQueue.push({
                        id: Date.now() + Math.random(),
                        file: file,
                        src: e.target.result,
                        image: img, // Cache the loaded image object
                        originalW: img.naturalWidth,
                        originalH: img.naturalHeight
                    });
                    if (fileQueue.length === 1) {
                        targetW = img.naturalWidth;
                        targetH = img.naturalHeight;
                        lockedRatio = targetW / targetH;
                    }
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- Queue UI ---
    function updateQueueUI() {
        fileQueueDiv.innerHTML = '';

        const addBtn = document.createElement('div');
        addBtn.className = 'queue-item add-btn';
        addBtn.onclick = () => document.getElementById('file-input').click();
        addBtn.title = "Add more photos";
        addBtn.innerHTML = '<span style="font-size: 2rem; color: #ccc;">+</span>';
        fileQueueDiv.appendChild(addBtn);

        fileQueue.forEach((item, index) => {
            const thumb = document.createElement('div');
            thumb.className = `queue-item ${index === activeIndex ? 'active' : ''}`;
            thumb.onclick = (e) => { if (e.target.closest('.queue-remove')) return; setActiveImage(index); };

            const img = document.createElement('img');
            img.src = item.src;
            const removeBtn = document.createElement('div');
            removeBtn.className = 'queue-remove';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = (e) => { e.stopPropagation(); removeFile(index); };

            thumb.appendChild(img);
            thumb.appendChild(removeBtn);
            fileQueueDiv.appendChild(thumb);
        });
        updateDownloadBtn();
    }

    function removeFile(index) {
        fileQueue.splice(index, 1);
        if (fileQueue.length === 0) { location.reload(); return; }
        if (index === activeIndex) activeIndex = 0;
        else if (index < activeIndex) activeIndex--;
        updateQueueUI();
        setActiveImage(activeIndex);
    }

    function setActiveImage(index) {
        activeIndex = index;
        const item = fileQueue[index];
        if (!item) return;

        cachedImage = item.image;

        document.querySelectorAll('.queue-item').forEach((el, i) => el.classList.toggle('active', i === index + 1)); // +1 for add button
        updateInputsFromState();
        updateVisualBox();
        renderPreview();
    }

    // --- Dimension Calculations ---
    function calculateDimsForImage(item) {
        let w, h;
        if (resizeMode === 'percentage') {
            w = Math.round(item.originalW * (targetPercent / 100));
            h = Math.round(item.originalH * (targetPercent / 100));
        } else {
            w = targetW;
            h = targetH;
        }
        return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    function updateInputsFromState() {
        const item = fileQueue[activeIndex];
        if (!item) return;
        const dims = calculateDimsForImage(item);
        inputWidth.value = dims.w;
        inputHeight.value = dims.h;
        if (resizeMode === 'percentage') {
            scaleSlider.value = targetPercent;
            scaleVal.innerText = targetPercent + '%';
        }
    }

    function setAbsolute(w, h) {
        resizeMode = 'absolute';
        targetW = Math.max(1, w);
        targetH = Math.max(1, h);
        updateVisualBox();
        renderPreview();
    }

    inputWidth.addEventListener('input', (e) => {
        let w = parseInt(e.target.value) || 1;
        let h = parseInt(inputHeight.value) || 1;

        if (isLocked) {
            h = Math.round(w / lockedRatio);
            inputHeight.value = h;
        }
        setAbsolute(w, h);
    });

    inputHeight.addEventListener('input', (e) => {
        let h = parseInt(e.target.value) || 1;
        let w = parseInt(inputWidth.value) || 1;

        if (isLocked) {
            w = Math.round(h * lockedRatio);
            inputWidth.value = w;
        }
        setAbsolute(w, h);
    });

    scaleSlider.addEventListener('input', (e) => {
        resizeMode = 'percentage';
        targetPercent = parseInt(e.target.value);
        scaleVal.innerText = targetPercent + '%';

        updateInputsFromState();

        if (fileQueue[activeIndex]) {
            const item = fileQueue[activeIndex];
            lockedRatio = item.originalW / item.originalH;
        }

        updateVisualBox();
        renderPreview();
    });

    // Presets
    const presets = {
        'instagram-story': [1080, 1920],
        'instagram-post': [1080, 1080],
        'profile-pic': [500, 500],
        'youtube-thumb': [1280, 720],
        'facebook-cover': [820, 312],
        'whatsapp-status': [1080, 1920]
    };

    presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (presets[val]) {
            const [w, h] = presets[val];
            inputWidth.value = w;
            inputHeight.value = h;
            lockedRatio = w / h;
            setAbsolute(w, h);
        }
    });

    linkAspectBtn.addEventListener('click', () => {
        isLocked = !isLocked;
        linkAspectBtn.classList.toggle('locked');
        linkAspectBtn.innerHTML = isLocked ? '<span style="font-size: 1.2rem;">∞</span>' : '<span style="font-size: 1.2rem; opacity: 0.5;">∞</span>';

        if (isLocked) {
            const currW = parseInt(inputWidth.value) || 1;
            const currH = parseInt(inputHeight.value) || 1;
            lockedRatio = currW / currH;
        }
    });

    // --- Visual Box Sizing ---
    function updateVisualBox() {
        const item = fileQueue[activeIndex];
        if (!item) return;

        const dims = calculateDimsForImage(item);
        const targetRatio = dims.w / dims.h;

        const container = document.querySelector('.canvas-container');
        const maxW = (container.clientWidth || 300) - 40;
        const maxH = (container.clientHeight || 400) - 40;

        // Scale to fit container while maintaining target aspect ratio
        let finalW, finalH;
        if (dims.w / maxW > dims.h / maxH) {
            // Width-constrained
            finalW = Math.min(dims.w, maxW);
            finalH = finalW / targetRatio;
        } else {
            // Height-constrained
            finalH = Math.min(dims.h, maxH);
            finalW = finalH * targetRatio;
        }

        editorBox.style.width = finalW + 'px';
        editorBox.style.height = finalH + 'px';
    }

    window.addEventListener('resize', () => {
        if (fileQueue.length > 0) {
            updateVisualBox();
            renderPreview();
        }
    });

    // ========================================
    // UNIFIED CANVAS RENDERING (Industry Standard)
    // This single function renders to ANY canvas
    // Used for both preview and download
    // ========================================
    function renderToCanvas(canvas, ctx, img, targetW, targetH) {
        // Set canvas dimensions to EXACT output size
        canvas.width = targetW;
        canvas.height = targetH;

        // Enable high-quality image smoothing (bicubic-like interpolation)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (!isSmartMode) {
            // Normal Mode = Stretch/Fill
            ctx.drawImage(img, 0, 0, targetW, targetH);
        } else {
            // Smart Mode

            // 1. Draw Background
            if (smartBgType === 'color') {
                ctx.fillStyle = smartBgColor;
                ctx.fillRect(0, 0, targetW, targetH);
            } else {
                // Blur Background
                ctx.save();

                // Dynamic blur based on output size (industry standard)
                const maxDim = Math.max(targetW, targetH);
                const blurPx = Math.max(10, Math.round((maxDim / 1000) * 20));
                ctx.filter = `blur(${blurPx}px)`;

                // "Cover" logic - fill entire canvas with blurred image
                const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
                const bgW = img.naturalWidth * scale;
                const bgH = img.naturalHeight * scale;
                const bgX = (targetW - bgW) / 2;
                const bgY = (targetH - bgH) / 2;

                ctx.drawImage(img, bgX, bgY, bgW, bgH);

                // Light overlay for softening
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fillRect(0, 0, targetW, targetH);
                ctx.restore();
            }

            // 2. Draw Foreground (Contain/Fit)
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const targetRatio = targetW / targetH;

            let drawW, drawH, drawX, drawY;

            if (imgRatio > targetRatio) {
                // Image is wider - fit to width
                drawW = targetW;
                drawH = targetW / imgRatio;
                drawX = 0;
                drawY = (targetH - drawH) / 2;
            } else {
                // Image is taller - fit to height
                drawH = targetH;
                drawW = targetH * imgRatio;
                drawX = (targetW - drawW) / 2;
                drawY = 0;
            }

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
    }

    // --- Preview Rendering ---
    function renderPreview() {
        const item = fileQueue[activeIndex];
        if (!item || !cachedImage) return;

        const dims = calculateDimsForImage(item);
        renderToCanvas(previewCanvas, previewCtx, cachedImage, dims.w, dims.h);
    }

    // --- Download Logic ---
    function updateDownloadBtn() {
        const count = fileQueue.length;
        downloadBtn.innerText = (count > 1) ? `Download ${count} images (ZIP)` : 'Download';
    }

    downloadBtn.addEventListener('click', async () => {
        if (fileQueue.length === 0) return;
        downloadBtn.disabled = true;
        downloadBtn.innerText = 'Processing...';

        try {
            if (fileQueue.length === 1) {
                const item = fileQueue[0];
                const dims = calculateDimsForImage(item);
                const blob = await processImage(item, dims.w, dims.h);
                triggerDownload(blob, `resized_${item.file.name}`);
            } else {
                const zip = new JSZip();
                for (let i = 0; i < fileQueue.length; i++) {
                    const item = fileQueue[i];
                    downloadBtn.innerText = `Processing ${i + 1}/${fileQueue.length}...`;
                    const dims = calculateDimsForImage(item);
                    const blob = await processImage(item, dims.w, dims.h);
                    zip.file(`resized_${item.file.name}`, blob);
                }
                downloadBtn.innerText = 'Zipping...';
                const content = await zip.generateAsync({ type: "blob" });
                triggerDownload(content, "resized_images.zip");
            }
        } catch (e) {
            alert('Error processing images: ' + e.message);
            console.error(e);
        } finally {
            downloadBtn.disabled = false;
            updateDownloadBtn();
        }
    });

    // --- Process Image for Download (uses same renderToCanvas) ---
    function processImage(item, targetW, targetH) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Use cached image if available, otherwise load
            const img = item.image || new Image();

            if (item.image) {
                renderToCanvas(canvas, ctx, img, targetW, targetH);
                const mime = item.file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
                canvas.toBlob(blob => resolve(blob), mime, 0.92);
            } else {
                img.onload = () => {
                    renderToCanvas(canvas, ctx, img, targetW, targetH);
                    const mime = item.file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
                    canvas.toBlob(blob => resolve(blob), mime, 0.92);
                };
                img.src = item.src;
            }
        });
    }

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Transfer Manager Integration ---
    if (window.transferManager) {
        transferManager.getTransfer().then(data => {
            if (data) {
                let fileObjects = [];
                if (data.files && data.files.length > 0) {
                    fileObjects = data.files.map(f => new File([f.blob], f.filename, { type: f.blob.type || 'image/png' }));
                } else if (data.blob) {
                    fileObjects = [new File([data.blob], data.filename || "transfer.png", { type: data.blob.type || 'image/png' })];
                }

                if (fileObjects.length > 0) {
                    handleFiles(fileObjects).then(() => { });
                    transferManager.clearData();
                }
            }
        });
    }

    // Intercept Sidebar Links for transfers
    const toolLinks = document.querySelectorAll('.tools-list a');
    toolLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            if (fileQueue.length > 0) {
                e.preventDefault();
                const originalHref = link.href;
                link.innerHTML = '⏳ Processing...';

                try {
                    const item = fileQueue[activeIndex];
                    const dims = calculateDimsForImage(item);
                    const blob = await processImage(item, dims.w, dims.h);
                    await transferManager.saveImage(blob, 'resized_' + item.file.name);
                    window.location.href = originalHref;
                } catch (err) {
                    console.error("Transfer failed", err);
                    alert("Could not transfer image. Navigate anyway?");
                    window.location.href = originalHref;
                }
            }
        });
    });

    // --- Resize Handles Logic ---
    function initResizeHandles() {
        const handles = document.querySelectorAll('.resize-handle');
        let activeHandle = null;
        let startX = 0;
        let startY = 0;
        let startW = 0;
        let startH = 0;
        let ratioW = 1;

        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (fileQueue.length === 0) return;
                e.preventDefault();
                e.stopPropagation();

                activeHandle = handle.dataset.handle;
                startX = e.clientX;
                startY = e.clientY;
                startW = parseInt(inputWidth.value) || 1;
                startH = parseInt(inputHeight.value) || 1;

                const visualW = editorBox.offsetWidth;
                ratioW = visualW > 0 ? startW / visualW : 1;

                document.addEventListener('mousemove', onDrag);
                document.addEventListener('mouseup', stopDrag);
            });
        });

        function onDrag(e) {
            if (!activeHandle) return;
            e.preventDefault();

            const dxScreen = e.clientX - startX;
            const dyScreen = e.clientY - startY;
            const dx = dxScreen * ratioW;
            const dy = dyScreen * ratioW;

            let newW = startW;
            let newH = startH;

            if (activeHandle.includes('r')) newW = startW + dx;
            if (activeHandle.includes('l')) newW = startW - dx;
            if (activeHandle.includes('b')) newH = startH + dy;
            if (activeHandle.includes('t')) newH = startH - dy;

            newW = Math.max(20, newW);
            newH = Math.max(20, newH);

            if (isLocked) {
                newH = Math.round(newW / lockedRatio);
            }

            inputWidth.value = Math.round(newW);
            inputHeight.value = Math.round(newH);
            setAbsolute(Math.round(newW), Math.round(newH));
        }

        function stopDrag() {
            activeHandle = null;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }

    initResizeHandles();
});
