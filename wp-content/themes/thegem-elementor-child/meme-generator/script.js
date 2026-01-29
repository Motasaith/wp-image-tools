document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const canvas = document.getElementById('meme-canvas');
    const ctx = canvas.getContext('2d');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const fileInput = document.getElementById('image-upload');
    const dropZone = document.getElementById('drop-zone');
    const placeholderMsg = document.getElementById('placeholder-msg');
    const downloadBtn = document.getElementById('download-btn');

    // Filter Elements
    const chipBtns = document.querySelectorAll('.chip');
    const templateGrid = document.getElementById('template-grid');

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
    const activeRotationInput = document.getElementById('active-rotation');
    const rotationValDisplay = document.getElementById('rotation-val');
    const activeFontWeightInput = document.getElementById('active-font-weight');

    // --- Template Data (Top popular memes) ---
    const MEME_TEMPLATES = [
        // Trending/Popular (Mixed)
        { id: '181913649', name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg', category: 'trending' },
        // { id: '112126428', name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg', category: 'trending' },
        { id: '87743020', name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg', category: 'trending' },
        { id: '129242436', name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg', category: 'trending' },
        { id: '102156234', name: 'Mocking Spongebob', url: 'https://i.imgflip.com/1otk96.jpg', category: 'trending' },
        { id: '188713515', name: 'Woman Yelling At Cat', url: 'https://i.imgflip.com/1jwhww.jpg', category: 'animals' },
        { id: '217743513', name: 'Uno Draw 25 Cards', url: 'https://i.imgflip.com/3lmzyx.jpg', category: 'gaming' },
        { id: '131087935', name: 'Running Away Balloon', url: 'https://i.imgflip.com/261o3j.jpg', category: 'trending' },
        // { id: '247375501', name: 'Buff Doge vs. Cheems', url: 'https://i.imgflip.com/43a45p.jpg', category: 'animals' },
        // { id: '252600902', name: 'Always Has Been', url: 'https://i.imgflip.com/46e43q.jpg', category: 'movies' },
        // { id: '370867422', name: 'Megamind Peeking', url: 'https://i.imgflip.com/64sz4u.jpg', category: 'movies' },
        { id: '180190441', name: "They're The Same Picture", url: 'https://i.imgflip.com/2za3u1.jpg', category: 'movies' },
        // { id: '91538330', name: 'X, X Everywhere', url: 'https://i.imgflip.com/1ihk.jpg', category: 'classic' },
        { id: '224015000', name: 'Bernie I Am Once Again Asking', url: 'https://i.imgflip.com/3oevdk.jpg', category: 'trending' },
        { id: '124055727', name: 'Yall Got Any More Of Them', url: 'https://i.imgflip.com/21uy0f.jpg', category: 'trending' },
        // { id: '93895088', name: 'Expanding Brain', url: 'https://i.imgflip.com/1jhl51.jpg', category: 'trending' },
        { id: '438680', name: 'Batman Slapping Robin', url: 'https://i.imgflip.com/9ehk.jpg', category: 'classic' },

        // Classic
        { id: '61579', name: 'One Does Not Simply', url: 'https://i.imgflip.com/1bij.jpg', category: 'classic' },
        { id: '89370399', name: 'Roll Safe Think About It', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'classic' },
        { id: '61544', name: 'Success Kid', url: 'https://i.imgflip.com/1bip.jpg', category: 'classic' },
        { id: '61532', name: 'The Most Interesting Man In The World', url: 'https://i.imgflip.com/1bh8.jpg', category: 'classic' },
        { id: '61520', name: 'Futurama Fry', url: 'https://i.imgflip.com/1bgw.jpg', category: 'classic' },
        { id: '61539', name: 'First World Problems', url: 'https://i.imgflip.com/1bhf.jpg', category: 'classic' },
        { id: '61585', name: 'Bad Luck Brian', url: 'https://i.imgflip.com/1bhk.jpg', category: 'classic' },
        { id: '4087833', name: 'Waiting Skeleton', url: 'https://i.imgflip.com/2fm6x.jpg', category: 'classic' },
        { id: '101470', name: 'Ancient Aliens', url: 'https://i.imgflip.com/26am.jpg', category: 'classic' },
        { id: '61533', name: 'X All The Y', url: 'https://i.imgflip.com/1bh9.jpg', category: 'classic' },
        { id: '3218037', name: 'This Is Fine', url: 'https://i.imgflip.com/wxica.jpg', category: 'classic' },
        { id: '1035805', name: 'Boardroom Meeting Suggestion', url: 'https://i.imgflip.com/m78d.jpg', category: 'classic' },

        // Animals
        { id: '135256802', name: 'Epic Handshake', url: 'https://i.imgflip.com/28j0te.jpg', category: 'trending' },
        { id: '405658', name: 'Grumpy Cat', url: 'https://i.imgflip.com/8p0a.jpg', category: 'animals' },
        { id: '80707627', name: 'Sad Pablo Escobar', url: 'https://i.imgflip.com/1c1uej.jpg', category: 'trending' },
        { id: '8072285', name: 'Doge', url: 'https://i.imgflip.com/4t0m5.jpg', category: 'animals' },
        { id: '119139145', name: 'Blank Nut Button', url: 'https://i.imgflip.com/1qxmez.jpg', category: 'trending' },
        { id: '114585149', name: 'Inhaling Seagull', url: 'https://i.imgflip.com/1w7ygt.jpg', category: 'animals' },
        { id: '100777631', name: 'Is This A Pigeon', url: 'https://i.imgflip.com/1o00in.jpg', category: 'animals' },
        { id: '155067746', name: 'Surprised Pikachu', url: 'https://i.imgflip.com/2kbn1e.jpg', category: 'animals' },
        // { id: '178591752', name: 'Tuxedo Winnie The Pooh', url: 'https://i.imgflip.com/2ybua0.jpg', category: 'animals' },
        { id: '148909805', name: 'Monkey Puppet', url: 'https://i.imgflip.com/2gnnjh.jpg', category: 'animals' },

        // Movies/TV
        { id: '124822590', name: 'Left Exit 12 Off Ramp', url: 'https://i.imgflip.com/22bdq6.jpg', category: 'trending' },
        // { id: '123999232', name: 'The Scroll Of Truth', url: 'https://i.imgflip.com/21tqf6.jpg', category: 'trending' },
        { id: '27813981', name: 'Hide the Pain Harold', url: 'https://i.imgflip.com/gk5el.jpg', category: 'trending' },
        // { id: '110163934', name: 'I Bet Hes Thinking About Other Women', url: 'https://i.imgflip.com/1tl71a.jpg', category: 'trending' },
        // { id: '226297822', name: 'Panik Kalm Panik', url: 'https://i.imgflip.com/3qqcim.jpg', category: 'trending' },
        { id: '135678846', name: 'Who Killed Hannibal', url: 'https://i.imgflip.com/28s2gu.jpg', category: 'movies' },
        { id: '131940431', name: 'Gru\'s Plan', url: 'https://i.imgflip.com/26jxvz.jpg', category: 'movies' },
        { id: '91545132', name: 'Trump Bill Signing', url: 'https://i.imgflip.com/1ii4oc.jpg', category: 'trending' },
        { id: '100947', name: 'Matrix Morpheus', url: 'https://i.imgflip.com/25w3.jpg', category: 'movies' },
        { id: '161865971', name: 'Marked Safe From', url: 'https://i.imgflip.com/2odckz.jpg', category: 'trending' },
        { id: '6235864', name: 'Finding Neverland', url: 'https://i.imgflip.com/3pnmg.jpg', category: 'movies' },
        { id: '14371066', name: 'Star Wars Yoda', url: 'https://i.imgflip.com/8k0sa.jpg', category: 'movies' },
        // { id: '322841258', name: 'Anakin Padme', url: 'https://i.imgflip.com/5c7lwq.jpg', category: 'movies' }
    ];

    // Duplicate some for "Trending" to fill grid, or categorize better
    // For now, this is a good start of ~40 templates.

    // --- Template Rendering ---
    function renderTemplates(category) {
        templateGrid.innerHTML = '';
        const filtered = category === 'all'
            ? MEME_TEMPLATES
            : MEME_TEMPLATES.filter(t => t.category === category || (category === 'trending' && t.category === 'trending')); // trending logic loose

        filtered.forEach(t => {
            const img = document.createElement('img');
            img.src = t.url;
            img.className = 'template-thumb';
            img.alt = t.name;
            img.crossOrigin = 'anonymous';
            img.addEventListener('click', () => {
                // Remove selected from others
                document.querySelectorAll('.template-thumb').forEach(el => el.classList.remove('selected'));
                img.classList.add('selected');
                loadImage(t.url);
            });
            templateGrid.appendChild(img);
        });
    }

    // Filter Listeners
    chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chipBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTemplates(btn.dataset.category);
        });
    });

    // Initial Render
    renderTemplates('all');

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

    // File Input Logic
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
            rotation: 0,
            fontWeight: 900,
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
            rotation: 0,
            fontWeight: 900,
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
            activeRotationInput.value = selected.rotation || 0;
            if (rotationValDisplay) rotationValDisplay.textContent = (selected.rotation || 0) + '°';
            if (activeFontWeightInput) activeFontWeightInput.value = selected.fontWeight || 900;
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
    activeRotationInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (rotationValDisplay) rotationValDisplay.textContent = val + '°';
        updateSelected('rotation', val);
    });
    if (activeFontWeightInput) {
        activeFontWeightInput.addEventListener('change', (e) => updateSelected('fontWeight', parseInt(e.target.value)));
    }

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
            const weight = t.fontWeight || 900;
            ctx.font = `${weight} ${t.size}px "Impact", "Oswald", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Prepare drawing
            // Save state
            ctx.save();

            // Move to center of text
            ctx.translate(t.x, t.y);
            // Rotate
            ctx.rotate((t.rotation || 0) * Math.PI / 180);

            // Draw relative to (0,0)
            // Stroke & Fill
            ctx.strokeText(t.text, 0, 0);
            ctx.fillText(t.text, 0, 0);

            // Selection Box (only if selected)
            if (t.isSelected) {
                const metrics = ctx.measureText(t.text);
                const width = metrics.width;
                const height = t.size; // Approx

                ctx.strokeStyle = '#007bff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                // Draw box centered around 0,0
                ctx.strokeRect(-width / 2 - 10, -height / 2 - 5, width + 20, height + 10);
            }

            // Restore
            ctx.restore();
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
        // Calculate Bounding Box dimensions
        const weight = textObj.fontWeight || 900;
        ctx.font = `${weight} ${textObj.size}px "Impact", "Oswald", sans-serif`;
        const metrics = ctx.measureText(textObj.text);
        const width = metrics.width;
        const height = textObj.size; // Approx height

        // Transform mouse point into text's local coordinate system
        // 1. Translate
        const dx = x - textObj.x;
        const dy = y - textObj.y;

        // 2. Rotate (inverse rotation)
        const rad = -(textObj.rotation || 0) * Math.PI / 180;
        const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

        // Check if rotated point is within unrotated box centered at origin
        const halfW = width / 2 + 10; // +10 padding
        const halfH = height / 2 + 5; // +5 padding

        return (rx >= -halfW && rx <= halfW && ry >= -halfH && ry <= halfH);
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

    // --- Transfer Manager Integration ---
    if (window.transferManager) {
        // 1. Auto-Load
        transferManager.getImage().then(data => {
            if (data && data.blob) {
                // Meme Gen needs Data URL for loadImage
                const reader = new FileReader();
                reader.onload = (e) => {
                    // We load it as if it were a file upload
                    loadImage(e.target.result);
                };
                reader.readAsDataURL(data.blob);
                transferManager.clearImage();
            }
        });

        // 2. Intercept Sidebar
        const toolLinks = document.querySelectorAll('.tools-list a');
        toolLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                // If we have an image loaded, ask to transfer
                if (currentImage) {
                    e.preventDefault();
                    link.innerHTML = '⏳ Saving...';
                    const originalHref = link.href;

                    try {
                        // Generate Meme Blob
                        canvas.toBlob(async (blob) => {
                            if (blob) {
                                await transferManager.saveImage(blob, 'meme_' + Date.now() + '.png');
                                window.location.href = originalHref;
                            } else {
                                window.location.href = originalHref;
                            }
                        }, 'image/png');
                    } catch (err) {
                        console.error("Transfer failed", err);
                        window.location.href = originalHref;
                    }
                }
            });
        });
    }

});
