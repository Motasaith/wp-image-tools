
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const uploadScreen = document.getElementById('upload-screen');
    const fileInput = document.getElementById('file-input');
    const editorBox = document.getElementById('editor-box');
    const targetImage = document.getElementById('target-image'); // The main img
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
    let lockedRatio = 1; // Store the aspect ratio to lock to

    // Smart Mode State
    let isSmartMode = true; // Default to Smart
    let smartBgType = 'blur'; // 'blur' | 'color'
    let smartBgColor = '#ffffff';

    // --- Helper: Insert blur layer if missing ---
    let blurLayer = document.createElement('img');
    blurLayer.className = 'blur-layer';
    blurLayer.style.position = 'absolute';
    blurLayer.style.top = '0';
    blurLayer.style.left = '0';
    blurLayer.style.width = '100%';
    blurLayer.style.height = '100%';
    blurLayer.style.objectFit = 'cover';
    blurLayer.style.filter = 'blur(20px)';
    blurLayer.style.opacity = '0.8';
    blurLayer.style.zIndex = '1';
    blurLayer.style.pointerEvents = 'none';
    blurLayer.style.display = 'none';
    editorBox.appendChild(blurLayer);
    editorBox.insertBefore(blurLayer, targetImage);

    targetImage.style.position = 'relative';
    targetImage.style.zIndex = '5';

    // --- Mode Switching Logic ---
    window.switchMode = (mode) => {
        isSmartMode = (mode === 'smart');
        document.getElementById('mode-normal').classList.toggle('active', !isSmartMode);
        document.getElementById('mode-smart').classList.toggle('active', isSmartMode);
        smartControlsDiv.style.display = isSmartMode ? 'block' : 'none';
        updateSmartPreview();
        updateVisualBox();
    };

    window.setSmartBg = (type) => {
        smartBgType = type;
        document.getElementById('bg-blur-opt').classList.toggle('active', type === 'blur');
        document.getElementById('bg-color-opt').classList.toggle('active', type === 'color');
        colorPickerWrap.style.display = (type === 'color') ? 'block' : 'none';
        updateSmartPreview();
    };

    bgColorPicker.addEventListener('input', (e) => {
        smartBgColor = e.target.value;
        updateSmartPreview();
    });

    function updateSmartPreview() {
        if (!isSmartMode) {
            targetImage.style.objectFit = 'fill';
            editorBox.style.background = 'transparent';
            blurLayer.style.display = 'none';
            return;
        }
        targetImage.style.objectFit = 'contain';
        if (smartBgType === 'blur') {
            blurLayer.style.display = 'block';
            editorBox.style.background = '#ccc';
            if (fileQueue[activeIndex]) {
                blurLayer.src = fileQueue[activeIndex].src;
            }
        } else {
            blurLayer.style.display = 'none';
            editorBox.style.background = smartBgColor;
        }
    }

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
            setTimeout(() => {
                updateVisualBox();
                updateSmartPreview();
            }, 50);
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

    // --- Queue UI with Add Button ---
    function updateQueueUI() {
        fileQueueDiv.innerHTML = '';

        // Add Button
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

        targetImage.src = item.src;
        // Also update blur layer src if needed
        blurLayer.src = item.src;

        // If first load or mode consistency?
        // Let's NOT reset targetW/H here to keep batch settings consistent

        document.querySelectorAll('.queue-item').forEach((el, i) => el.classList.toggle('active', i === index));
        updateInputsFromState();
        updateVisualBox();
        updateSmartPreview(); // Re-apply styles
    }

    // --- Resizing Logic (Existing) ---
    function calculateDimsForImage(item) {
        let w, h;
        if (resizeMode === 'percentage') {
            w = Math.round(item.originalW * (targetPercent / 100));
            h = Math.round(item.originalH * (targetPercent / 100));
        } else {
            w = targetW;
            h = targetH;
        }
        return { w, h };
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
        targetW = w;
        targetH = h;
        updateVisualBox();
    }

    inputWidth.addEventListener('input', (e) => {
        let w = parseInt(e.target.value) || 0;
        let h = parseInt(inputHeight.value) || 0;

        if (isLocked) {
            h = Math.round(w / lockedRatio);
            inputHeight.value = h;
        }

        // If not locked, we just accept the value, but we update lockedRatio IF we re-lock later?
        // No, setAbsolute updates targetW/H.
        setAbsolute(w, h);
    });

    inputHeight.addEventListener('input', (e) => {
        let h = parseInt(e.target.value) || 0;
        let w = parseInt(inputWidth.value) || 0;

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

        // When scaling by %, we revert to the Original Aspect Ratio effectively
        // So we should probably update the lock calculation? 
        // Or just let updateInputsFromState handle it.
        updateInputsFromState();

        // Update lockedRatio to match the new dimensions (which are based on original ratio)
        if (fileQueue[activeIndex]) {
            const item = fileQueue[activeIndex];
            lockedRatio = item.originalW / item.originalH;
        }

        updateVisualBox();
    });

    // Presets
    const presets = {
        'instagram-story': [1080, 1920],
        'instagram-post': [1080, 1080],
        'youtube-thumb': [1280, 720],
        'facebook-cover': [820, 312]
    };
    presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (presets[val]) {
            const [w, h] = presets[val];
            inputWidth.value = w;
            inputHeight.value = h;

            // Update lock ratio FIRST so setAbsolute uses logic if needed (though setAbsolute overrides)
            lockedRatio = w / h;

            setAbsolute(w, h);

            // Ensure inputs are valid
            if (isLocked) {
                // Double check height to ensure precision
                // inputHeight.value = Math.round(w / lockedRatio); 
            }
        }
    });

    linkAspectBtn.addEventListener('click', () => {
        isLocked = !isLocked;
        linkAspectBtn.classList.toggle('locked');
        linkAspectBtn.innerHTML = isLocked ? '<span style="font-size: 1.2rem;">∞</span>' : '<span style="font-size: 1.2rem; opacity: 0.5;">∞</span>';

        if (isLocked) {
            // Upon Locking, capture the PRESENT ratio
            const currW = parseInt(inputWidth.value) || 0;
            const currH = parseInt(inputHeight.value) || 1;
            lockedRatio = currW / currH;
        }
    });

    function updateVisualBox() {
        const item = fileQueue[activeIndex];
        if (!item) return;

        // Current Target Dimensions
        const dims = calculateDimsForImage(item);
        const targetW = dims.w;
        const targetH = dims.h;
        const targetRatio = targetW / targetH;

        // Container Dimensions
        const container = document.querySelector('.canvas-container');
        const curContainerW = (container.clientWidth || 300) - 40;
        const curContainerH = (container.clientHeight || 400) - 40;

        let finalW, finalH;

        // UNIFIED VISUAL LOGIC
        // We always base the visual scale on "How well the ORIGINAL image fits the container".
        // Then we scale that visual representation by the Target/Original ratio.
        // This ensures visual size creates a 1:1 feedback loop with dragging and matches slider behavior.

        // 1. Calculate Base Fit Scale (fit the Original Image into the Container)
        // If image is 4000x3000 and container is 800x600, scale is 0.2.
        const scaleX = curContainerW / item.originalW;
        const scaleY = curContainerH / item.originalH;
        let baseFitScale = Math.min(scaleX, scaleY);

        // Optional: If original is smaller than container, base scale can be 1 (don't auto-upscale small images?)
        // Standard behavior is "Fit", so usually we max out at 1 if we don't want pixelation on load.
        // But for "Standard Editor" feel, we usually zoom fit. Let's stick to true fit.
        // if (baseFitScale > 1) baseFitScale = 1; 

        // 2. Calculate "Current Zoom/Scale" based on Target Dimensions
        // Percentage Mode: scaleFactor = percent/100
        // Absolute Mode: scaleFactor = targetW / originalW
        let currentScaleFactor = 1;

        if (resizeMode === 'percentage') {
            currentScaleFactor = targetPercent / 100;
        } else {
            // Avoid division by zero
            currentScaleFactor = item.originalW > 0 ? (targetW / item.originalW) : 1;
        }

        // 3. Final Visual Dimensions
        finalW = item.originalW * baseFitScale * currentScaleFactor;
        finalH = item.originalH * baseFitScale * currentScaleFactor;

        editorBox.style.width = finalW + 'px';
        editorBox.style.height = finalH + 'px';
        editorBox.style.aspectRatio = `${targetW} / ${targetH}`; // Keep logical ratio for CSS fallback
    }

    window.addEventListener('resize', () => {
        if (fileQueue.length > 0) updateVisualBox();
    });


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

    // --- CORE PROCESSOR: Handles Smart Mode Logic ---
    function processImage(item, targetW, targetH) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');

            const img = new Image();
            img.onload = () => {

                if (!isSmartMode) {
                    // Normal = Stretch
                    ctx.drawImage(img, 0, 0, targetW, targetH);
                } else {
                    // Smart Mode

                    // 1. Background
                    if (smartBgType === 'color') {
                        ctx.fillStyle = smartBgColor;
                        ctx.fillRect(0, 0, targetW, targetH);
                    } else {
                        // Blur
                        ctx.save();
                        ctx.filter = 'blur(20px)'; // Standard canvas blur
                        // Draw stretched background
                        // We scale it slightly larger to avoid edge bleeding? 
                        // Or just stretch.
                        ctx.drawImage(img, 0, 0, targetW, targetH);
                        // Overlay slightly so it's not too intense?
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Lighten
                        // ctx.fillRect(0,0, targetW, targetH);
                        ctx.restore();
                    }

                    // 2. Foreground (Fit/Contain)
                    // Calculate ratios
                    const imgRatio = img.naturalWidth / img.naturalHeight;
                    const targetRatio = targetW / targetH;

                    let drawW, drawH, drawX, drawY;

                    if (imgRatio > targetRatio) {
                        // Image is wider than target -> Fit Width
                        drawW = targetW;
                        drawH = targetW / imgRatio;
                        drawX = 0;
                        drawY = (targetH - drawH) / 2;
                    } else {
                        // Image is taller -> Fit Height
                        drawH = targetH;
                        drawW = targetH * imgRatio;
                        drawX = (targetW - drawW) / 2;
                        drawY = 0;
                    }

                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                }

                let mime = item.file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
                canvas.toBlob(blob => resolve(blob), mime, 0.9);
            };
            img.src = item.src;
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

    // 1. Auto-Load from Transfer
    // 1. Auto-Load from Transfer
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
                    handleFiles(fileObjects).then(() => {
                        // transferManager.clearData(); // Optional: clear strictly after load
                    });
                    // Clear after a moment to ensure it doesn't loop if reload happens? 
                    // Or just clear immediately.
                    transferManager.clearData();
                }
            }
        });
    }

    // 2. Intercept Sidebar Links
    const toolLinks = document.querySelectorAll('.tools-list a');
    toolLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            // Only capture if we have an active image
            if (fileQueue.length > 0) {
                e.preventDefault();
                const originalHref = link.href;

                const btn = link; // Visual feedback?
                const originalText = link.innerHTML;
                link.innerHTML = '⏳ Processing...';

                try {
                    // Generate Blob for ACTIVE image
                    const item = fileQueue[activeIndex];

                    // We must use "calculateDimsForImage" to initiate the "Processed" version
                    // Or do we transfer original? User said "processed pic".
                    const dims = calculateDimsForImage(item);
                    const blob = await processImage(item, dims.w, dims.h);

                    await transferManager.saveImage(blob, 'resized_' + item.file.name);

                    // Navigate
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
        let ratioW = 1; // Image Pixels per Screen Pixel

        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (fileQueue.length === 0) return;
                e.preventDefault();
                e.stopPropagation();

                activeHandle = handle.dataset.handle; // tl, tr, bl, br
                startX = e.clientX;
                startY = e.clientY;

                // Current Input Values
                startW = parseInt(inputWidth.value) || 0;
                startH = parseInt(inputHeight.value) || 0;

                // Calculate Ratio (Image Pixels : Screen Pixels)
                // We assume editorBox visual width corresponds to inputWidth
                const visualW = editorBox.offsetWidth;
                if (visualW > 0) {
                    ratioW = startW / visualW;
                } else {
                    ratioW = 1;
                }

                document.addEventListener('mousemove', onDrag);
                document.addEventListener('mouseup', stopDrag);
            });
        });

        function onDrag(e) {
            if (!activeHandle) return;
            e.preventDefault();

            const dxScreen = e.clientX - startX;
            const dyScreen = e.clientY - startY;

            // Convert screen delta to image delta
            const dx = dxScreen * ratioW;
            const dy = dyScreen * ratioW; // Use same ratio for square pixels? Yes.

            let newW = startW;
            let newH = startH;

            // Apply Delta based on Handle
            if (activeHandle.includes('r')) newW = startW + dx;
            if (activeHandle.includes('l')) newW = startW - dx;
            if (activeHandle.includes('b')) newH = startH + dy;
            if (activeHandle.includes('t')) newH = startH - dy;

            // Minimum 20px
            if (newW < 20) newW = 20;
            if (newH < 20) newH = 20;

            // Aspect Ratio Lock
            if (isLocked) {
                // Determine dominant axis or just use Width to drive Height?
                // Usually nicer to use the larger delta, but simple version:
                // If corner, we might want to preserve the ratio of the drag direction?
                // Simplest: Set W, calc H.

                // If dragging a Width-only handle (e.g. Right/Left middle - not impl here), use W.
                // For corners:
                // Let's rely on the Width change to drive Height for consistency with inputs

                // Allow Width to change freely
                // Recalculate H
                newH = Math.round(newW / lockedRatio);
            }

            // Update State & Inputs
            inputWidth.value = Math.round(newW);
            inputHeight.value = Math.round(newH);

            // Trigger Absolute Update (updates visuals)
            setAbsolute(Math.round(newW), Math.round(newH));
        }

        function stopDrag() {
            activeHandle = null;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }

    // Initialize Handles
    initResizeHandles();

});
