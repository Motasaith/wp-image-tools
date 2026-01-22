document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const canvas = document.getElementById('meme-canvas');
    const ctx = canvas.getContext('2d');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const templateThumbs = document.querySelectorAll('.template-thumb');
    const fileInput = document.getElementById('image-upload');
    const dropZone = document.getElementById('drop-zone');
    const placeholderMsg = document.getElementById('placeholder-msg');
    const downloadBtn = document.getElementById('download-btn');

    // Text Controls
    const addTextBtn = document.getElementById('add-text-btn');
    const textEditor = document.getElementById('text-editor');
    const noSelectionMsg = document.getElementById('no-selection-msg');
    const deleteTextBtn = document.getElementById('delete-text-btn');

    // Inputs (for active selection)
    const activeTextInput = document.getElementById('active-text-input');
    const activeFontSizeInput = document.getElementById('active-font-size');
    const activeTextColorInput = document.getElementById('active-text-color');
    const activeStrokeColorInput = document.getElementById('active-stroke-color');

    // --- State ---
    let currentImage = null;
    let texts = []; // Array of { id, text, x, y, size, color, strokeColor, isSelected }
    let isDragging = false;
    let dragTargetId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // --- Initialization ---
    // tabBtns.forEach... (No change needed)
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    templateThumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            templateThumbs.forEach(t => t.classList.remove('selected'));
            thumb.classList.add('selected');
            loadImage(thumb.src);
        });
    });

    fileInput.addEventListener('change', handleFileSelect);
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#007bff'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = '#ccc'; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    function handleFileSelect(e) { if (e.target.files.length) handleFile(e.target.files[0]); }
    function handleFile(file) {
        if (!file.type.match('image.*')) return;
        const reader = new FileReader();
        reader.onload = (e) => loadImage(e.target.result);
        reader.readAsDataURL(file);
    }

    function loadImage(src) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;
        img.onload = () => {
            currentImage = img;
            placeholderMsg.style.display = 'none';
            // Reset texts when loading new image? User might want to keep them.
            // Let's keep them for now, but ensure they are within bounds?
            // Or maybe clear them for fresh start. Let's clear for simplicity.
            texts = [];
            addDefaultText(); // Add one initial text
            renderMeme();
        };
        img.onerror = () => alert('Could not load image.');
    }

    // --- Text Logic ---

    function addDefaultText() {
        // Center of canvas or safe area
        const id = Date.now();
        texts.push({
            id: id,
            text: 'EDIT TEXT',
            x: canvas.width / 2,
            y: 50, // Top
            size: 50,
            color: '#ffffff',
            strokeColor: '#000000',
            isSelected: true // Auto select new
        });
        selectText(id);
    }

    addTextBtn.addEventListener('click', () => {
        if (!currentImage) {
            alert('Please select an image first.');
            return;
        }
        const id = Date.now();
        texts.push({
            id: id,
            text: 'NEW TEXT',
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: 50,
            color: '#ffffff',
            strokeColor: '#000000',
            isSelected: true
        });
        selectText(id);
        renderMeme();
    });

    function selectText(id) {
        texts.forEach(t => t.isSelected = (t.id === id));
        const selected = texts.find(t => t.id === id);

        if (selected) {
            // Show Editor
            textEditor.style.display = 'block';
            noSelectionMsg.style.display = 'none';

            // Populate Inputs
            activeTextInput.value = selected.text;
            activeFontSizeInput.value = selected.size;
            activeTextColorInput.value = selected.color;
            activeStrokeColorInput.value = selected.strokeColor;
        } else {
            textEditor.style.display = 'none';
            noSelectionMsg.style.display = 'block';
        }
    }

    deleteTextBtn.addEventListener('click', () => {
        texts = texts.filter(t => !t.isSelected);
        selectText(null); // Deselect
        renderMeme();
    });

    // --- Input Sync ---
    activeTextInput.addEventListener('input', (e) => updateSelected('text', e.target.value));
    activeFontSizeInput.addEventListener('input', (e) => updateSelected('size', parseInt(e.target.value)));
    activeTextColorInput.addEventListener('input', (e) => updateSelected('color', e.target.value));
    activeStrokeColorInput.addEventListener('input', (e) => updateSelected('strokeColor', e.target.value));

    function updateSelected(prop, value) {
        const selected = texts.find(t => t.isSelected);
        if (selected) {
            selected[prop] = value;
            renderMeme();
        }
    }

    // --- Rendering ---
    function renderMeme() {
        if (!currentImage) return;

        // Resize Canvas to fit image
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;

        ctx.drawImage(currentImage, 0, 0);

        texts.forEach(t => {
            ctx.font = `900 ${t.size}px "Impact", "Oswald", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Prepare drawing
            ctx.lineWidth = t.size / 15;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = t.strokeColor;
            ctx.fillStyle = t.color;

            // Draw Stroke & Fill
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillText(t.text, t.x, t.y);

            // Selection Box (only if selected)
            if (t.isSelected) {
                const metrics = ctx.measureText(t.text);
                const width = metrics.width;
                const height = t.size; // Approx

                ctx.save();
                ctx.strokeStyle = '#007bff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                // Draw box centered around x,y
                ctx.strokeRect(t.x - width / 2 - 10, t.y - height / 2 - 5, width + 20, height + 10);
                ctx.restore();
            }
        });
    }

    // --- Canvas Interact (Drag) ---
    // Helper to get mouse pos relative to canvas, scaled if CSS resizes canvas
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        // Standardize event (touch vs mouse)
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    // Hit Testing
    function isHit(textObj, x, y) {
        // Simple bounding box check
        ctx.font = `900 ${textObj.size}px "Impact", "Oswald", sans-serif`;
        const metrics = ctx.measureText(textObj.text);
        const width = metrics.width;
        const height = textObj.size; // Approx height

        // Centered coordinates
        const left = textObj.x - width / 2 - 10;
        const right = textObj.x + width / 2 + 10;
        const top = textObj.y - height / 2 - 5;
        const bottom = textObj.y + height / 2 + 5;

        return (x >= left && x <= right && y >= top && y <= bottom);
    }

    function handleStart(e) {
        e.preventDefault();
        const pos = getMousePos(e);

        // Check hits in reverse order (top layer first)
        let hitFound = false;
        for (let i = texts.length - 1; i >= 0; i--) {
            if (isHit(texts[i], pos.x, pos.y)) {
                dragTargetId = texts[i].id;
                dragOffsetX = pos.x - texts[i].x;
                dragOffsetY = pos.y - texts[i].y;
                isDragging = true;
                selectText(dragTargetId);
                renderMeme(); // Update selection visual
                hitFound = true;
                break;
            }
        }

        if (!hitFound) {
            selectText(null); // Deselect if clicked background
            renderMeme();
        }
    }

    function handleMove(e) {
        if (!isDragging || !dragTargetId) return;
        e.preventDefault();
        const pos = getMousePos(e);

        const target = texts.find(t => t.id === dragTargetId);
        if (target) {
            target.x = pos.x - dragOffsetX;
            target.y = pos.y - dragOffsetY;
            renderMeme();
        }
    }

    function handleEnd(e) {
        if (isDragging) e.preventDefault();
        isDragging = false;
        dragTargetId = null;
    }

    // Mouse Listeners
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);

    // Touch Listeners
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);

    // --- Download ---
    downloadBtn.addEventListener('click', () => {
        if (!currentImage) return;

        // Deselect text before saving so box doesn't show
        const previouslySelected = texts.find(t => t.isSelected);
        if (previouslySelected) previouslySelected.isSelected = false;
        renderMeme();

        const link = document.createElement('a');
        link.download = `meme-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Restore selection
        if (previouslySelected) previouslySelected.isSelected = true;
        renderMeme();
    });

});
