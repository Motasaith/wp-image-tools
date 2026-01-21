
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
        
        // Timeout to allow image paint, then layout
        setTimeout(() => {
            updateEditorLayout();
            
            // Restore State or Init
            restoreCropState(item);
            
            updateGrid();
        }, 50);
    }
    
    function restoreCropState(item) {
        const boxW = editorBox.clientWidth;
        const boxH = editorBox.clientHeight;

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
            initCropBox();
        }
    }


    // --- Layout / Visualizer ---
    function updateEditorLayout() {
        if (!imgNaturalW) return;
        
        const container = document.querySelector('.canvas-container');
        // Use 85% of container size to provide ample negative space (Adobe-like feel)
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
    }
    window.addEventListener('resize', () => { if (imgNaturalW) updateEditorLayout(); });


    // --- Crop Box Logic ---
    function initCropBox() {
        const boxW = editorBox.clientWidth;
        const boxH = editorBox.clientHeight;
        
        // Default: Full coverage (minus slight margin for visibility of handles)
        cropW = boxW;
        cropH = boxH;
        
        // If ratio selected, force it while MAXIMIZING size
        if (aspectLocked && targetRatio) {
            // Check if current Full Box is wider or taller than target ratio relative to box
            const boxRatio = boxW / boxH;
            
            if (boxRatio > targetRatio) {
                // Box is wider than target -> Limit Width, Height = Full
                cropH = boxH;
                cropW = cropH * targetRatio;
            } else {
                // Box is taller than target -> Limit Height, Width = Full
                cropW = boxW;
                cropH = cropW / targetRatio;
            }
            
            // Apply slight inset (95%) so it doesn't touch edges exactl? 
            // Actually users prefer maximizing. Let's keep 100% fit for Ratio, 
            // but for Free, let's do 98%?
            cropW *= 0.98;
            cropH *= 0.98;
        }
        
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
        
        zip.generateAsync({type:"blob"}).then(function(content) {
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

});
