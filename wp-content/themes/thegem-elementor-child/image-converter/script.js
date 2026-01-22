
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const uploadScreen = document.getElementById('upload-screen');
    const fileListDiv = document.getElementById('file-list');
    const fileInput = document.getElementById('file-input');
    const formatSelect = document.getElementById('format-select');
    const processBtn = document.getElementById('process-btn');

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
                targetQuality: 92, // High Quality for Converter
                targetFormat: 'image/jpeg', // Default target
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
    // --- Selection Logic ---
    window.setActiveItem = (index) => {
        if (index < 0 || index >= fileQueue.length) return;
        activeIndex = index;
        
        const item = fileQueue[index];
        
        // Update Controls to match this item's settings
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
        
        // Update Button Text
        const allDone = fileQueue.length > 0 && fileQueue.every(i => i.status === 'done');
        if (fileQueue.length === 0) processBtn.innerText = "Convert Images";
        else processBtn.innerText = allDone ? "Download All (Zip)" : "Convert Images";
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
                if (!e.target.closest('.remove-btn')) setActiveItem(index); 
            };
            
            const sizeStr = formatBytes(item.originalSize);
            let statusHtml = '';

            if (item.status === 'done') {
                const newSizeStr = formatBytes(item.compressedSize);
                // For Converter, we just show "Converted" or the new size. 
                // Color green usually implies success.
                statusHtml = `
                    <div style="text-align: right;">
                        <div style="color: #27ae60; font-weight: 800; font-size: 1.1rem;">${item.ext.toUpperCase()}</div>
                        <div style="font-size: 0.9rem; color: #666;">${newSizeStr}</div>
                    </div>
                `;
            } else if (item.status === 'processing') {
                statusHtml = `<div style="color: #f39c12;">Converting...</div>`;
            } else {
                statusHtml = `<div style="text-align: right; color: #666; font-size: 0.9rem;">
                                <div>To: <b>${item.targetFormat.split('/')[1].toUpperCase()}</b></div>
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
                    <button class="remove-btn" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #ccc;">&times;</button>
                </div>
            `;
            
            // Attach event listener with stopPropagation to avoid triggering row select
            const removeBtn = row.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeItem(index);
            });

            fileListDiv.appendChild(row);
        });

        // Add "Add More" Button
        const addBtnDiv = document.createElement('div');
        addBtnDiv.style.textAlign = 'center';
        addBtnDiv.style.marginTop = '15px';
        addBtnDiv.innerHTML = `<button onclick="document.getElementById('file-input').click()" style="background: #f0f0f0; border: 1px dashed #ccc; color: #555; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">+ Ad More Files</button>`;
        fileListDiv.appendChild(addBtnDiv);
    }
    
    // ... removeItem, setActiveItem need minor tweaks if any ... Is Active Item updating Slider? 
    // We removed Slider from UI, so we should remove it from selection logic or just ignore errors.
    
    window.updateStats = () => {}; // No Global Stats for Converter

    // --- Controls ---
    // No Quality Slider logic needed.

    // Update ONLY Active Item (User requested individual control)
    formatSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        
        // Update Active Item
        if (activeIndex !== -1) {
            fileQueue[activeIndex].targetFormat = val;
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
                        const q = 0.92; // Fixed High Quality
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
            saveAs(item.blob, `converted_${item.file.name.split('.')[0]}.${item.ext}`);
        } else {
            const zip = new JSZip();
            fileQueue.forEach(item => {
                const name = item.file.name.split('.')[0];
                zip.file(`${name}_converted.${item.ext}`, item.blob);
            });
            
            const content = await zip.generateAsync({type:"blob"});
            saveAs(content, "converted_images.zip");
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
