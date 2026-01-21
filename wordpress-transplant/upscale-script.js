/* 
 * upscale-script.js
 * Ported from App.jsx for WordPress
 * handles file uploads, API communication, and DOM updates.
 */

(function() {
    // --- State Management ---
    let files = [];
    let activeFileId = null;

    // --- DOM Elements ---
    const fileInput = document.getElementById('file-upload');
    const fileListContainer = document.querySelector('.file-list');
    const upscaleActiveBtn = document.querySelector('.btn-upscale-active'); // To be added in HTML
    const upscaleAllBtn = document.querySelector('.btn-upscale-all');       // To be added in HTML
    const mainContentArea = document.querySelector('.main-content');
    
    // --- Utils ---
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const getExtension = (filename) => filename.split('.').pop().toLowerCase();
    
    const getFileType = (mime) => {
        if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPEG';
        if (mime.includes('png')) return 'PNG';
        if (mime.includes('webp')) return 'WEBP';
        if (mime.includes('bmp')) return 'BMP';
        return 'IMAGE';
    };

    const getImageDimensions = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ width: 0, height: 0 });
            img.src = url;
        });
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
                resolve(encoded);
            };
            reader.onerror = error => reject(error);
        });
    };

    // --- Core Logic ---

    // Generate a UUID-like string
    function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    }

    async function handleFileChange(e) {
        if (!e.target.files || e.target.files.length === 0) return;

        const incomingFiles = Array.from(e.target.files);
        
        for (const file of incomingFiles) {
            const previewUrl = URL.createObjectURL(file);
            const dims = await getImageDimensions(previewUrl);
            const mp = (dims.width * dims.height) / 1000000;

            const newFile = {
                id: uuidv4(),
                file,
                name: file.name,
                previewUrl,
                originalDetails: {
                    size: file.size,
                    width: dims.width,
                    height: dims.height,
                    mime: file.type,
                    type: getFileType(file.type),
                    extension: getExtension(file.name),
                    megapixels: mp.toFixed(3)
                },
                upscaledUrl: null,
                upscaledDetails: null,
                loading: false,
                error: null
            };
            
            files.push(newFile);
            
            // If no active file, set this one
            if (!activeFileId) {
                activeFileId = newFile.id;
            }
        }
        
        render();
    }

    function removeFile(e, id) {
        e.stopPropagation();
        files = files.filter(f => f.id !== id);
        if (activeFileId === id) {
            activeFileId = null;
            if (files.length > 0) activeFileId = files[0].id; // Fallback to first
        }
        render();
    }

    function setActiveFile(id) {
        activeFileId = id;
        render();
    }

    async function upscaleFile(fileId) {
        const fileObj = files.find(f => f.id === fileId);
        if (!fileObj || fileObj.loading || fileObj.upscaledUrl) return;

        // Set Loading State
        fileObj.loading = true;
        fileObj.error = null;
        render();

        try {
            const base64String = await convertToBase64(fileObj.file);

            const response = await fetch('http://localhost:7000/upscale_web', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64String }),
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            const upscaledUrl = `data:image/jpeg;base64,${data.image}`;

            // Get Details
            const res = await fetch(upscaledUrl);
            const blob = await res.blob();
            const size = blob.size;
            const dims = await getImageDimensions(upscaledUrl);
            const mp = (dims.width * dims.height) / 1000000;

             // Update Object
            fileObj.loading = false;
            fileObj.upscaledUrl = upscaledUrl;
            fileObj.operationType = 'upscale'; // Track operation type
            fileObj.upscaledDetails = {
                name: `upscaled_${fileObj.name.split('.')[0]}.jpg`,
                size: size,
                width: dims.width,
                height: dims.height,
                mime: 'image/jpeg',
                type: 'JPEG',
                extension: 'jpg',
                megapixels: mp.toFixed(3)
            };

        } catch (err) {
            console.error(err);
            let msg = 'Failed to upscale';
            if (err.message?.includes('500')) msg = 'Server Error (500): Image too large/incompatible.';
            else if (err.message?.includes('413')) msg = 'File too large.';
            
            fileObj.loading = false;
            fileObj.error = msg;
        }

        render();
    }

    function handleUpscaleActive() {
        if (activeFileId) upscaleFile(activeFileId);
    }
    
    function handleUpscaleAll() {
        files.forEach(f => {
            if (!f.upscaledUrl && !f.loading) {
                upscaleFile(f.id);
            }
        });
    }

    function handleDownload(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- Rendering ---
    // Re-renders the entire UI based on state. 
    // In a real rigorous app we'd diff, but for this scale, full innerHTML replacement is fine.
    
    function render() {
        renderFileList();
        renderMainContent();
        renderControls();
    }

    function renderFileList() {
        fileListContainer.innerHTML = '';
        files.forEach(f => {
            const item = document.createElement('div');
            item.className = `file-item ${f.id === activeFileId ? 'active' : ''}`;
            item.onclick = () => setActiveFile(f.id);
            
            let status = '';
            if (f.loading) status = '...';
            else if (f.error) status = 'Err';
            else if (f.upscaledUrl) status = '✓';

            const statusClass = f.error ? 'error' : (f.upscaledUrl ? 'success' : '');

            item.innerHTML = `
                <div class="file-item-info">
                    <span class="file-item-name" title="${f.name}">${f.name}</span>
                    <span class="file-status ${statusClass}">${status}</span>
                </div>
                <button class="remove-btn">×</button>
            `;

            // Bind Remove Button
            item.querySelector('.remove-btn').onclick = (e) => removeFile(e, f.id);
            
            fileListContainer.appendChild(item);
        });
    }

    function renderControls() {
        const activeFile = files.find(f => f.id === activeFileId);
        
        // Upscale Active Button
        const btnActive = document.getElementById('btn-upscale-active');
        if (btnActive) {
            if (activeFile && activeFile.loading) {
                btnActive.textContent = 'Upscaling...';
                btnActive.disabled = true;
            } else {
                btnActive.textContent = 'Upscale Current';
                btnActive.disabled = !activeFile || !!activeFile.upscaledUrl;
            }
            // Bind click if not already bound? simpler to just re-create or use global listener
            // Ideally we don't re-bind every render. We'll use a global listener delegating or just static binding once.
        }
        
        // Upscale All Button
        const btnAll = document.getElementById('btn-upscale-all');
        if (btnAll) {
             const hasPending = files.some(f => !f.upscaledUrl);
             btnAll.style.display = hasPending ? 'block' : 'none';
        }

        // Error Message
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) errorContainer.innerHTML = '';
        if (activeFile && activeFile.error) {
            errorContainer.innerHTML = `<div class="error-message">${activeFile.error}</div>`;
        }

        // Auto-Populate Resize Dimensions
        if (activeFile && widthInput && heightInput) {
             // Check if we are "initialized" for this file to avoid overwriting user edits?
             // Simplest approach: Use data attribute on one of the inputs
             const currentId = widthInput.getAttribute('data-active-id');
             if (currentId !== activeFile.id) {
                 widthInput.value = activeFile.originalDetails.width;
                 heightInput.value = activeFile.originalDetails.height;
                 widthInput.setAttribute('data-active-id', activeFile.id);
             }
        }
    }

    function renderMainContent() {
        const activeFile = files.find(f => f.id === activeFileId);
        
        if (!activeFile) {
             mainContentArea.innerHTML = `
                <div class="image-comparison">
                  <div class="image-panel">
                    <div class="panel-header">Original</div>
                    <div class="image-wrapper">
                        <div class="placeholder">Select an image from the list</div>
                    </div>
                  </div>
                  <div class="image-panel">
                    <div class="panel-header">Result</div>
                    <div class="image-wrapper">
                        <div class="placeholder">Result will appear here</div>
                    </div>
                  </div>
                </div>
             `;
             return;
        }

        // We have an active file.
        const downloadBtnHtml = activeFile.upscaledUrl ? `
            <button class="download-button" title="Download" id="download-btn-active">⬇</button>
        ` : '';

        // Determine title based on operation
        let resultTitle = 'Result';
        if (activeFile.operationType === 'resize') resultTitle = 'Resized';
        else if (activeFile.operationType === 'crop') resultTitle = 'Cropped';
        else if (activeFile.operationType === 'upscale') resultTitle = 'Upscaled';
        
        // Transfer Button Logic - NOW 3-WAY LOOP
        let transferBtnHtml = '';
        if (activeFile.upscaledUrl) {
            const btnStyle = "padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.5rem;";
            
            // If current is Upscale -> Resize OR Crop
            if (activeFile.operationType === 'upscale') {
                transferBtnHtml += `<button id="btn-transfer-resize" class="secondary-button" style="${btnStyle}">📐 Resize</button>`;
                transferBtnHtml += `<button id="btn-transfer-crop" class="secondary-button" style="${btnStyle}">✂️ Crop</button>`;
            } 
            // If current is Resize -> Upscale OR Crop
            else if (activeFile.operationType === 'resize') {
                transferBtnHtml += `<button id="btn-transfer-upscale" class="secondary-button" style="${btnStyle}">🚀 Upscale</button>`;
                transferBtnHtml += `<button id="btn-transfer-crop" class="secondary-button" style="${btnStyle}">✂️ Crop</button>`;
            }
            // If current is Crop -> Upscale OR Resize
            else if (activeFile.operationType === 'crop') {
                transferBtnHtml += `<button id="btn-transfer-upscale" class="secondary-button" style="${btnStyle}">🚀 Upscale</button>`;
                transferBtnHtml += `<button id="btn-transfer-resize" class="secondary-button" style="${btnStyle}">📐 Resize</button>`;
            }
            // Default/Fallback
            else {
                 transferBtnHtml += `<button id="btn-transfer-upscale" class="secondary-button" style="${btnStyle}">🚀 Upscale</button>`;
                 transferBtnHtml += `<button id="btn-transfer-resize" class="secondary-button" style="${btnStyle}">📐 Resize</button>`;
                 transferBtnHtml += `<button id="btn-transfer-crop" class="secondary-button" style="${btnStyle}">✂️ Crop</button>`;
            }
        }

        const upscaledImageOrPlaceholder = activeFile.upscaledUrl 
            ? `<img src="${activeFile.upscaledUrl}" alt="${resultTitle}" />`
            : `<div class="placeholder">${activeFile.loading ? 'Processing...' : 'Result will appear here'}</div>`;

        // If Crop Mode is active in the DOM (we can't easily check visibility here without complex logic, 
        // but we can check if we are in crop state). 
        // Actually, renderMainContent is generic. The CROP EDITOR needs to be injected if we are in crop tab.
        // But for now, let's keep the standard Comparison View. 
        // The CROP VIEW will be a special overlay on the "Original" side when in Crop Tab.

        let originalContentHtml = `<img src="${activeFile.previewUrl}" alt="Original" id="original-img" />`;
        
        // If we are in crop tab, we might need a container for the cropper
        // We will inject the cropper dynamically in 'initCropView', but we need a target.
        // Let's give the original image unique ID.

        let bottomSection = '';
        if (activeFile.upscaledUrl) {
             // Metadata logic
            const mOld = activeFile.originalDetails;
            const mNew = activeFile.upscaledDetails;
            
            // Only show slider if Upscale
            const sliderHtml = activeFile.operationType === 'upscale' ? `
                    <div class="slider-section">
                        <h2>Comparison Slider</h2>
                        <div class="comparison-slider-container" id="comp-slider">
                            <div class="img-wrapper original-overlay">
                                <img src="${activeFile.previewUrl}" alt="Original" />
                            </div>
                            <div class="img-wrapper upscaled-overlay" style="clip-path: inset(0 50% 0 0);">
                                <img src="${activeFile.upscaledUrl}" alt="Upscaled" />
                            </div>
                            <div class="slider-line" style="left: 50%;">
                                <div class="slider-button">↔</div>
                            </div>
                            <input type="range" min="0" max="100" value="50" class="slider-input" id="slider-range">
                        </div>
                    </div>
            ` : '';

            bottomSection = `
                <div class="detail-table-section" style="margin-top: 2rem;">
                     <div class="metadata-container">
                        <h3>Image Details</h3>
                        <table class="metadata-table">
                            <thead>
                                <tr>
                                    <th>DETAILS</th>
                                    <th><span class="col-icon">🖼️ 1</span> Original</th>
                                    <th><span class="col-icon">🖼️ 2</span> ${resultTitle}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td class="meta-label">File Name</td><td>${activeFile.name}</td><td>${mNew?.name}</td></tr>
                                <tr><td class="meta-label">File Size</td><td>${formatBytes(mOld.size)}</td><td>${formatBytes(mNew?.size)}</td></tr>
                                <tr><td class="meta-label">File Type</td><td>${mOld.type}</td><td>${mNew?.type}</td></tr>
                                <tr><td class="meta-label">MIME Type</td><td>${mOld.mime}</td><td>${mNew?.mime}</td></tr>
                                <tr><td class="meta-label">Dimensions</td><td>${mOld.width}x${mOld.height}</td><td>${mNew?.width}x${mNew?.height}</td></tr>
                                <tr><td class="meta-label">Megapixels</td><td>${mOld.megapixels}</td><td>${mNew?.megapixels}</td></tr>
                            </tbody>
                        </table>
                    </div>
                    ${sliderHtml}
                </div>
            `;
        }

        mainContentArea.innerHTML = `
            <div class="image-comparison">
              <div class="image-panel" id="panel-original">
                <div class="panel-header">Original</div>
                <div class="image-wrapper" id="cropper-container" style="position:relative; overflow:hidden;">
                    ${originalContentHtml}
                    <!-- File crop overlay will be injected here -->
                </div>
              </div>
              <div class="image-panel">
                <div class="panel-header" style="display:flex; align-items:center; justify-content:space-between;">
                    <span>${resultTitle}</span>
                    <div style="display:flex; align-items:center;">
                        ${transferBtnHtml}
                        ${downloadBtnHtml}
                    </div>
                </div>
                <div class="image-wrapper">
                    ${upscaledImageOrPlaceholder}
                </div>
              </div>
            </div>
            ${bottomSection}
        `;

        // Post-Render Bindings
        if (document.getElementById('download-btn-active')) {
            document.getElementById('download-btn-active').onclick = () => handleDownload(activeFile.upscaledUrl, activeFile.upscaledDetails.name);
        }
        
        // Transfer Bindings
        if (document.getElementById('btn-transfer-upscale')) document.getElementById('btn-transfer-upscale').onclick = () => handleTransfer('upscale');
        if (document.getElementById('btn-transfer-resize')) document.getElementById('btn-transfer-resize').onclick = () => handleTransfer('resize');
        if (document.getElementById('btn-transfer-crop')) document.getElementById('btn-transfer-crop').onclick = () => handleTransfer('crop');

        if (document.getElementById('slider-range')) {
            const range = document.getElementById('slider-range');
            range.oninput = (e) => {
                const val = e.target.value;
                const overlay = document.querySelector('.upscaled-overlay');
                const line = document.querySelector('.slider-line');
                if (overlay) overlay.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
                if (line) line.style.left = `${val}%`;
            };
        }
        
        // If we are currently in Crop tab, re-init the view
        if (document.getElementById('tab-btn-crop') && document.getElementById('tab-btn-crop').classList.contains('active')) {
             initCropView();
        }
    }

    // --- Tab Logic ---
    const tabBtnUpscale = document.getElementById('tab-btn-upscale');
    const tabBtnResize = document.getElementById('tab-btn-resize');
    const tabBtnCrop = document.getElementById('tab-btn-crop');
    
    const contentUpscale = document.getElementById('tab-content-upscale');
    const contentResize = document.getElementById('tab-content-resize');
    const contentCrop = document.getElementById('tab-content-crop');

    function switchTab(tab) {
        // Reset all
        [tabBtnUpscale, tabBtnResize, tabBtnCrop].forEach(btn => {
            if(btn) {
                btn.classList.remove('active');
                btn.style.borderBottomColor = 'transparent';
                btn.style.color = 'var(--text-muted)';
            }
        });
        [contentUpscale, contentResize, contentCrop].forEach(content => {
            if(content) content.style.display = 'none';
        });

        // Activate selected
        let activeBtn, activeContent;
        if (tab === 'upscale') {
            activeBtn = tabBtnUpscale;
            activeContent = contentUpscale;
        } else if (tab === 'resize') {
            activeBtn = tabBtnResize;
            activeContent = contentResize;
        } else if (tab === 'crop') {
            activeBtn = tabBtnCrop;
            activeContent = contentCrop;
            initCropView(); // Initialize crop view when switching
        }
        
        // Cleanup Crop Overlay if not in Crop Mode
        if (tab !== 'crop') {
            const existingOverlay = document.getElementById('crop-overlay');
            if (existingOverlay) existingOverlay.remove();
        }

        if (activeBtn && activeContent) {
            activeBtn.classList.add('active');
            activeBtn.style.borderBottomColor = 'var(--primary)';
            activeBtn.style.color = 'var(--text-main)';
            activeContent.style.display = 'block';
        }
    }

    if (tabBtnUpscale) tabBtnUpscale.onclick = () => switchTab('upscale');
    if (tabBtnResize) tabBtnResize.onclick = () => switchTab('resize');
    if (tabBtnCrop) tabBtnCrop.onclick = () => switchTab('crop');

    // --- Resize Logic ---
    
    // Resize Elements
    // Note: 'resize-controls' ID was removed in PHP, using tab content now
    // We just need inputs
    const widthInput = document.getElementById('resize-width');
    const heightInput = document.getElementById('resize-height');
    const aspectCheckbox = document.getElementById('resize-aspect');
    const btnResize = document.getElementById('btn-resize-now');
    // ... helper logic ...

    // ... (keep resizeImage and handleResizeNow same as before) ...
    function resizeImage(file, targetWidth, targetHeight) {
        // ... (same implementation)
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                canvas.toBlob(resolve, file.type, 0.92);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    async function handleResizeNow() {
         // ... (same implementation)
        if (!activeFileId) return;
        const fileObj = files.find(f => f.id === activeFileId);
        if (!fileObj) return;

        const taskW = parseInt(widthInput.value);
        const taskH = parseInt(heightInput.value);

        if (!taskW || !taskH) {
            alert('Please enter valid dimensions');
            return;
        }

        fileObj.loading = true;
        render();

        try {
            const blob = await resizeImage(fileObj.file, taskW, taskH);
            const resizedUrl = URL.createObjectURL(blob);
            
            fileObj.loading = false;
            fileObj.upscaledUrl = resizedUrl;
            fileObj.operationType = 'resize';
            
            const mp = (taskW * taskH) / 1000000;

            fileObj.upscaledDetails = {
                name: `resized_${fileObj.name}`,
                size: blob.size,
                width: taskW,
                height: taskH,
                mime: fileObj.file.type,
                type: getFileType(fileObj.file.type),
                extension: getExtension(fileObj.name),
                megapixels: mp.toFixed(3)
            };

        } catch (err) {
            console.error(err);
            fileObj.loading = false;
            fileObj.error = "Resize Failed";
        }
        render();
    }

    // Aspect Ratio Logic
    function updateDimensions(source, val) {
        if (!activeFileId || !aspectCheckbox.checked) return;
        const fileObj = files.find(f => f.id === activeFileId);
        if (!fileObj || !fileObj.originalDetails) return;

        const aspect = fileObj.originalDetails.width / fileObj.originalDetails.height;

        if (source === 'w') {
             heightInput.value = Math.round(val / aspect);
        } else {
             widthInput.value = Math.round(val * aspect);
        }
    }

    // --- Crop Logic ---
    let cropState = {
        isDragging: false,
        startX: 0,
        startY: 0,
        cropX: 0,
        cropY: 0,
        cropW: 100,
        cropH: 100,
        imgW: 0,
        imgH: 0,
        aspectRatio: null // 'free', 1, 1.333, 1.777
    };

    function initCropView() {
        if (!activeFileId) return;
        
        const container = document.getElementById('cropper-container');
        const img = document.getElementById('original-img');
        
        if (!container || !img) return;
        
        // Remove existing overlay if any
        const existingOverlay = document.getElementById('crop-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        // Wait for image to load to get dimensions
        if (!img.complete) {
            img.onload = initCropView;
            return;
        }

        cropState.imgW = img.offsetWidth;
        cropState.imgH = img.offsetHeight;

        // Create Overlay
        const overlay = document.createElement('div');
        overlay.id = 'crop-overlay';
        overlay.style.position = 'absolute';
        overlay.style.border = '2px dashed #fff';
        overlay.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)';
        overlay.style.cursor = 'move';
        
        // Initial position inside the image
        overlay.style.top = (img.offsetTop + 10) + 'px';
        overlay.style.left = (img.offsetLeft + 10) + 'px';
        overlay.style.width = '100px';
        overlay.style.height = '100px';
        
        // Resize Handles
        const handleStyle = "position:absolute; width:10px; height:10px; background:#fff; border:1px solid #000;";
        const seHandle = document.createElement('div');
        seHandle.style.cssText = handleStyle + "bottom:-5px; right:-5px; cursor:se-resize;";
        seHandle.className = 'crop-handle se';
        
        overlay.appendChild(seHandle);
        container.appendChild(overlay);

        // Events
        overlay.addEventListener('mousedown', startDrag);
        seHandle.addEventListener('mousedown', startResize);
        
        // Bind Preset Buttons
        const aspectBtns = document.querySelectorAll('.aspect-btn');
        aspectBtns.forEach(btn => {
            btn.onclick = () => {
                aspectBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const r = btn.getAttribute('data-ratio');
                cropState.aspectRatio = r === 'free' ? null : parseFloat(r);
                applyAspect();
            }
        });
        
        // Bind Crop Now
        const btnCrop = document.getElementById('btn-crop-now');
        if (btnCrop) btnCrop.onclick = performCrop;
    }
    
    function applyAspect() {
        const overlay = document.getElementById('crop-overlay');
        if(!overlay || !cropState.aspectRatio) return;
        
        let w = parseInt(overlay.style.width);
        let h = w / cropState.aspectRatio;
        
        // Check bounds
        if (h > cropState.imgH) {
            h = cropState.imgH;
            w = h * cropState.aspectRatio;
        }
        
        overlay.style.width = w + 'px';
        overlay.style.height = h + 'px';
    }

    function startDrag(e) {
        if (e.target.classList.contains('crop-handle')) return;
        e.preventDefault();
        cropState.isDragging = 'move';
        cropState.startX = e.clientX - parseInt(document.getElementById('crop-overlay').style.left || 0);
        cropState.startY = e.clientY - parseInt(document.getElementById('crop-overlay').style.top || 0);
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    }

    function startResize(e) {
        e.preventDefault();
        e.stopPropagation();
        cropState.isDragging = 'resize';
        cropState.startX = e.clientX;
        cropState.startY = e.clientY;
        cropState.startW = parseInt(document.getElementById('crop-overlay').style.width);
        cropState.startH = parseInt(document.getElementById('crop-overlay').style.height);
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    }

    function onDrag(e) {
        const overlay = document.getElementById('crop-overlay');
        const img = document.getElementById('original-img'); // Get ref to image for strict bounds
        if (!overlay || !img) return;

        // Image Boundaries within Container
        const minX = img.offsetLeft;
        const minY = img.offsetTop;
        const maxX = minX + img.offsetWidth;
        const maxY = minY + img.offsetHeight;

        if (cropState.isDragging === 'move') {
            let x = e.clientX - cropState.startX;
            let y = e.clientY - cropState.startY;
            
            const w = parseInt(overlay.style.width);
            const h = parseInt(overlay.style.height);
            
            // Constrain to Image Area
            if (x < minX) x = minX;
            if (y < minY) y = minY;
            if (x + w > maxX) x = maxX - w;
            if (y + h > maxY) y = maxY - h;
            
            overlay.style.left = x + 'px';
            overlay.style.top = y + 'px';

        } else if (cropState.isDragging === 'resize') {
            let dx = e.clientX - cropState.startX;
            let dy = e.clientY - cropState.startY;
            
            let newW = cropState.startW + dx;
            let newH = cropState.startH + dy;
            
            if (cropState.aspectRatio) {
                newH = newW / cropState.aspectRatio;
            }
            
            if(newW < 20) newW = 20;
            if(newH < 20) newH = 20;
            
             // Bounds check
             const currentX = parseInt(overlay.style.left);
             const currentY = parseInt(overlay.style.top);

            if (currentX + newW > maxX) newW = maxX - currentX;
            if (currentY + newH > maxY) newH = maxY - currentY;

            overlay.style.width = newW + 'px';
            overlay.style.height = newH + 'px';
        }
    }

    function stopDrag() {
        cropState.isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    }

    async function performCrop() {
         if (!activeFileId) return;
        
        // 1. Capture State BEFORE modification/render
        const fileObj = files.find(f => f.id === activeFileId);
        const overlay = document.getElementById('crop-overlay');
        const imgDisplay = document.getElementById('original-img');
        
        if (!fileObj || !overlay || !imgDisplay) {
            console.error("Missing elements for crop");
            return;
        }

        // Validate Dimensions
        if (imgDisplay.offsetWidth === 0 || imgDisplay.offsetHeight === 0) {
             alert("Image not fully loaded or visible. Please try again.");
             return;
        }

        // Calculate Scale
        const scaleX = fileObj.originalDetails.width / imgDisplay.offsetWidth;
        const scaleY = fileObj.originalDetails.height / imgDisplay.offsetHeight;
        
        // Correct Coordinates for Centered Image
        // overlay.offsetLeft is relative to container (0,0)
        // imgDisplay.offsetLeft is start of image within container
        // We want (overlay_pos - img_pos) to get pos relative to image
        
        let relativeX = overlay.offsetLeft - imgDisplay.offsetLeft;
        let relativeY = overlay.offsetTop - imgDisplay.offsetTop;

        // Clamp to 0 to avoid negative due to sub-pixel borders
        if (relativeX < 0) relativeX = 0;
        if (relativeY < 0) relativeY = 0;
        
        const cropX = relativeX * scaleX;
        const cropY = relativeY * scaleY;
        const cropW = overlay.offsetWidth * scaleX;
        const cropH = overlay.offsetHeight * scaleY;

        if (!Number.isFinite(cropW) || cropW <= 0 || !Number.isFinite(cropH) || cropH <= 0) {
             alert("Invalid crop dimensions. Please adjust selection.");
             return;
        }

        // 2. Update UI to Loading
        fileObj.loading = true;
        render();

        try {
            const img = new Image();
            img.crossOrigin = "anonymous"; 
            img.src = fileObj.previewUrl;
            
            await new Promise((r, j) => {
                if (img.complete) r();
                else {
                    img.onload = r;
                    img.onerror = () => j("Failed to load source image");
                }
            });
            
            const canvas = document.createElement('canvas');
            canvas.width = cropW;
            canvas.height = cropH;
            const ctx = canvas.getContext('2d');
            
            // Draw using the corrected source coordinates
            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
            
            if (!blob) throw new Error("Canvas result empty. Check crop bounds.");

            const croppedUrl = URL.createObjectURL(blob);
            const mp = (cropW * cropH) / 1000000;
            
            fileObj.loading = false;
            fileObj.upscaledUrl = croppedUrl;
            fileObj.operationType = 'crop';
            fileObj.upscaledDetails = {
                name: `cropped_${fileObj.name}`,
                size: blob.size,
                width: Math.round(cropW),
                height: Math.round(cropH),
                mime: 'image/jpeg',
                type: 'JPEG',
                extension: 'jpg',
                megapixels: mp.toFixed(3)
            };
            
        } catch (e) {
            console.error(e);
            fileObj.loading = false;
            fileObj.error = "Crop Failed: " + (e.message || e);
        }
        
        render();
        // Re-init happens in render if tab is active
    }


    // --- Bulk Resize Logic ---
    async function handleResizeAll() {
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        const maintainAspect = aspectCheckbox.checked;

        if (!width && !height) {
            alert("Please enter target dimensions.");
            return;
        }

        // Filter valid targets
        const targets = files.filter(f => !f.upscaledUrl && !f.loading);
        if (targets.length === 0) return;

        // Process sequentially
        for (const fileObj of targets) {
             fileObj.loading = true;
             render(); // Show loading state

             try {
                // Calculate dimensions if aspect needed
                let taskW = width;
                let taskH = height;
                
                if (maintainAspect && fileObj.originalDetails) {
                    const aspect = fileObj.originalDetails.width / fileObj.originalDetails.height;
                    if (taskW && !taskH) taskH = Math.round(taskW / aspect);
                    else if (!taskW && taskH) taskW = Math.round(taskH * aspect);
                    else if (taskW && taskH) {
                         // If both present, maybe fit? currently strictly uses inputs.
                         // For bulk, let's assume if both present we force it.
                    }
                }
                
                // Fallback
                if (!taskW) taskW = fileObj.originalDetails.width;
                if (!taskH) taskH = fileObj.originalDetails.height;

                const blob = await resizeImage(fileObj.file, taskW, taskH);
                const resizedUrl = URL.createObjectURL(blob);
                const mp = (taskW * taskH) / 1000000;
                
                fileObj.upscaledUrl = resizedUrl;
                fileObj.operationType = 'resize';
                fileObj.upscaledDetails = {
                    name: `resized_${fileObj.name}`,
                    size: blob.size,
                    width: taskW,
                    height: taskH,
                    mime: fileObj.file.type,
                    type: getFileType(fileObj.file.type),
                    extension: getExtension(fileObj.name),
                    megapixels: mp.toFixed(3)
                };

             } catch (e) {
                 console.error(e);
                 fileObj.error = "Resize Failed";
             }
             fileObj.loading = false;
        }
        render();
    }


    // --- Workflow Transfer Logic ---
    async function addNewFileFromBlob(blob, name) {
        const file = new File([blob], name, { type: blob.type });
        const previewUrl = URL.createObjectURL(file);
        const dims = await getImageDimensions(previewUrl);
        const mp = (dims.width * dims.height) / 1000000;

        const newFile = {
            id: uuidv4(),
            file,
            name: name,
            previewUrl,
            originalDetails: {
                size: file.size,
                width: dims.width,
                height: dims.height,
                mime: file.type,
                type: getFileType(file.type),
                extension: getExtension(name),
                megapixels: mp.toFixed(3)
            },
            upscaledUrl: null,
            upscaledDetails: null,
            loading: false,
            error: null
        };
        
        files.push(newFile);
        setActiveFile(newFile.id); // Triggers render
    }

    async function handleTransfer(targetMode) {
        if (!activeFileId) return;
        const fileObj = files.find(f => f.id === activeFileId);
        if (!fileObj || !fileObj.upscaledUrl) return;

        try {
            const res = await fetch(fileObj.upscaledUrl);
            const blob = await res.blob();
            // Create a name for the new file
            // Rename logic to prevent huge filenames like "resized_upscaled_cropped_..."
            let baseParams = fileObj.upscaledDetails.name;
            if(!baseParams.includes(targetMode)) {
               // Append mode if not present
               // Actually simplier to just keep appending so history is clear?
               // Let's just use the current output name.
            }
            
            await addNewFileFromBlob(blob, fileObj.upscaledDetails.name);
            switchTab(targetMode);

        } catch (e) {
            console.error("Transfer failed", e);
            alert("Could not transfer image.");
        }
    }

    // --- Initialization ---
    // Bind global static controls
    document.getElementById('btn-upscale-active').addEventListener('click', handleUpscaleActive);
    document.getElementById('btn-upscale-all').addEventListener('click', handleUpscaleAll);
    fileInput.addEventListener('change', handleFileChange);

    // Resize Bindings
    if (btnResize) btnResize.addEventListener('click', handleResizeNow);
    if (widthInput) widthInput.addEventListener('input', (e) => updateDimensions('w', e.target.value));
    if (heightInput) heightInput.addEventListener('input', (e) => updateDimensions('h', e.target.value));
    
    // Bulk Resize
    const btnResizeAll = document.getElementById('btn-resize-all');
    if (btnResizeAll) btnResizeAll.addEventListener('click', handleResizeAll);

    // Initial render
    render();

    // Resize All Visibility Toggle
    // We need to check constantly or just show it if pending files exist?
    // Let's do it in renderControls logic if we had one.
    // For now, let's patch render() to toggle display.
    const _originalRender = render;
    render = function() {
        _originalRender(); // Call original render logic (which includes renderFileList etc)
        
        // Custom Patch for Resize All Button visibility
        const pending = files.some(f => !f.upscaledUrl);
        const btn = document.getElementById('btn-resize-all');
        if(btn) btn.style.display = pending ? 'block' : 'none';
    }

})();
