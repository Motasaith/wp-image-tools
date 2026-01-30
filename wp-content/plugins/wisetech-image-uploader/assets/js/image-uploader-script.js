class FileUploadComponent {
    constructor() {
        // Initialize DOM elements
        this.uploadBox = document.getElementById('uploadBox');
        this.fileInput = document.getElementById('fileInput');
        this.filesPreview = document.getElementById('filesPreview');
        this.filesList = document.getElementById('filesList');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.filesProcessing = document.getElementById('filesProcessing');
        this.uploadComplete = document.getElementById('uploadComplete');
        this.newUploadBtn = document.getElementById('newUploadBtn');
        this.viewFilesBtn = document.getElementById('viewFilesBtn');
        this.addMoreBtn = document.getElementById('addMoreBtn');
        this.completeTitle = document.getElementById('completeTitle');
        this.completeSubtitle = document.getElementById('completeSubtitle');
        this.completeFaildError = document.getElementById('completeFaildError');
        
        // Get configuration from container
        const container = document.getElementById('delayedUploader');
        this.action = container.dataset.action;
        this.nonce = container.dataset.nonce;
        
        // Define allowed extensions based on action type
        this.allowedExtensions = this.getAllowedExtensions();
        
        // Initialize variables
        this.files = [];
        this.processingQueue = [];
        this.isLoggedIn = wisetechVars.is_logged_in || false;
        this.loginUrl = wisetechVars.login_url || '/my-account/';
        // Non-logged-in users can only upload 1 file, logged-in users can upload up to max_files
        this.maxFiles = this.isLoggedIn ? (wisetechVars.max_files || 10) : 1;
        this.maxFileSize = wisetechVars.max_file_size || 10 * 1024 * 1024;
        this.successCount = 0;
        this.failedCount = 0;
        this.totalFiles = 0;
        this.processedFiles = 0;
        this.isProcessing = false; // New flag to track processing state
        
        // Start the component
        this.init();
    }

    // Get allowed extensions based on API type
    getAllowedExtensions() {
        switch(this.action) {
            case 'wisetech_upscale_image':
            case 'wisetech_face_enhancer':
                return ['jpg', 'jpeg', 'png', 'gif', 'jfif', 'webp', 'bmp', 'ico', 'svg', 'avif'];
            case 'wisetech_bg_remove':
                return ['jpg', 'jpeg', 'png', 'gif','webp', 'jfif', 'bmp'];
            default:
                return ['jpg', 'jpeg', 'png'];
        }
    }

    // Get human-readable format list for error messages
    getFormatsList() {
        return this.allowedExtensions.map(ext => ext.toUpperCase()).join(', ');
    }

    init() {
        this.setupEventListeners();
        this.addNotificationStyles();
        this.updateSubtitleForLoginStatus();
        this.updateFileInputForLoginStatus();
        this.ensureBulkUploadButton();
    }

    ensureBulkUploadButton() {
        // Ensure bulk upload button is visible for non-logged-in users
        const container = document.querySelector('.image-upscaler-container');
        if (!container) return;
        
        if (!this.isLoggedIn) {
            let bulkBtn = document.getElementById('bulkUploadBtn') || container.querySelector('.bulk-upload-btn');
            if (!bulkBtn) {
                // Create button if it doesn't exist
                bulkBtn = document.createElement('a');
                bulkBtn.id = 'bulkUploadBtn';
                bulkBtn.href = this.loginUrl;
                bulkBtn.className = 'bulk-upload-btn';
                bulkBtn.title = 'Login for bulk upload';
                bulkBtn.textContent = 'Bulk Upload';
                container.insertBefore(bulkBtn, container.firstChild);
            }
            // Force visibility
            bulkBtn.style.display = 'inline-block';
            bulkBtn.style.visibility = 'visible';
            bulkBtn.style.opacity = '1';
            
            // Add click handler to prevent triggering upload box
            bulkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                window.location.href = this.loginUrl;
            });
        } else {
            // Hide button for logged-in users
            const bulkBtn = document.getElementById('bulkUploadBtn') || container.querySelector('.bulk-upload-btn');
            if (bulkBtn) {
                bulkBtn.style.display = 'none';
            }
        }
    }

    updateSubtitleForLoginStatus() {
        const subtitle = document.getElementById('uploadSubtitle');
        if (subtitle && !this.isLoggedIn) {
            const formats = this.getFormatsList();
            subtitle.textContent = `Guest uploads are limited to 1 image (10MB max). Bulk uploads are available for logged-in users based on their active plan. Supported: ${formats}.`;
        }
    }

    updateFileInputForLoginStatus() {
        if (!this.isLoggedIn && this.fileInput) {
            // Remove multiple attribute if present
            this.fileInput.removeAttribute('multiple');
        }
    }

    setupEventListeners() {
        // Prevent bulk upload button from triggering file input
        const bulkUploadBtn = document.getElementById('bulkUploadBtn');
        if (bulkUploadBtn) {
            bulkUploadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Direct navigation without triggering upload box
                window.location.href = this.loginUrl;
            });
        }
        
        // Click to upload - with processing check
        this.uploadBox.addEventListener('click', (e) => {
            // Don't trigger if clicking on bulk upload button
            if (e.target.closest('.bulk-upload-btn')) {
                return;
            }
            if (!this.isProcessing) this.fileInput.click();
        });
        
        // File input change - with processing check
        this.fileInput.addEventListener('change', (e) => {
            if (!this.isProcessing && e.target.files && e.target.files.length > 0) {
                this.handleFiles(e.target.files);
            }
        });
        
        // Drag and drop events
        this.uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!this.isProcessing) {
                this.uploadBox.classList.add('dragover');
            }
        });
        
        this.uploadBox.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadBox.classList.remove('dragover');
        });
        
        this.uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadBox.classList.remove('dragover');
            if (!this.isProcessing && e.dataTransfer.files.length > 0) {
                this.handleFiles(e.dataTransfer.files);
            }
        });
        
        // Button events
        this.newUploadBtn.addEventListener('click', () => this.startNewUpload());
        this.viewFilesBtn.addEventListener('click', () => this.downloadUpscaledFiles());
        this.addMoreBtn.addEventListener('click', () => {
            if (!this.isProcessing) {
                // Check if non-logged-in user already has a file
                if (!this.isLoggedIn && this.files.length >= 1) {
                    this.showLoginAlert('You have already selected 1 image. Please login to upload multiple images at once.');
                    return;
                }
                this.fileInput.click();
            }
        });
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList);
        const validFiles = [];
        const errors = [];
        
        // Check if user is logged in and enforce file limit
        if (!this.isLoggedIn) {
            // For non-logged-in users: check if they already have a file
            if (this.files.length >= 1) {
                this.showLoginAlert('You have already selected 1 image. Please login to upload multiple images at once.');
                // Clear the file input
                this.fileInput.value = '';
                return;
            }
            
            // Check if trying to upload multiple files at once
            if (newFiles.length > 1) {
                this.showLoginAlert('Guest users can only upload 1 image at a time. Please login to upload multiple images.');
                // Clear the file input
                this.fileInput.value = '';
                return;
            }
        }
        
        // Check file limit for logged-in users
        if (this.isLoggedIn && this.files.length + newFiles.length > this.maxFiles) {
            this.showError(`You can upload a maximum of ${this.maxFiles} files.`);
            // Clear the file input
            this.fileInput.value = '';
            return;
        }
        
        // Validate each file
        newFiles.forEach(file => {
            const fileExtension = file.name.split('.').pop().toLowerCase();

            // Check file type
            if (!this.allowedExtensions.includes(fileExtension)) {
                errors.push(`${file.name}: Invalid file type. Allowed types: ${this.getFormatsList()}.`);
                return;
            }
            
            // Check file size
            if (file.size > this.maxFileSize) {
                errors.push(`${file.name}: File size must be less than ${this.formatFileSize(this.maxFileSize)}.`);
                return;
            }

            // Check for duplicate files
            if (this.files.some(f => f.name === file.name && f.size === file.size)) {
                errors.push(`${file.name}: File already selected.`);
                return;
            }

            validFiles.push(file);
        });

        // Show errors if any
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
        }

        // Process valid files
        if (validFiles.length > 0) {
            validFiles.forEach(file => this.addFile(file));
            this.processQueue();
        }
    }

    addFile(file) {
        const fileObj = {
            file: file,
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: this.formatFileSize(file.size),
            status: 'pending'
        };

        this.files.push(fileObj);
        this.renderFile(fileObj);
    }

    renderFile(fileObj) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.setAttribute('data-file-id', fileObj.id);
        
        fileElement.innerHTML = `
            <div class="file-info">
                <div class="file-name">${fileObj.name}</div>
                <div class="file-size">${fileObj.size}</div>
            </div>
            <div class="file-status">
                <div class="status-icon status-pending">⏳</div>
            </div>
            <button class="file-remove" data-file-id="${fileObj.id}">×</button>
        `;

        // Add remove file event - only if not processing
        const removeBtn = fileElement.querySelector('.file-remove');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.isProcessing) {
                this.removeFile(fileObj.id);
            }
        });

        // this.filesList.appendChild(fileElement);
        
        // // Show files preview
        // if (this.filesPreview) {
        //     this.filesPreview.style.display = 'block';
        //     this.filesPreview.classList.add('show');
        // }
    }

    processQueue() {
        if (this.processingQueue.length === 0 && this.files.some(f => f.status === 'pending')) {
            // Set processing flag
            this.isProcessing = true;
            
            // Disable upload interactions
            this.uploadBox.style.pointerEvents = 'none';
            this.uploadBox.style.opacity = '0.7';
            this.fileInput.disabled = true;
            
            // Add all pending files to queue
            this.files.filter(f => f.status === 'pending').forEach(file => {
                this.processingQueue.push(file.id);
            });
            
            // Reset counters
            this.totalFiles = this.processingQueue.length;
            this.processedFiles = 0;
            this.successCount = 0;
            this.failedCount = 0;
            
            // Show processing UI
            this.uploadBox.classList.add('uploading');
            this.processNextFile();
        }
    }

    processNextFile() {
        if (this.processingQueue.length === 0) {
            this.completeProcessing();
            return;
        }

        const fileId = this.processingQueue.shift();
        const fileObj = this.files.find(f => f.id === fileId);
        
        if (!fileObj) {
            this.processNextFile();
            return;
        }

        // Route to appropriate processor
        if (this.action === 'wisetech_bg_remove') {
            this.handleBgRemoveProcess(fileObj);
        } else {
            this.handleStandardProcess(fileObj);
        }
    }

    handleStandardProcess(fileObj) {
        this.updateFileStatus(fileObj.id, 'processing', '⏳');
        this.updateProcessingUI(fileObj.name);

        const formData = new FormData();
        formData.append('image', fileObj.file);
        formData.append('action', this.action);
        formData.append('nonce', this.nonce);
        
        const xhr = new XMLHttpRequest();
        
        // Track upload progress (first 40%)
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const uploadProgress = Math.round((e.loaded / e.total) * 40);
                const overallProgress = (
                    (this.processedFiles * 100) + uploadProgress
                ) / this.totalFiles;
                this.updateProgress(overallProgress);
            }
        };
        
        // Track processing progress (next 40%)
        let processingStartTime;
        xhr.onprogress = (e) => {
            if (!processingStartTime) processingStartTime = Date.now();
            if (e.lengthComputable) {
                const processingProgress = Math.round((e.loaded / e.total) * 40);
                const overallProgress = (
                    (this.processedFiles * 100) + 40 + processingProgress
                ) / this.totalFiles;
                this.updateProgress(overallProgress);
            } else {
                // Fallback progress estimation
                const elapsed = Date.now() - processingStartTime;
                const estimatedTotal = 5000; // 5 seconds estimate
                const processingProgress = Math.min(40, (elapsed / estimatedTotal) * 40);
                const overallProgress = (
                    (this.processedFiles * 100) + 40 + processingProgress
                ) / this.totalFiles;
                this.updateProgress(overallProgress);
            }
        };
        
        xhr.onload = () => {
            this.processedFiles++;
            this.updateProgress(((this.processedFiles) / this.totalFiles) * 100);
            
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success && response.data?.image_data) {
                        fileObj.upscaledUrl = response.data;
                        fileObj.status = 'success';
                        this.successCount++;
                        this.updateFileStatus(fileObj.id, 'success', '✓');
                    } else {
                        throw new Error(response.data?.error || 'Processing failed');
                    }
                } catch (err) {
                    fileObj.status = 'failed';
                    this.failedCount++;
                    this.updateFileStatus(fileObj.id, 'failed', '✗');
                    this.showError(`${fileObj.name}: ${err.message}`);
                }
            } else {
                fileObj.status = 'failed';
                this.failedCount++;
                this.updateFileStatus(fileObj.id, 'failed', '✗');
                this.showError(`${fileObj.name}: Server error (${xhr.status})`);
            }
            this.processNextFile();
        };
        
        xhr.onerror = () => {
            this.processedFiles++;
            this.updateProgress(((this.processedFiles) / this.totalFiles) * 100);
            fileObj.status = 'failed';
            this.failedCount++;
            this.updateFileStatus(fileObj.id, 'failed', '✗');
            this.showError(`${fileObj.name}: Network error`);
            this.processNextFile();
        };
        
        xhr.open('POST', wisetechVars.ajaxurl, true);
        xhr.send(formData);
    }

    handleBgRemoveProcess(fileObj) {
    this.updateFileStatus(fileObj.id, 'processing', '⏳');
    this.updateProcessingUI(fileObj.name);

    const formData = new FormData();
    formData.append('image', fileObj.file);
    formData.append('action', this.action);
    formData.append('nonce', this.nonce);

    fetch(wisetechVars.ajaxurl, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        //console.log('BG Remove initial response:', data);
        
        if (!data.success) {
            throw new Error(data.data?.error || 'Processing initialization failed');
        }
        
        // Store session ID for status checks
        fileObj.sessionId = data.data.session_id;
        fileObj.trackingId = data.data.tracking_id;
        fileObj.processedName = data.data.processed_name;
        fileObj.originalName = data.data.original_name;
        
        //console.log('Starting polling for session ID:', fileObj.sessionId);
        
        // Start polling for status using session_id
        return this.pollBgRemoveStatus(fileObj);
    })
    .then(statusData => {
            //console.log('BG Remove completed:', statusData);
            
            // The processedName should already have .png extension as per API requirements
            fileObj.upscaledUrl = {
                download_url: statusData.download_url || 
                             wisetechVars.bg_remover_api + wisetechVars.bg_remover_download + 
                             "?imageName=" + encodeURIComponent(fileObj.processedName),
                filename: 'bg_removed_' + fileObj.name.replace(/\.[^/.]+$/, '.png')
            };
            
            fileObj.status = 'success';
            this.successCount++;
            this.updateFileStatus(fileObj.id, 'success', '✓');
            
            // Update progress to 100% for this file
            this.processedFiles++;
            this.updateProgress((this.processedFiles / this.totalFiles) * 100);
        })
    .catch(error => {
        console.error('Background removal failed:', error);
        fileObj.status = 'failed';
        this.failedCount++;
        this.updateFileStatus(fileObj.id, 'failed', '✗');
        
        let errorMessage = error.message;
        if (error.message.includes('Max attempts reached')) {
            errorMessage = 'Processing timed out. Please try again.';
        }
        
        this.showError(`${fileObj.name}: ${errorMessage}`);
        this.completeFaildError.textContent = `API Error: ${errorMessage}`;
        
        // Still increment processed files count even on failure
        this.processedFiles++;
        this.updateProgress((this.processedFiles / this.totalFiles) * 100);
    })
    .finally(() => {
        // Move to next file in queue
        this.processNextFile();
    });
}

