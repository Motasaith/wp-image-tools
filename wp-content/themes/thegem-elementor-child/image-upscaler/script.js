/* 
 * upscale-script.js
 * handles file uploads, API communication, and DOM updates for AI Upscaler.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let files = [];
    let activeFileId = null;

    // --- DOM Elements ---
    const fileInput = document.getElementById('file-upload');
    const fileListContainer = document.querySelector('.file-list');
    const mainContentArea = document.getElementById('upscale-app-root') || document.querySelector('.main-content');

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

    // --- File Processing Logic ---

    async function processFiles(fileList) {
        let incomingFiles = Array.from(fileList);
        if (incomingFiles.length === 0) return;

        // --- GUEST LIMIT CHECK ---
        const isLoggedIn = (typeof upscalerSettings !== 'undefined') ? upscalerSettings.isLoggedIn : false;

        if (!isLoggedIn) {
            // If dragging more than 1 file, truncate and warn
            if (incomingFiles.length > 1) {
                showLoginModal();
                incomingFiles = [incomingFiles[0]];
            }

            // If trying to add a 2nd file when 1 is already there, block it
            if (files.length > 0) {
                // Check if we already have a file (regardless of selection)
                // Or we can just replace the current file? 
                // "Limit 1 image" usually means 1 in the list.
                // Let's replace the existing list if they upload a new one, or block?
                // Standard behavior: Append. But for limit 1, we should probably Clear & Add or Block.
                // Let's Block to be safe and force them to delete manually if they want another.
                showLoginModal();
                return;
                // Alternatively, we could clear: files = []; render(); then proceed. 
                // But replacing might lose work (upscaled result). Blocking is safer.
            }
        }

        let firstNewFileId = null;

        for (const file of incomingFiles) {
            // Basic validation
            if (!file.type.startsWith('image/')) continue;

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
                upscaledUrl: null,
                upscaledDetails: null,
                loading: false,
                error: null,
                selected: false // Default not select
            };

            files.push(newFile);
            if (!firstNewFileId) firstNewFileId = newFile.id;
        }

        // Auto-select the first newly added file
        if (firstNewFileId) {
            setActiveFile(firstNewFileId);
        } else {
            render();
        }
    }

    async function handleFileChange(e) {
        if (e.target.files && e.target.files.length > 0) {
            await processFiles(e.target.files);
        }
        // Reset input so same file can be selected again if needed
        if (e.target.value) e.target.value = '';
    }

    // --- Drag and Drop Logic ---
    // --- Drag and Drop Logic ---
    function initDragAndDrop() {
        const fileLabel = document.querySelector('.file-label');
        const mainContent = document.querySelector('.main-content'); // Additional target

        // Prevent default behavior everywhere to stop opening files in browser
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function highlight() {
            if (fileLabel) fileLabel.classList.add('drag-active');
            const singleView = document.querySelector('.single-image-view');
            if (singleView) singleView.classList.add('drag-active');
        }

        function unhighlight() {
            if (fileLabel) fileLabel.classList.remove('drag-active');
            const singleView = document.querySelector('.single-image-view');
            if (singleView) singleView.classList.remove('drag-active');
        }

        // Add visual feedback listeners to the entire app wrapper
        const appWrapper = document.querySelector('.upscale-dashboard-wrapper');
        if (appWrapper) {
            appWrapper.addEventListener('dragenter', highlight, false);
            appWrapper.addEventListener('dragover', highlight, false);
            appWrapper.addEventListener('dragleave', unhighlight, false);
            appWrapper.addEventListener('drop', (e) => {
                unhighlight();
                const dt = e.dataTransfer;
                const files = dt.files;
                processFiles(files);
            }, false);
        }

        // Click to Upload for Main Box (Delegation)
        if (mainContent) {
            mainContent.addEventListener('click', (e) => {
                // Only trigger if clicking the empty single view or placeholder
                if (e.target.closest('.single-image-view') || e.target.classList.contains('placeholder')) {
                    const fileInput = document.getElementById('file-upload');
                    if (fileInput) fileInput.click();
                }
            });
        }
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

            const response = await fetch('/wp-json/thegem/v1/upscaler/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': (typeof upscalerSettings !== 'undefined' && upscalerSettings.nonce) ? upscalerSettings.nonce : ''
                },
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

            // Auto-advance logic removed to keep view on result
            // The user can manually select the next file or we can add a 'Next' button later.
            const nextPending = files.find(f => !f.upscaledUrl && !f.loading && f.id !== fileId);
            if (nextPending) {
                // Just for logging/future use, do not switch view
                // activeFileId = nextPending.id; 
            }

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

    // --- Selection & Bulk Logic ---

    function toggleSelect(id) {
        const f = files.find(file => file.id === id);
        if (f) {
            f.selected = !f.selected;
            render();
        }
    }

    function toggleSelectAll(checked) {
        files.forEach(f => f.selected = checked);
        render();
    }

    async function handleDownloadZip() {
        const selectedFiles = files.filter(f => f.selected);
        if (selectedFiles.length === 0) return;

        // Verify we have processed images
        const processedSelected = selectedFiles.filter(f => f.upscaledUrl);
        if (processedSelected.length === 0) {
            alert("No processed (upscaled) images selected for zip.");
            return;
        }

        const zip = new JSZip();
        const btn = document.getElementById('btn-download-zip');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Zipping...';
        btn.disabled = true;

        try {
            for (const f of processedSelected) {
                const res = await fetch(f.upscaledUrl);
                const blob = await res.blob();
                const name = f.upscaledDetails ? f.upscaledDetails.name : `upscaled_${f.name}`;
                zip.file(name, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "upscaled_images.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (err) {
            console.error("Zip failed", err);
            alert("Failed to create zip.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // --- Rendering ---

    function render() {
        renderFileList();
        renderMainContent();
        renderControls();
        renderBulkActions();
    }

    function renderFileList() {
        fileListContainer.innerHTML = '';

        const selectAllCb = document.getElementById('select-all-files');
        if (selectAllCb) {
            const allSelected = files.length > 0 && files.every(f => f.selected);
            selectAllCb.checked = allSelected;
            selectAllCb.onclick = (e) => toggleSelectAll(e.target.checked);
        }

        files.forEach(f => {
            const item = document.createElement('div');
            item.className = `file-item ${f.id === activeFileId ? 'active' : ''}`;
            // Clicking item sets active, clicking checkbox toggles select
            item.onclick = (e) => {
                if (e.target.type !== 'checkbox') setActiveFile(f.id);
            };

            let status = '';
            if (f.loading) status = '...';
            else if (f.error) status = 'Err';
            else if (f.upscaledUrl) status = '✓';

            const statusClass = f.error ? 'error' : (f.upscaledUrl ? 'success' : '');

            item.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <input type="checkbox" class="file-checkbox" ${f.selected ? 'checked' : ''}>
                    <div class="file-item-info">
                        <span class="file-item-name" title="${f.name}">${f.name}</span>
                        <span class="file-status ${statusClass}">${status}</span>
                    </div>
                </div>
                <button class="remove-btn">×</button>
            `;

            // Bind Checkbox
            item.querySelector('.file-checkbox').onclick = (e) => {
                e.stopPropagation();
                toggleSelect(f.id);
            };

            // Bind Remove Button
            item.querySelector('.remove-btn').onclick = (e) => removeFile(e, f.id);

            fileListContainer.appendChild(item);
        });
    }

    function renderBulkActions() {
        const container = document.getElementById('bulk-actions-container');
        const selectedCount = files.filter(f => f.selected).length;

        if (container) {
            if (selectedCount > 0) {
                container.style.display = 'flex';
            } else {
                container.style.display = 'none';
            }
        }
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
    }

    function renderMainContent() {
        const activeFile = files.find(f => f.id === activeFileId);

        // 1. Empty State
        if (!activeFile) {
            mainContentArea.innerHTML = `
                <div class="single-image-view">
                    <div class="placeholder">Select an image from the list<br><span style="font-size: 0.9em; opacity: 0.7;">or Drag & Drop here</span></div>
                </div>
             `;
            return;
        }

        const downloadBtnHtml = activeFile.upscaledUrl ? `
            <button class="primary-button" id="download-btn-active" style="width: auto; padding: 10px 20px;">Download Image ⬇</button>
        ` : '';

        // 2. Loading State
        if (activeFile.loading) {
            mainContentArea.innerHTML = `
                <div class="loading-view fade-in">
                    <div class="loader-spinner"></div>
                    <div class="loading-text">Upscaling your image...</div>
                    <p style="margin-top:0.5rem; color:var(--text-secondary);">This may take a few seconds.</p>
                </div>
            `;
            return;
        }

        // 3. Upscaled State (Slider View)
        if (activeFile.upscaledUrl) {
            const resultTitle = 'Upscaled Result';

            // Metadata logic
            const mOld = activeFile.originalDetails;
            const mNew = activeFile.upscaledDetails;

            const sliderHtml = `
                    <div class="slider-section main-view slide-up-fade">
                        <div class="comparison-header">
                            <h2 class="comparison-title">Comparison View</h2>
                            
                            <!-- Centered Download Button -->
                            <div class="download-wrapper">
                                ${downloadBtnHtml}
                            </div>

                            <div class="controls-wrapper">
                                <div class="zoom-controls">
                                    <button id="zoom-out-btn" class="secondary-button" style="padding: 5px 12px; width:auto;">-</button>
                                    <span id="zoom-level-text" style="font-weight: 600; color: #555;">100%</span>
                                    <button id="zoom-in-btn" class="secondary-button" style="padding: 5px 12px; width:auto;">+</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="comparison-slider-container" id="comp-slider">
                            
                            <!-- Labels -->
                            <div class="slider-label label-left">Original</div>
                            <div class="slider-label label-right">Upscaled</div>

                            <!-- Upscaled is now Bottom (Background) -->
                            <div class="img-wrapper upscaled-overlay">
                                <img src="${activeFile.upscaledUrl}" alt="Upscaled" />
                            </div>

                            <!-- Original is now Top (Clipped) -->
                            <div class="img-wrapper original-overlay" style="clip-path: inset(0 50% 0 0);">
                                <img src="${activeFile.previewUrl}" alt="Original" />
                            </div>
                            
                            <div class="slider-line" style="left: 50%;">
                                <div class="slider-button">↔</div>
                            </div>
                            <input type="range" min="0" max="100" value="50" class="slider-input" id="slider-range">
                        </div>

                        <!-- Metadata Table Below Slider -->
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
                                        <tr><td class="meta-label">Dimensions</td><td>${mOld.width}x${mOld.height}</td><td>${mNew?.width}x${mNew?.height}</td></tr>
                                        <tr><td class="meta-label">Megapixels</td><td>${mOld.megapixels}</td><td>${mNew?.megapixels}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
            `;

            mainContentArea.innerHTML = sliderHtml;

            // Bind Slider Events
            if (document.getElementById('slider-range')) {
                const range = document.getElementById('slider-range');
                range.oninput = (e) => {
                    const val = e.target.value;
                    const overlay = document.querySelector('.original-overlay'); // Now clipping Original
                    const line = document.querySelector('.slider-line');
                    if (overlay) overlay.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
                    if (line) line.style.left = `${val}%`;
                };

                // Initialize Zoom Controls
                initZoomControls(document.getElementById('comp-slider'));
            }

            // Bind Download
            if (document.getElementById('download-btn-active')) {
                document.getElementById('download-btn-active').onclick = () => handleDownload(activeFile.upscaledUrl, activeFile.upscaledDetails.name);
            }

            return;
        }

        // 4. Original Image Only (Not Upscaled yet)
        // Add fade-in animation for initial load or switching
        mainContentArea.innerHTML = `
            <div class="single-image-view fade-in" id="single-view-container">
                <img src="${activeFile.previewUrl}" alt="Original" id="original-img" />
            </div>
        `;
    }

    // --- Zoom Logic (Buttons Only) ---
    function initZoomControls(container) {
        if (!container) return;

        const images = container.querySelectorAll('img');
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomLevelText = document.getElementById('zoom-level-text');

        let scale = 1;

        const setTransform = () => {
            images.forEach(img => {
                img.style.transformOrigin = 'center center'; // Zoom to center
                img.style.transform = `scale(${scale})`;
                img.style.transition = 'transform 0.2s ease'; // Smooth zoom
            });
            if (zoomLevelText) zoomLevelText.textContent = `${Math.round(scale * 100)}%`;
        };

        if (zoomInBtn) {
            zoomInBtn.onclick = () => {
                if (scale < 5) {
                    scale += 0.25;
                    setTransform();
                }
            };
        }

        if (zoomOutBtn) {
            zoomOutBtn.onclick = () => {
                if (scale > 1) {
                    scale -= 0.25;
                    setTransform();
                }
            };
        }
    }

    // --- Initialization ---
    // Bind global static controls
    document.getElementById('btn-upscale-active').addEventListener('click', handleUpscaleActive);
    document.getElementById('btn-upscale-all').addEventListener('click', handleUpscaleAll);
    fileInput.addEventListener('change', handleFileChange);

    // Bulk Listeners
    const btnBulkTransfer = document.getElementById('btn-bulk-transfer');
    if (btnBulkTransfer) btnBulkTransfer.addEventListener('click', handleBulkTransfer);

    const btnZip = document.getElementById('btn-download-zip');
    if (btnZip) btnZip.addEventListener('click', handleDownloadZip);

    // Initialize Drag & Drop
    initDragAndDrop();

    // Initial render
    render();

    // Check for transferred file (IndexedDB method)
    if (window.transferManager) {
        console.log("Checking TransferManager for image...");
        window.transferManager.getTransfer().then(async data => {
            if (data) {
                console.log("Transfer Found:", data);

                if (data.type === 'batch' && data.files && Array.isArray(data.files)) {
                    // Handle Batch
                    console.log(`Found batch of ${data.files.length} images`);
                    const fileObjects = data.files.map(f => new File([f.blob], f.filename, { type: f.blob.type }));
                    await handleFileChange({ target: { files: fileObjects } });
                } else if (data.blob) {
                    // Handle Legacy Single
                    console.log("Found single transfer");
                    const file = new File([data.blob], data.filename, { type: data.blob.type });
                    await handleFileChange({ target: { files: [file] } });
                }

                // Check for Auto-Start Flag from Shortcode Uploader
                const params = new URLSearchParams(window.location.search);
                if (params.get('auto_start') === '1') {
                    console.log("Auto-start detected. Triggering Upscale...");
                    handleUpscaleAll();

                    // Cleanup URL to prevent loop/re-trigger on refresh
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, '', newUrl);
                }

                // Clear after delay
                setTimeout(() => window.transferManager.clearData(), 2000);
            } else {
                console.log("No transfer found in DB.");
            }
        }).catch(e => {
            console.error("TransferManager Error:", e);
        });
    } else {
        console.log("TransferManager not available.");
    }


    // --- Transfer Manager Outgoing Integration ---
    if (window.transferManager) {
        const toolLinks = document.querySelectorAll('.tools-list a');
        toolLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                // Check if we have an active file
                const activeFile = files.find(f => f.id === activeFileId);
                const hasMultiple = files.length > 1;
                const hasUpscaled = files.some(f => f.upscaledUrl);

                // Warning Logic
                if (hasMultiple || (hasUpscaled && !activeFile)) {
                    // Prevent default navigation initially
                    e.preventDefault();

                    // Show Custom Modal
                    showNavWarning(link.href);
                    return;
                }

                // We only transfer if there is a successfully upscaled image
                if (activeFile && activeFile.upscaledUrl) {
                    e.preventDefault();
                    const originalHref = link.href;
                    // Visual feedback on the link
                    const originalText = link.innerHTML;
                    link.innerHTML = '⏳ Processing...'; // Shorten to fit

                    try {
                        // Fetch blob from upscaledUrl
                        const res = await fetch(activeFile.upscaledUrl);
                        const blob = await res.blob();

                        const filename = activeFile.upscaledDetails ? activeFile.upscaledDetails.name : `upscaled_${activeFile.name}`;

                        await transferManager.saveImage(blob, filename);
                        window.location.href = originalHref;
                    } catch (err) {
                        console.error("Transfer failed", err);
                        window.location.href = originalHref;
                    }
                }
            });
        });
    }

    // --- Login Modal Logic ---
    function showLoginModal() {
        const modal = document.getElementById('login-prompt-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            // Fallback if modal HTML missing (unlikely)
            alert("Guests limited to 1 image. Please login.");
        }
    }

    function hideLoginModal() {
        const modal = document.getElementById('login-prompt-modal');
        if (modal) modal.style.display = 'none';
    }

    // Modal Events
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalOverlay = document.querySelector('.upscaler-modal-overlay');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideLoginModal);
    if (modalOverlay) modalOverlay.addEventListener('click', hideLoginModal);

    // --- Navigation Warning Modal Logic ---
    let pendingNavUrl = null;

    function showNavWarning(url) {
        pendingNavUrl = url;
        const modal = document.getElementById('nav-warning-modal');
        if (modal) modal.style.display = 'flex';
        else {
            if (confirm("Unsaved changes will be lost. Proceed?")) window.location.href = url;
        }
    }

    function hideNavWarning() {
        pendingNavUrl = null;
        const modal = document.getElementById('nav-warning-modal');
        if (modal) modal.style.display = 'none';
    }

    // Bind Nav Modal Buttons
    const navCancelBtn = document.getElementById('nav-cancel-btn');
    const navProceedBtn = document.getElementById('nav-proceed-btn');

    if (navCancelBtn) navCancelBtn.onclick = hideNavWarning;
    if (navProceedBtn) navProceedBtn.onclick = async () => {
        if (!pendingNavUrl) return;

        // Visual Feedback
        navProceedBtn.innerHTML = 'Saving...';
        navProceedBtn.style.opacity = '0.7';

        try {
            // Attempt to transfer the ACTIVE file if it has a result
            const activeFile = files.find(f => f.id === activeFileId);
            if (activeFile && activeFile.upscaledUrl && window.transferManager) {
                const res = await fetch(activeFile.upscaledUrl);
                const blob = await res.blob();
                const filename = activeFile.upscaledDetails ? activeFile.upscaledDetails.name : `upscaled_${activeFile.name}`;

                await window.transferManager.saveImage(blob, filename);
            }
        } catch (err) {
            console.error("Nav Transfer Error:", err);
            // Proceed anyway
        }

        window.location.href = pendingNavUrl;
    };

});
