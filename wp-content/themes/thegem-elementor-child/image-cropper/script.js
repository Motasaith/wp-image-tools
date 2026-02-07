
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const uploadScreen = document.getElementById('upload-screen');
    const fileInput = document.getElementById('file-input');
    const editorBox = document.getElementById('editor-box');
    const targetImage = document.getElementById('target-image');
    const cropOverlay = document.getElementById('crop-overlay');
    const ratioSelect = document.getElementById('ratio-select');
    const downloadBtn = document.getElementById('download-btn');
    const fileQueueDiv = document.getElementById('file-queue');

    // State
    let fileQueue = [];
    let activeIndex = 0;

    // Crop State
    let cropX = 0; // Relative to editorBox (px)
    let cropY = 0;
    let cropW = 0;
    let cropH = 0;
    let imgNaturalW = 0;
    let imgNaturalH = 0;

    let isDragging = false;
    let isResizing = false;
    let activeHandle = null;
    let startX, startY;
    let startCropX, startCropY, startCropW, startCropH;

    let aspectLocked = false;
    let targetRatio = null; // number or null

    // --- Upload Handling ---
    window.handleFileSelect = (input) => {
        if (input.files && input.files.length > 0) handleFiles(Array.from(input.files));
    };
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.backgroundColor = '#eef2ff'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.backgroundColor = ''; });
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
            editorBox.style.display = 'block';
            fileQueueDiv.style.display = 'flex';
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
                        originalW: img.naturalWidth,
                        originalH: img.naturalHeight
                    });
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


    // --- State Persistence Helper ---
    function saveCurrentState() {
        if (!fileQueue[activeIndex]) return;

        // Save RELATIVE coordinates (0-1) so they work if editor size changes slightly
        const item = fileQueue[activeIndex];
        const boxW = editorBox.clientWidth;
        const boxH = editorBox.clientHeight;

        if (boxW > 0 && boxH > 0) {
            item.cropState = {
                rx: cropX / boxW,
                ry: cropY / boxH,
                rw: cropW / boxW,
                rh: cropH / boxH
            };
        }
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
        // Save previous state before switching
        saveCurrentState();

        activeIndex = index;
        const item = fileQueue[index];
        if (!item) return;

        imgNaturalW = item.originalW;
        imgNaturalH = item.originalH;
        targetImage.src = item.src;

        document.querySelectorAll('.queue-item').forEach((el, i) => el.classList.toggle('active', i === index));

        // Polling strategy to ensure layout is caught as soon as DOM renders
        // Run immediately, then check again shortly after
        const runLayout = () => {
            const dims = updateEditorLayout();
            restoreCropState(item, dims);
            updateGrid();
        };

        // 1. Immediate try
        runLayout();

        // 2. Short delay (paint)
        setTimeout(runLayout, 50);

        // 3. Safety delay (slower browsers/reflows)
        setTimeout(runLayout, 200);
    }

    function restoreCropState(item, dims) {
        // Use passed dimensions, or fallback to DOM
        const boxW = (dims && dims.w) ? dims.w : editorBox.clientWidth;
        const boxH = (dims && dims.h) ? dims.h : editorBox.clientHeight;

        if (item.cropState) {
            // Restore from relative
            cropX = item.cropState.rx * boxW;
            cropY = item.cropState.ry * boxH;
            cropW = item.cropState.rw * boxW;
            cropH = item.cropState.rh * boxH;

            // Sanity check bounds
            if (cropW > boxW) cropW = boxW;
            if (cropH > boxH) cropH = boxH;

            renderCropBox();
        } else {
            // No state? Init
            initCropBox(boxW, boxH);
        }
    }


    // --- Layout / Visualizer ---
    let currentEditorW = 0;
    let currentEditorH = 0;

    function updateEditorLayout() {
        if (!imgNaturalW) return { w: 0, h: 0 };

        const container = document.querySelector('.canvas-container');
        // Use 85% of container size to provide ample negative space (Adobe-like feel)
        // Fallback to 600 if container is 0 (e.g. hidden or initializing)
        const availW = (container.clientWidth || 600) * 0.85;
        const availH = (container.clientHeight || 400) * 0.85;

        // Calculate Scale Factor
        // Use Math.min to find the "Contain" scale.
        // Cap at 1.0 to PREVENT UPSCALING (User Feedback: "image not so big")
        let scale = Math.min(availW / imgNaturalW, availH / imgNaturalH);

        // If image is smaller than container, show at 100% natural size.
        if (scale > 1) scale = 1;

        const finalW = imgNaturalW * scale;
        const finalH = imgNaturalH * scale;

        editorBox.style.width = finalW + 'px';
        editorBox.style.height = finalH + 'px';

        currentEditorW = finalW;
        currentEditorH = finalH;

        return { w: finalW, h: finalH };
    }
    window.addEventListener('resize', () => { if (imgNaturalW) updateEditorLayout(); });


    // --- Crop Box Logic ---
    function initCropBox(passedW, passedH) {
        // Use calculated dimensions if available, fallback to clientWidth
        let boxW = passedW || currentEditorW || editorBox.clientWidth;
        let boxH = passedH || currentEditorH || editorBox.clientHeight;

        // --- SAFEGUARD: If dimensions are 0 (first load race condition), Force Calculate ---
        if (!boxW || !boxH) {
            // Re-run fallback logic locally to ensure we have numbers
            // This mimicks updateEditorLayout logic purely for initialization safety
            const availW = 600 * 0.85;
            const availH = 400 * 0.85;
            const scale = (imgNaturalW > 0) ? Math.min(availW / imgNaturalW, availH / imgNaturalH) : 1;

            // If scale was valid calculate, otherwise default to something safe
            if (imgNaturalW > 0) {
                boxW = imgNaturalW * (scale > 1 ? 1 : scale);
                boxH = imgNaturalH * (scale > 1 ? 1 : scale);
            } else {
                // Absolute backup if imgNaturalW is missing (shouldn't happen)
                boxW = 300;
                boxH = 200;
            }
        }

        // Default: 60% coverage (centered square/rect)
        // User request: "small square or rectangle area selected"
        const defaultCoverage = 0.6;

        cropW = boxW * defaultCoverage;
        cropH = boxH * defaultCoverage;

        // --- ABSOLUTE MINIMUM SIZE SAFEGUARD ---
        // Prevents "dot" (zero size) issues if math fails slightly
        if (cropW < 50) cropW = 100;
        if (cropH < 50) cropH = 100;
        if (cropW > boxW) cropW = boxW; // Re-clamp
        if (cropH > boxH) cropH = boxH;

        // If ratio selected, force it while MAXIMIZING size within that coverage
        if (aspectLocked && targetRatio) {
            const proposedRatio = cropW / cropH;

            if (proposedRatio > targetRatio) {
                // Proposed box is wider than target ratio -> Limit width by height
                cropH = boxH * defaultCoverage; // Reset height to default coverage
                cropW = cropH * targetRatio;
            } else {
                // Proposed box is taller than target ratio -> Limit height by width
                cropW = boxW * defaultCoverage; // Reset width to default coverage
                cropH = cropW / targetRatio;
            }
        }

        // Center it
        cropX = (boxW - cropW) / 2;
        cropY = (boxH - cropH) / 2;
        renderCropBox();
    }

    function renderCropBox() {
        cropOverlay.style.left = cropX + 'px';
        cropOverlay.style.top = cropY + 'px';
        cropOverlay.style.width = cropW + 'px';
        cropOverlay.style.height = cropH + 'px';
    }

    function updateGrid() {
        // Find existing grid or create
        let grid = cropOverlay.querySelector('.crop-grid');
        if (!grid) return; // Should exist from HTML
        // CSS handles the grid lines (background gradients)
    }

    // --- Interaction ---
    cropOverlay.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) {
            isResizing = true;
            activeHandle = e.target.dataset.handle;
        } else {
            isDragging = true;
        }

        startX = e.clientX;
        startY = e.clientY;
        startCropX = cropX;
        startCropY = cropY;
        startCropW = cropW;
        startCropH = cropH;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    });

    function onMouseMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const maxW = editorBox.clientWidth;
        const maxH = editorBox.clientHeight;

        if (isDragging) {
            let newX = startCropX + dx;
            let newY = startCropY + dy;

            // Constrain
            newX = Math.max(0, Math.min(newX, maxW - cropW));
            newY = Math.max(0, Math.min(newY, maxH - cropH));

            cropX = newX;
            cropY = newY;

        } else if (isResizing) {
            let newW = startCropW;
            let newH = startCropH;
            let newX = startCropX;
            let newY = startCropY;

            if (activeHandle === 'tr' || activeHandle === 'br') newW = startCropW + dx;
            if (activeHandle === 'tl' || activeHandle === 'bl') {
                newW = startCropW - dx;
                newX = startCropX + dx;
            }
            if (activeHandle === 'bl' || activeHandle === 'br') newH = startCropH + dy;
            if (activeHandle === 'tl' || activeHandle === 'tr') {
                newH = startCropH - dy;
                newY = startCropY + dy;
            }

            // Min Size
            if (newW < 50) { newW = 50; newX = cropX; }
            if (newH < 50) { newH = 50; newY = cropY; }

            // Aspect Lock
            if (aspectLocked && targetRatio) {
                // If changing Width, adjust Height
                // This is a simplified "Width Dominant" lock
                newH = newW / targetRatio;
                // If Y dragged, we might need to adjust X/Y origin?
                // For now, let's keep it simple: Drag corner -> Width changes -> Height follows.
                // We might need to correct Y if expanding UP (tl/tr)
                if (activeHandle === 'tl' || activeHandle === 'tr') {
                    // Correct Y based on new Height change
                    // Delta Height = newH - startCropH
                    // newY = startCropY - (newH - startCropH)
                    // ... this gets complex with origin shifts.
                    // Let's stick to standard resize logic where X/Y are set, then H is forced.
                }
            }

            // Constrain to container
            if (newX < 0) { newW += newX; newX = 0; }
            if (newY < 0) { newH += newY; newY = 0; }

            if (newX + newW > maxW) newW = maxW - newX;
            if (newY + newH > maxH) newH = maxH - newY;

            // Re-apply lock if constraint broke it?
            if (aspectLocked && targetRatio) {
                if (newW / newH !== targetRatio || newH > maxH) {
                    // Simple Force
                    newH = newW / targetRatio;
                    if (newH > maxH) { newH = maxH; newW = newH * targetRatio; }
                }
            }

            cropX = newX;
            cropY = newY;
            cropW = newW;
            cropH = newH;
        }

        renderCropBox();
    }

    function onMouseUp() {
        isDragging = false;
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // --- Ratio Select ---
    ratioSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'free') {
            aspectLocked = false;
            targetRatio = null;
        } else {
            aspectLocked = true;
            const parts = val.split(':');
            targetRatio = parseInt(parts[0]) / parseInt(parts[1]);
            initCropBox(); // Re-init to center nicely
        }
    });

    // --- Download ---
    function updateDownloadBtn() {
        const count = fileQueue.length;
        downloadBtn.innerText = (count > 1) ? `Crop & Download ${count} images (ZIP)` : 'Crop & Download';
    }

    downloadBtn.addEventListener('click', async () => {
        if (fileQueue.length === 0) return;
        saveCurrentState(); // Save current before processing

        downloadBtn.innerText = 'Processing...';

        if (fileQueue.length === 1) {
            await processDownload(fileQueue[0]);
        } else {
            await processBatchDownload();
        }
        updateDownloadBtn();
    });

    async function processBatchDownload() {
        const zip = new JSZip();

        for (let i = 0; i < fileQueue.length; i++) {
            const item = fileQueue[i];
            const blob = await generateCropBlob(item);
            if (blob) {
                const ext = item.file.name.split('.').pop();
                const cleanName = item.file.name.replace(`.${ext}`, '');
                zip.file(`${cleanName}_cropped.${ext}`, blob);
            }
        }

        zip.generateAsync({ type: "blob" }).then(function (content) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = "cropped_images.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    function generateCropBlob(item) {
        return new Promise((resolve) => {
            // Logic to calculate crop. Note: We need to know THE SCALE at which the crop was defined.
            // Problem: cropState is RELATIVE (rx, ry, rw, rh).
            // So we can calculate directly from original dimensions!

            // If cropState exists, use it. If not, use Default (Full/Centered).
            let cx, cy, cw, ch;

            if (item.cropState) {
                cx = item.cropState.rx * item.originalW;
                cy = item.cropState.ry * item.originalH;
                cw = item.cropState.rw * item.originalW;
                ch = item.cropState.rh * item.originalH;
            } else {
                // Default fallback if user never viewed that image?
                // Just do full crop or apply current global ratio?
                // Let's default to FULL center.
                cw = item.originalW;
                ch = item.originalH;
                cx = 0;
                cy = 0;
            }

            const canvas = document.createElement('canvas');
            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext('2d');

            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
                canvas.toBlob(resolve, item.file.type, 0.9);
            };
            img.src = item.src;
        });
    }

    // Legacy single download wrapper
    async function processDownload(item) {
        const blob = await generateCropBlob(item);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cropped_${item.file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Transfer Manager Integration ---
    // 457 (Approximation)
    if (window.transferManager) {
        // 1. Auto-Load
        transferManager.getTransfer().then(data => {
            if (data) {
                let fileObjects = [];
                if (data.files && data.files.length > 0) {
                    fileObjects = data.files.map(f => new File([f.blob], f.filename, { type: f.blob.type || 'image/png' }));
                } else if (data.blob) {
                    fileObjects = [new File([data.blob], data.filename || "transfer.png", { type: data.blob.type || 'image/png' })];
                }

                if (fileObjects.length > 0) {
                    handleFiles(fileObjects);
                    transferManager.clearData();
                }
            }
        });

        // 2. Intercept Sidebar
        const toolLinks = document.querySelectorAll('.tools-list a');
        toolLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                if (fileQueue.length > 0) {
                    let targetIndex = activeIndex !== -1 ? activeIndex : 0;
                    if (targetIndex >= fileQueue.length) targetIndex = 0;

                    const item = fileQueue[targetIndex];
                    if (!item) return;

                    e.preventDefault();
                    link.innerHTML = '⏳ Processing...';
                    const originalHref = link.href;

                    try {
                        // Generate Cropped Blob
                        const blob = await generateCropBlob(item);
                        const nameToSave = 'cropped_' + item.file.name;

                        await transferManager.saveImage(blob, nameToSave);
                        window.location.href = originalHref;
                    } catch (err) {
                        console.error("Transfer failed", err);
                        window.location.href = originalHref;
                    }
                }
            });
        });
    }

});
