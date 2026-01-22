// Define global State
let imageEditor = null;

// Define Global Handler
window.handleFileSelect = (input) => {
    console.log("handleFileSelect Triggered");
    
    if (!imageEditor) {
        console.error("Image Editor is not ready.");
        // Check availability
        if (typeof tui === 'undefined') console.error("Toast UI lib is MISSING.");
        else console.log("Toast UI lib is present.");
        
        alert("Editor is still loading resources. Please wait a moment...");
        return;
    }

    if (input.files && input.files.length > 0) {
        const file = input.files[0];
        console.log("File selected:", file.name);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            console.log("FileReader loaded. Loading into Editor...");
            
            // Load into Editor
            imageEditor.loadImageFromURL(e.target.result, file.name)
                .then(() => {
                    console.log("Image Loaded Successfully");
                    imageEditor.clearUndoStack();
                    
                    // Hide Upload Screen
                    const uploadScreen = document.getElementById('upload-screen');
                    if (uploadScreen) uploadScreen.style.display = 'none';
                    
                    // Force resize to ensure visibility
                    setTimeout(() => {
                            if(imageEditor.ui && imageEditor.ui.resizeEditor) {
                                imageEditor.ui.resizeEditor();
                            }
                            // Also ensure canvas is visible
                            const container = document.querySelector('.tui-image-editor-canvas-container');
                            if(container) container.style.visibility = 'visible'; // Just in case
                    }, 250);
                })
                .catch(err => {
                    console.error("Failed to load image:", err);
                    alert("Failed to load image. Please try another file.");
                });
        };
        reader.onerror = (err) => {
            console.error("FileReader Error:", err);
            alert("Error reading file.");
        };
        reader.readAsDataURL(file);
    }
};

// Use 'load' instead of 'DOMContentLoaded' to ensure external scripts (CDN) are full loaded
window.addEventListener('load', () => {
    console.log("Window loaded. Initializing Image Editor...");

    // Dependency Check
    if (typeof tui === 'undefined' || typeof tui.ImageEditor === 'undefined') {
        console.error("CRITICAL: Toast UI Image Editor library not found! Check CDN links.");
        alert("Error: Editor resources failed to load. Please refresh.");
        return;
    }
    
    // --- State ---
    const uploadBtn = document.querySelector('.upload-btn');
    if(uploadBtn) uploadBtn.innerText = "Loading Editor...";
    if(uploadBtn) uploadBtn.disabled = true;

    // --- Initialize Editor ---
    // Theme Config (White Theme)
    const theme = {
        'common.bi.image': '', // No generic logo
        'common.bisize.width': '0px',
        'common.bisize.height': '0px',
        'common.backgroundImage': 'none',
        'common.backgroundColor': '#fff',
        'common.border': '0px',

        // Header
        'header.backgroundImage': 'none',
        'header.backgroundColor': 'transparent',
        'header.border': '0px',

        // Load Button
        'loadButton.backgroundColor': '#fff',
        'loadButton.border': '1px solid #ddd',
        'loadButton.color': '#222',
        'loadButton.fontFamily': 'Outfit, sans-serif',
        'loadButton.fontSize': '12px',
        'loadButton.display': 'none', // Hide default load

        // Download Button
        'downloadButton.backgroundColor': '#2D5BFF',
        'downloadButton.border': '1px solid #2D5BFF',
        'downloadButton.color': '#fff',
        'downloadButton.fontFamily': 'Outfit, sans-serif',
        'downloadButton.fontSize': '12px',
        
        // Main Menu
        'menu.normalIcon.path': 'https://uicdn.toast.com/tui-image-editor/latest/svg/icon-b.svg',
        'menu.activeIcon.path': 'https://uicdn.toast.com/tui-image-editor/latest/svg/icon-a.svg',
        'menu.disabledIcon.path': 'https://uicdn.toast.com/tui-image-editor/latest/svg/icon-a.svg',
        'menu.hoverIcon.path': 'https://uicdn.toast.com/tui-image-editor/latest/svg/icon-c.svg',
        'menu.iconSize.width': '24px',
        'menu.iconSize.height': '24px',
        'menu.backgroundColor': '#fff', // White menu
    };

    try {
        imageEditor = new tui.ImageEditor('#tui-image-editor-container', {
            includeUI: {
                loadImage: {
                    path: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // Empty placeholder
                    name: 'Blank'
                },
                theme: theme,
                initMenu: 'filter',
                menuBarPosition: 'bottom',
                uiSize: {
                    width: '100%',
                    height: '100%'
                }
            },
            cssMaxWidth: window.innerWidth > 1000 ? 1000 : window.innerWidth - 40,
            cssMaxHeight: window.innerHeight > 800 ? 800 : window.innerHeight - 200,
            selectionStyle: {
                cornerSize: 20,
                rotatingPointOffset: 70
            }
        });
        
        console.log("Image Editor Initialized Successfully");
        
        // Re-enable button
        if(uploadBtn) uploadBtn.innerText = "Select Image";
        if(uploadBtn) uploadBtn.disabled = false;
        
    } catch (e) {
        console.error("Failed to init Toast UI:", e);
        if(uploadBtn) uploadBtn.innerText = "Error Loading";
    }
    
    // Cleanup: Remove generic generic logo elements created by lib
    setTimeout(() => {
        const logo = document.querySelector('.tui-image-editor-header-logo');
        if(logo) logo.style.display = 'none';
        
        // Correct the height of canvas container
        const canvasContainer = document.querySelector('.tui-image-editor-main');
        if (canvasContainer) {
            canvasContainer.style.top = '0'; // Sometimes it defaults to something else
        }
    }, 500);

});