pollBgRemoveStatus(fileObj) {
    return new Promise((resolve, reject) => {
        const maxAttempts = 10; // 20 seconds total (2s * 10)
        let attempts = 0;
        
        const checkStatus = () => {
            attempts++;
            
            const formData = new FormData();
            formData.append('action', 'wisetech_bg_remove_status');
            formData.append('session_id', fileObj.sessionId);
            formData.append('nonce', wisetechVars.bg_remove_nonce);
            
            //console.log('Polling status for tracking ID:', fileObj.trackingId, 'Attempt:', attempts);
            
            fetch(wisetechVars.ajaxurl, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(statusData => {
                //console.log('Status check response:', statusData);
                
                if (!statusData.success) {
                    throw new Error(statusData.data?.error || 'Status check failed');
                }
                
                // Handle the API response format: status: '0' = processing, '1' = completed
                if (statusData.data.status === 'completed') {
                    resolve(statusData.data);
                } 
                else if (statusData.data.status === 'processing') {
                    if (attempts >= maxAttempts) {
                        reject(new Error('Processing timeout! No clear subject detected, please upload a clearer image(s) and try again.'));
                    } else {
                        // Show progress to user
                        this.filesProcessing.innerHTML = `
                            <div class="processing-file">
                                Processing: ${fileObj.name} (${this.processedFiles + 1}/${this.totalFiles})<br>
                                Status: Processing...
                            </div>
                        `;
                        setTimeout(checkStatus, 2000);
                    }
                }
                else {
                    throw new Error('Unknown status from server: ' + statusData.data.status);
                }
            })
            .catch(err => {
                console.error('Status check error:', err);
                if (attempts >= maxAttempts) {
                    reject(new Error('Max attempts reached: ' + err.message));
                } else {
                    setTimeout(checkStatus, 2000);
                }
            });
        };
        
        checkStatus();
    });
}

    calculateBgRemoveProgress() {
        // Custom progress calculation for background removal
        const baseProgress = (this.processedFiles / this.totalFiles) * 100;
        return Math.min(baseProgress + 10, 95); // Don't go to 100% until complete
    }

    async downloadUpscaledFiles() {
        const filesToDownload = this.files.filter(f => f.status === 'success' && f.upscaledUrl);
        if (filesToDownload.length === 0) return;

        try {
            if (filesToDownload.length === 1) {
                // Single file download
                const fileObj = filesToDownload[0];
                
                if (this.action === 'wisetech_bg_remove') {
                    // Handle background removed image download
                    const response = await fetch(fileObj.upscaledUrl.download_url);
                    if (!response.ok) throw new Error('Download failed');
                    
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = fileObj.upscaledUrl.filename;
                    document.body.appendChild(link);
                    link.click();
                    
                    // Cleanup
                    setTimeout(() => {
                        link.remove();
                        URL.revokeObjectURL(url);
                    }, 100);
                } else {
                    // Handle standard upscale/enhance download
                    const byteCharacters = atob(fileObj.upscaledUrl.image_data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: this.getMimeType(fileObj.upscaledUrl.filename) });

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = fileObj.upscaledUrl.filename;
                    document.body.appendChild(link);
                    link.click();

                    // Cleanup
                    setTimeout(() => {
                        link.remove();
                        URL.revokeObjectURL(url);
                    }, 100);
                }
            } else {
                // Multiple files - create ZIP
                const zip = new JSZip();
                const downloadPromises = filesToDownload.map(fileObj => {
                    if (this.action === 'wisetech_bg_remove') {
                        return fetch(fileObj.upscaledUrl.download_url)
                            .then(response => response.blob())
                            .then(blob => {
                                zip.file(fileObj.upscaledUrl.filename, blob);
                            });
                    } else {
                        const byteCharacters = atob(fileObj.upscaledUrl.image_data);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        zip.file(fileObj.upscaledUrl.filename, byteArray, { binary: true });
                        return Promise.resolve();
                    }
                });

                await Promise.all(downloadPromises);
                
                // Generate and download ZIP
                const zipBlob = await zip.generateAsync({ type: "blob" });
                const zipUrl = URL.createObjectURL(zipBlob);
                const link = document.createElement("a");
                link.href = zipUrl;
                const timestamp = new Date().toISOString().replace(/[:.-]/g, '').slice(0, 15);
                link.download = `processed_${timestamp}.zip`;
                document.body.appendChild(link);
                link.click();

                // Cleanup
                setTimeout(() => {
                    link.remove();
                    URL.revokeObjectURL(zipUrl);
                }, 100);
            }
        } catch (error) {
            // Show error and disable download button
            this.completeFaildError.textContent = `Download failed: ${error.message}`;
            this.viewFilesBtn.disabled = true;
            this.viewFilesBtn.classList.add('disabled-btn');
        }
    }

    getMimeType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
            'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp',
            'ico': 'image/x-icon', 'svg': 'image/svg+xml', 'avif': 'image/avif'
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }

    updateProcessingUI(filename) {
        this.filesProcessing.innerHTML = `
            <div class="processing-file">
                Processing: ${filename} (${this.processedFiles + 1}/${this.totalFiles})
            </div>
        `;
    }

    completeProcessing() {
        setTimeout(() => {
            // Reset processing flag
            this.isProcessing = false;
            
            // Re-enable upload interactions
            this.uploadBox.style.pointerEvents = 'auto';
            this.uploadBox.style.opacity = '1';
            this.fileInput.disabled = false;
            
            this.uploadBox.style.display = 'none';
            this.uploadComplete.style.display = 'block';
            this.filesPreview.style.display = 'none';
            
            const successIcon = this.uploadComplete.querySelector('.success-icon');
            this.completeFaildError.textContent = '';
            
            if (this.failedCount === 0) {
                // All succeeded
                successIcon.textContent = '✓';
                successIcon.style.backgroundColor = '#48bb78';
               this.completeTitle.textContent = 'Processing Complete!';
this.completeSubtitle.textContent = this.successCount === 1
  ? `Awesome — your image was processed successfully.`
  : `Awesome — all ${this.successCount} images were processed successfully.`;

                this.viewFilesBtn.disabled = false;
                this.viewFilesBtn.classList.remove('disabled-btn');
            } else if (this.successCount === 0) {
                // All failed
                successIcon.textContent = '✗';
                successIcon.style.backgroundColor = '#f56565';
                this.completeTitle.textContent = 'Processing Failed';
                this.completeSubtitle.textContent = `All ${this.failedCount} files failed to process`;
                this.viewFilesBtn.disabled = true;
                this.viewFilesBtn.classList.add('disabled-btn');
            } else {
                // Mixed results
                successIcon.textContent = '!';
                successIcon.style.backgroundColor = '#f6ad55';
                this.completeTitle.textContent = 'Processing Complete';
                this.completeSubtitle.textContent = 
                    `${this.successCount} succeeded, ${this.failedCount} failed`;
                this.viewFilesBtn.disabled = false;
                this.viewFilesBtn.classList.remove('disabled-btn');
            }
        }, 500);
    }

    updateFileStatus(fileId, status, icon) {
        const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileElement) {
            const statusIcon = fileElement.querySelector('.status-icon');
            if (statusIcon) {
                statusIcon.className = `status-icon status-${status}`;
                statusIcon.textContent = icon;
            }
        }
    }

    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
        const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
        
        if (fileElement) {
            fileElement.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                fileElement.remove();
                
                if (this.files.length === 0) {
                    this.filesPreview.classList.remove('show');
                }
            }, 300);
        }
        
        // Remove from processing queue if it's there
        this.processingQueue = this.processingQueue.filter(id => id !== fileId);
    }

    updateProgress(progress) {
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        
        const circumference = 2 * Math.PI * 25;
        const offset = circumference - (progress / 100) * circumference;
        
        progressBar.style.strokeDashoffset = offset;
        progressText.textContent = Math.round(progress) + '%';
    }

    startNewUpload() {
        // Reset processing flag
        this.isProcessing = false;
        
        // Re-enable upload interactions
        this.uploadBox.style.pointerEvents = 'auto';
        this.uploadBox.style.opacity = '1';
        this.fileInput.disabled = false;
        
        this.files = [];
        this.processingQueue = [];
        this.fileInput.value = '';
        
        this.uploadComplete.style.display = 'none';
        this.uploadBox.style.display = 'block';
        this.uploadBox.classList.remove('uploading');
        this.filesPreview.classList.remove('show');
        this.filesList.innerHTML = '';
        this.filesProcessing.innerHTML = '';
        
        // Reset progress
        this.updateProgress(0);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

        showError(message) {
        // Remove any existing error notifications
        const existingError = document.querySelector('.error-notification');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        
        // Add fade in animation
        setTimeout(() => {
            errorDiv.classList.add('show');
        }, 10);
        
        errorDiv.innerHTML = `
            <div class="error-notification-content">
                <div class="error-notification-text">
                    <div class="error-notification-message">⚠️ ${message}</div>
                </div>
                <button class="error-notification-close">×</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Close button handler
        const closeBtn = errorDiv.querySelector('.error-notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                errorDiv.classList.remove('show');
                setTimeout(() => {
                    if (errorDiv.parentElement) {
                        errorDiv.remove();
                    }
                }, 300);
            });
        }
        
        // Auto-hide after 10 seconds
        const autoHide = setTimeout(() => {
            if (errorDiv && errorDiv.parentElement) {
                errorDiv.classList.remove('show');
                setTimeout(() => {
                    if (errorDiv && errorDiv.parentElement) {
                        errorDiv.remove();
                    }
                }, 300);
            }
        }, 10000);
        
        // Clear timeout if manually closed
        errorDiv.addEventListener('click', (e) => {
            if (e.target.closest('.error-notification-close')) {
                clearTimeout(autoHide);
            }
        });
    }

    showLoginAlert(message) {
        // Remove any existing login alerts
        const existingAlert = document.querySelector('.login-alert-notification');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = 'login-alert-notification';
        
        // Add fade in animation
        setTimeout(() => {
            alertDiv.classList.add('show');
        }, 10);
        
        alertDiv.innerHTML = `
            <div class="login-alert-content">
                <div class="login-alert-icon">🔒</div>
                <div class="login-alert-text">
                    <div class="login-alert-title">Multiple Image Upload</div>
                    <div class="login-alert-message">${message}</div>
                </div>
                <div class="login-alert-actions">
                    <a href="${this.loginUrl}" class="login-alert-button">Login / Create Account</a>
                    <button class="login-alert-close">×</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Close button handler
        const closeBtn = alertDiv.querySelector('.login-alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                alertDiv.classList.remove('show');
                setTimeout(() => {
                    if (alertDiv.parentElement) {
                        alertDiv.remove();
                    }
                }, 300);
            });
        }
        
        // Auto-hide after 15 seconds
        const autoHide = setTimeout(() => {
            if (alertDiv && alertDiv.parentElement) {
                alertDiv.classList.remove('show');
                setTimeout(() => {
                    if (alertDiv && alertDiv.parentElement) {
                        alertDiv.remove();
                    }
                }, 300);
            }
        }, 15000);
        
        // Clear timeout if manually closed
        alertDiv.addEventListener('click', (e) => {
            if (e.target.closest('.login-alert-close')) {
                clearTimeout(autoHide);
            }
        });
    }

    addNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Error Notification Styles */
            .error-notification {
                position: fixed;
                top: 25%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                background: rgba(254, 226, 226, 0.98);
                color: #dc2626;
                border-radius: 16px;
                border: 1px solid rgba(252, 165, 165, 0.5);
                box-shadow: 0 20px 60px rgba(220, 38, 38, 0.3);
                z-index: 10000;
                backdrop-filter: blur(20px);
                max-width: 500px;
                width: 90%;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            
            .error-notification.show {
                opacity: 1;
                visibility: visible;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .error-notification-content {
                padding: 1.75rem;
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                position: relative;
            }

            
            @keyframes shake {
                0%, 100% { transform: rotate(0); }
                25% { transform: rotate(-5deg); }
                75% { transform: rotate(5deg); }
            }
            
            .error-notification-text {
                flex: 1;
                min-width: 0;
            }
            
            .error-notification-message {
                font-size: 1.75rem;
                line-height: 1.4;
                color: #991b1b;
            }
            
            .error-notification-close {
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                background: rgba(220, 38, 38, 0.1);
                border: none;
                color: #dc2626;
                font-size: 2.25rem;
                width: 1.75rem;
                height: 1.75rem;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                line-height: 1;
            }
            
            .error-notification-close:hover {
                background: rgba(220, 38, 38, 0.2);
                transform: rotate(90deg);
            }
            
            /* Login Alert Styles */
            .login-alert-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                z-index: 99999;
                max-width: 550px;
                width: 90%;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            
            .login-alert-notification.show {
                opacity: 1;
                visibility: visible;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .login-alert-content {
                background: linear-gradient(135deg, #ff436b 0%, #4651e6 100%);
                color: #fff;
                padding: 2rem;
                border-radius: 24px;
                box-shadow: 0 25px 80px rgba(70, 81, 230, 0.4);
                backdrop-filter: blur(20px);
                border: 2px solid rgba(255, 255, 255, 0.2);
                position: relative;
                overflow: hidden;
            }
            
            .login-alert-content::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
                background-size: 20px 20px;
                animation: float 20s linear infinite;
                z-index: 0;
            }
            
            @keyframes float {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .login-alert-icon {
                font-size: 3rem;
                margin-bottom: 1.5rem;
                animation: pulse 2s infinite;
                position: relative;
                z-index: 1;
            }
            
            @keyframes pulse {
                0%, 100% { 
                    transform: scale(1) rotate(0deg); 
                    filter: drop-shadow(0 5px 15px rgba(255, 255, 255, 0.3));
                }
                50% { 
                    transform: scale(1.1) rotate(5deg); 
                    filter: drop-shadow(0 10px 25px rgba(255, 255, 255, 0.5));
                }
            }
            
            .login-alert-text {
                position: relative;
                z-index: 1;
                margin-bottom: 1.5rem;
            }
            
            .login-alert-title {
                font-size: 1.5rem;
                font-weight: 800;
                margin-bottom: 0.75rem;
                color: #fff;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            
            .login-alert-message {
                font-size: 1rem;
                color: rgba(255, 255, 255, 0.95);
                line-height: 1.6;
            }
            
            .login-alert-actions {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                position: relative;
                z-index: 1;
            }
            
            .login-alert-button {
                background: rgba(255, 255, 255, 0.95);
                color: #4651e6;
                padding: 0.875rem 2rem;
                border-radius: 12px;
                text-decoration: none;
                font-weight: 700;
                font-size: 1rem;
                transition: all 0.3s ease;
                white-space: nowrap;
                display: inline-block;
                text-align: center;
                flex: 1;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                border: 2px solid transparent;
            }
            
            .login-alert-button:hover {
                background: #fff;
                transform: translateY(-3px);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
                color: #ff436b;
                border-color: rgba(255, 255, 255, 0.5);
            }
            
            .login-alert-close {
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
                color: #fff;
                font-size: 1.25rem;
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                line-height: 1;
                flex-shrink: 0;
                backdrop-filter: blur(10px);
            }
            
            .login-alert-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
                border-color: rgba(255, 255, 255, 0.5);
            }
            
            /* Slide out animation for file removal */
            @keyframes slideOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }
            
            .processing-file {
                margin-top: 1rem;
                color: #4651e6;
                font-size: 14px;
            }
            
            .file-remove {
                background: none;
                border: none;
                color: #f56565;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0 0.5rem;
                margin-left: 0.5rem;
            }
            
            .file-remove:hover {
                color: #c53030;
            }
            
            .upload-box.disabled {
                pointer-events: none;
                opacity: 0.7;
            }
            
            /* Responsive adjustments */
            @media (max-width: 640px) {
                .login-alert-content {
                    padding: 1.5rem;
                }
                
                .login-alert-title {
                    font-size: 1.25rem;
                }
                
                .login-alert-message {
                    font-size: 0.95rem;
                }
                
                .login-alert-actions {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .login-alert-button {
                    width: 100%;
                }
                
                .login-alert-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                }
                
                .error-notification-content {
                    padding: 1.25rem;
                    flex-direction: column;
                    text-align: center;
                }
                
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .error-notification {
                    background: rgba(127, 29, 29, 0.98);
                    color: #fecaca;
                    border-color: rgba(252, 165, 165, 0.2);
                }
                
                .error-notification-message {
                    color: #fca5a5;
                }
                
                .error-notification-close {
                    background: rgba(248, 113, 113, 0.2);
                    color: #fecaca;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the component when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FileUploadComponent();
});
