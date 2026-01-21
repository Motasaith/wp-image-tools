
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const uploadScreen = document.getElementById('upload-screen');
    const fileListDiv = document.getElementById('file-list');
    const fileInput = document.getElementById('file-input');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityVal = document.getElementById('quality-val');
    const formatSelect = document.getElementById('format-select');
    const processBtn = document.getElementById('process-btn');
    const totalSavedEl = document.getElementById('total-saved');

    // State
    let fileQueue = []; 
    // Item Structure: { id, file, src, originalSize, compressedSize, blob, status, targetQuality, targetFormat, ext }
    let activeIndex = -1;

    // --- Upload Handling ---
    window.handleFileSelect = (input) => {
        if (input.files && input.files.length > 0) handleFiles(Array.from(input.files));
    };
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.backgroundColor = '#eef2ff'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.backgroundColor = '#f9f9f9'; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dropZone.style.backgroundColor = '#f9f9f9';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFiles(Array.from(e.dataTransfer.files));
    });

    async function handleFiles(files) {
        const validFiles = files.filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) return;

        // Add to queue
        for (const file of validFiles) {
            fileQueue.push({
                id: Date.now() + Math.random(),
                file: file,
                originalSize: file.size,
                status: 'pending', // pending, processing, done, error
                compressedSize: null,
                blob: null,
                targetQuality: 75, // Default
                targetFormat: 'original', // Default
                ext: null
            });
        }
        
        // Select the first new item if none selected
        if (activeIndex === -1 && fileQueue.length > 0) {
            setActiveItem(0);
        }

        updateUI();
    }

    // --- Selection Logic ---
    window.setActiveItem = (index) => {
        if (index < 0 || index >= fileQueue.length) return;
        activeIndex = index;
        
        const item = fileQueue[index];
        
        // Update Controls to match this item's settings
        qualitySlider.value = item.targetQuality;
        qualityVal.innerText = item.targetQuality + '%';
        formatSelect.value = item.targetFormat;
        
        updateUI(); 
    };

    // --- UI Updates ---
    function updateUI() {
        if (fileQueue.length > 0) {
            uploadScreen.style.display = 'none';
            fileListDiv.style.display = 'block';
        } else {
            uploadScreen.style.display = 'flex'; 
            fileListDiv.style.display = 'none';
        }

        renderQueue();
        updateStats();
    }

    function renderQueue() {
        fileListDiv.innerHTML = '';
        fileQueue.forEach((item, index) => {
            const isActive = (index === activeIndex);
            const row = document.createElement('div');
            
            // Style: Highlight active row
            let borderStyle = isActive ? '2px solid var(--brand-blue)' : '1px solid #eee';
            let bgStyle = isActive ? '#f8f9ff' : '#fff';

            row.style.cssText = `background: ${bgStyle}; padding: 15px; border-radius: 8px; border: ${borderStyle}; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s;`;
            row.onclick = (e) => {
                // Prevent selecting if clicking remove button
                if (!e.target.closest('.remove-btn')) setActiveItem(index); 
            };
            
            const sizeStr = formatBytes(item.originalSize);
            let statusHtml = '';

            if (item.status === 'done') {
                const newSizeStr = formatBytes(item.compressedSize);
                const savedBytes = item.originalSize - item.compressedSize;
                const savedPct = Math.round((savedBytes / item.originalSize) * 100);
                
                let color = '#27ae60'; // Green
                let text = `-${savedPct}%`; 
                
                if (savedBytes < 0) {
                    color = '#e74c3c'; // Red
                    text = `+${Math.abs(savedPct)}%`;
                    
                    statusHtml = `
                    <div style="text-align: right;">
                         <div style="color: ${color}; font-weight: 800; font-size: 1.1rem;">${newSizeStr}</div>
                        <div style="font-size: 0.9rem; color: ${color}; font-weight: 600;">${text} increase</div>
                        <div style="font-size: 0.85rem; color: #d63031; margin-top: 4px; font-weight: 600; background: #ffeaea; padding: 2px 6px; border-radius: 4px; display: inline-block;">⚠️ Try lowering Quality</div>
                    </div>
                    `;
                } else {
                     statusHtml = `
                    <div style="text-align: right;">
                        <div style="color: ${color}; font-weight: 800; font-size: 1.1rem;">${newSizeStr}</div>
                        <div style="font-size: 0.9rem; color: ${color}; font-weight: 600;">${text} saved</div>
                    </div>
                `;
                }
            } else if (item.status === 'processing') {
                statusHtml = `<div style="color: #f39c12;">Compressing...</div>`;
            } else {
                // Display current settings for pending items
                statusHtml = `<div style="text-align: right; color: #666; font-size: 0.9rem;">
                                <div>Quality: <b>${item.targetQuality}%</b></div>
                                <div style="font-size: 0.8rem; color: #999;">${item.targetFormat === 'original' ? 'Original Ext' : item.targetFormat.split('/')[1].toUpperCase()}</div>
                              </div>`;
            }

            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: #eee; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 1.5rem;">📄</span>
                    </div>
                    <div>
                        <div style="font-weight: 500; font-size: 0.95rem; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.file.name}</div>
                        <div style="font-size: 0.8rem; color: #888;">${sizeStr}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    ${statusHtml}
                    <button class="remove-btn" onclick="removeItem(${index})" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #ccc;">&times;</button>
                </div>
            `;
            fileListDiv.appendChild(row);
        });

        // Add "Add More" Button
        const addBtnDiv = document.createElement('div');
        addBtnDiv.style.textAlign = 'center';
        addBtnDiv.style.marginTop = '15px';
        addBtnDiv.innerHTML = `<button onclick="document.getElementById('file-input').click()" style="background: #f0f0f0; border: 1px dashed #ccc; color: #555; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">+ Add More Files</button>`;
        fileListDiv.appendChild(addBtnDiv);
    }
    
    window.removeItem = (index) => {
        fileQueue.splice(index, 1);
        if (activeIndex === index) activeIndex = -1;
        if (activeIndex > index) activeIndex--; // Shift selection if removing item above
        // If queue empty, reset
        if (fileQueue.length === 0) activeIndex = -1;
        // If nothing selected but queue has items, select last?
        if (activeIndex === -1 && fileQueue.length > 0) activeIndex = 0; 

        if (activeIndex !== -1) setActiveItem(activeIndex); // Update controls
        updateUI();
    };

    function updateStats() {
        let totalOrig = 0;
        let totalComp = 0;
        let processedCount = 0;

        fileQueue.forEach(item => {
            if (item.status === 'done') {
                totalOrig += item.originalSize;
                totalComp += item.compressedSize;
                processedCount++;
            }
        });
        
        if (processedCount === 0) {
            totalSavedEl.innerText = "0%";
            totalSavedEl.style.color = "#666";
            processBtn.innerText = "Compress Images";
            return;
        }
        
        const diff = totalOrig - totalComp;
        const pct = Math.round((diff / totalOrig) * 100);
        
        if (diff >= 0) {
            totalSavedEl.innerText = `${pct}% Saved`;
            totalSavedEl.style.color = "#27ae60";
        } else {
            totalSavedEl.innerText = `+${Math.abs(pct)}% (Larger)`;
            totalSavedEl.style.color = "#e74c3c";
        }
        
        const allDone = fileQueue.every(i => i.status === 'done');
        processBtn.innerText = allDone ? "Download All (Zip)" : "Compress Images";
    }

    // --- Controls ---
    qualitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        qualityVal.innerText = val + '%';
        
        if (activeIndex !== -1) {
            fileQueue[activeIndex].targetQuality = val;
            if (fileQueue[activeIndex].status === 'done') {
                 fileQueue[activeIndex].status = 'pending';
            }
            updateUI(); // Re-render to show updated settings in list
        }
    });

    formatSelect.addEventListener('change', (e) => {
         if (activeIndex !== -1) {
            fileQueue[activeIndex].targetFormat = e.target.value;
            if (fileQueue[activeIndex].status === 'done') {
                 fileQueue[activeIndex].status = 'pending';
            }
            updateUI();
        }
    });

    // --- Processing ---
    processBtn.addEventListener('click', async () => {
        if (fileQueue.length === 0) return;
        
        const pendingItems = fileQueue.filter(i => i.status !== 'done');
        
        if (pendingItems.length === 0) {
            await downloadAll();
        } else {
            processBtn.innerText = "Processing...";
            processBtn.disabled = true;
            
            for (let i = 0; i < fileQueue.length; i++) {
                if (fileQueue[i].status !== 'done') {
                    fileQueue[i].status = 'processing';
                    updateUI();
                    
                    try {
                        // Use ITEM-SPECIFIC settings
                        const q = fileQueue[i].targetQuality / 100;
                        const f = fileQueue[i].targetFormat;
                        
                        const result = await compressImage(fileQueue[i].file, q, f);
                        fileQueue[i].blob = result.blob;
                        fileQueue[i].compressedSize = result.size;
                        fileQueue[i].ext = result.ext;
                        fileQueue[i].status = 'done';
                    } catch (e) {
                        console.error(e);
                        fileQueue[i].status = 'error';
                    }
                    updateUI();
                }
            }
            processBtn.disabled = false;
        }
    });

    function compressImage(file, quality, targetFormat) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    
                    // Handle Transparency for JPEG
                    let mime = targetFormat;
                    if (mime === 'original') mime = file.type;
                    
                    if (mime === 'image/jpeg') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0);
                    
                    let ext = 'jpg';
                    if (mime === 'image/png') ext = 'png';
                    if (mime === 'image/webp') ext = 'webp';
                    
                    // Normalize extensions
                    if (targetFormat === 'original') {
                         if (file.type === 'image/png') ext = 'png';
                         if (file.type === 'image/jpeg') ext = 'jpg';
                         if (file.type === 'image/webp') ext = 'webp';
                    }
                    
                    canvas.toBlob((blob) => {
                        resolve({
                            blob: blob,
                            size: blob.size,
                            ext: ext
                        });
                    }, mime, quality);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function downloadAll() {
        if (fileQueue.length === 1) {
            const item = fileQueue[0];
            saveAs(item.blob, `compressed_${item.file.name.split('.')[0]}.${item.ext}`);
        } else {
            const zip = new JSZip();
            fileQueue.forEach(item => {
                const name = item.file.name.split('.')[0];
                zip.file(`${name}_compressed.${item.ext}`, item.blob);
            });
            
            const content = await zip.generateAsync({type:"blob"});
            saveAs(content, "compressed_images.zip");
        }
    }
    
    function saveAs(blob, filename) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

});
