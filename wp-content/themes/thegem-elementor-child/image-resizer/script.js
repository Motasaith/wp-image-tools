
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
    let isSmartMode = false;
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
    blurLayer.style.pointerEvents = 'none'; // Click through
    blurLayer.style.display = 'none';
    editorBox.appendChild(blurLayer); // Append once
    editorBox.insertBefore(blurLayer, targetImage); // Ensure behind target

    // Ensure targetImage is z-index 2
    targetImage.style.position = 'relative'; 
    targetImage.style.zIndex = '5';


    // --- Mode Switching Logic ---
    window.switchMode = (mode) => {
        isSmartMode = (mode === 'smart');
        
        // UI Tabs
        document.getElementById('mode-normal').classList.toggle('active', !isSmartMode);
        document.getElementById('mode-smart').classList.toggle('active', isSmartMode);
        
        // Show/Hide Controls
        smartControlsDiv.style.display = isSmartMode ? 'block' : 'none';
        
        // Update Preview
        updateSmartPreview();
        updateVisualBox(); // Ensure box recalculates
    };

    window.setSmartBg = (type) => {
        smartBgType = type;
        
        // UI Pills
        document.getElementById('bg-blur-opt').classList.toggle('active', type === 'blur');
        document.getElementById('bg-color-opt').classList.toggle('active', type === 'color');
        
        // Color Picker Visibility
        colorPickerWrap.style.display = (type === 'color') ? 'block' : 'none';
        
        updateSmartPreview();
    };
    
    bgColorPicker.addEventListener('input', (e) => {
        smartBgColor = e.target.value;
        updateSmartPreview();
    });
    
    function updateSmartPreview() {
        if (!isSmartMode) {
            // Normal Mode: Image fills box (stretch)
            targetImage.style.objectFit = 'fill'; 
            editorBox.style.background = 'transparent';
            blurLayer.style.display = 'none';
            return;
        }

        // Smart Mode: Image Fits box (contain)
        targetImage.style.objectFit = 'contain';
        
        if (smartBgType === 'blur') {
            // Show Blur Layer
            blurLayer.style.display = 'block';
            editorBox.style.background = '#ccc'; // Fallback
            
            // Sync Blur Source
            if (fileQueue[activeIndex]) {
                blurLayer.src = fileQueue[activeIndex].src;
            }
        } else {
            // Color Mode
            blurLayer.style.display = 'none';
            editorBox.style.background = smartBgColor;
        }
    }


    // --- Upload Handling (Existing modified) ---
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
            
            // Force layout calc
            editorBox.offsetHeight; 
            
            // Set active image
            setActiveImage(fileQueue.length - 1);
            
            // Force visualizer update again after a short delay to ensure transition/layout stability
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
                        lockedRatio = targetW / targetH; // Default lock to original
                    }
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- Queue UI (Existing) ---
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

        if (resizeMode === 'percentage') {
            // PERCENTAGE MODE: Visual Zoom
            // 1. Calculate Base Fit (100%)
            const originalRatio = item.originalW / item.originalH;
            const containerRatio = curContainerW / curContainerH;
            
            let baseFitW, baseFitH;
            if (originalRatio > containerRatio) {
                baseFitW = curContainerW;
                baseFitH = baseFitW / originalRatio;
            } else {
                baseFitH = curContainerH;
                baseFitW = baseFitH * originalRatio;
            }
            
            // 2. Apply Scale
            const scaleFactor = targetPercent / 100;
            finalW = baseFitW * scaleFactor;
            finalH = baseFitH * scaleFactor;
            
        } else {
            // ABSOLUTE MODE (Inputs/Presets): Fit to Screen (Best Fit)
            // Users want to see the SHAPE (Aspect Ratio) fitted in the box, 
            // not the "real" size (which would overflow for HD presets).
            const containerRatio = curContainerW / curContainerH;
            
            if (targetRatio > containerRatio) {
                finalW = curContainerW;
                finalH = finalW / targetRatio;
            } else {
                finalH = curContainerH;
                finalW = finalH * targetRatio;
            }
        }
        
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
                    downloadBtn.innerText = `Processing ${i+1}/${fileQueue.length}...`;
                    const dims = calculateDimsForImage(item);
                    const blob = await processImage(item, dims.w, dims.h);
                    zip.file(`resized_${item.file.name}`, blob);
                }
                downloadBtn.innerText = 'Zipping...';
                const content = await zip.generateAsync({type: "blob"});
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
});
