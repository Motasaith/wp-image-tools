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

            const response = await fetch('/wp-json/thegem/v1/upscaler/proxy', {
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

        const downloadBtnHtml = activeFile.upscaledUrl ? `
            <button class="download-button" title="Download" id="download-btn-active">⬇</button>
        ` : '';

        let resultTitle = 'Upscaled';

        const upscaledImageOrPlaceholder = activeFile.upscaledUrl
            ? `<img src="${activeFile.upscaledUrl}" alt="${resultTitle}" />`
            : `<div class="placeholder">${activeFile.loading ? 'Processing...' : 'Result will appear here'}</div>`;

        let originalContentHtml = `<img src="${activeFile.previewUrl}" alt="Original" id="original-img" />`;

        let bottomSection = '';
        if (activeFile.upscaledUrl) {
            // Metadata logic
            const mOld = activeFile.originalDetails;
            const mNew = activeFile.upscaledDetails;

            const sliderHtml = `
                    <div class="slider-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 900px; margin-bottom: 1rem;">
                            <h2>Comparison Slider</h2>
                            <div class="zoom-controls" style="display: flex; gap: 10px; align-items: center;">
                                <button id="zoom-out-btn" class="btn-secondary" style="padding: 5px 12px;">-</button>
                                <span id="zoom-level-text" style="font-weight: 600; color: #555;">100%</span>
                                <button id="zoom-in-btn" class="btn-secondary" style="padding: 5px 12px;">+</button>
                            </div>
                        </div>
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
            `;

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
                </div>
              </div>
              <div class="image-panel">
                <div class="panel-header" style="display:flex; align-items:center; justify-content:space-between;">
                    <span>${resultTitle}</span>
                    <div style="display:flex; align-items:center;">
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

        if (document.getElementById('slider-range')) {
            const range = document.getElementById('slider-range');
            range.oninput = (e) => {
                const val = e.target.value;
                const overlay = document.querySelector('.upscaled-overlay');
                const line = document.querySelector('.slider-line');
                if (overlay) overlay.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
                if (line) line.style.left = `${val}%`;
            };

            // Initialize Zoom Controls
            initZoomControls(document.getElementById('comp-slider'));
        }
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
                    scale += 0.5;
                    setTransform();
                }
            };
        }

        if (zoomOutBtn) {
            zoomOutBtn.onclick = () => {
                if (scale > 1) {
                    scale -= 0.5;
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

    // Initial render
    render();

    // Check for transferred file (IndexedDB method)
    if (window.transferManager) {
        console.log("Checking TransferManager for image...");
        window.transferManager.getImage().then(data => {
            if (data && data.blob) {
                console.log("Transfer Found:", data.filename);

                const file = new File([data.blob], data.filename, { type: data.blob.type });
                handleFileChange({ target: { files: [file] } });

                // Clear after extensive delay to allow processing
                setTimeout(() => window.transferManager.clearImage(), 2000);
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

                // We only transfer if there is a successfully upscaled image
                if (activeFile && activeFile.upscaledUrl) {
                    e.preventDefault();
                    const originalHref = link.href;
                    // Visual feedback on the link
                    const originalText = link.innerHTML;
                    link.innerHTML = '⏳ S...'; // Shorten to fit

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

});
