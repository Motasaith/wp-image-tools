<?php
/*
 * Template Name: Meme Generator Tool
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

// Asset URL
$assets_url = get_stylesheet_directory_uri() . '/meme-generator';
?>

<!-- Load Local CSS -->
<link rel="stylesheet" href="<?php echo $assets_url; ?>/style.css?v=<?php echo time(); ?>">
<!-- Google Fonts -->
<link
    href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Oswald:wght@500;700&display=swap"
    rel="stylesheet">

<div class="meme-app">

    <!-- Header -->
    <header class="meme-header">
        <h1 class="meme-title">Meme Generator</h1>
        <p class="meme-subtitle">Create funny memes instantly. Choose a template or upload your own.</p>
    </header>

    <!-- App Workspace -->
    <div class="meme-workspace">

        <!-- Left: Controls -->
        <aside class="meme-controls">

            <!-- Tabs -->
            <div class="meme-tabs">
                <button class="tab-btn active" data-tab="templates">Templates</button>
                <button class="tab-btn" data-tab="upload">Upload</button>
            </div>

            <!-- Tab Content: Templates -->
            <div id="tab-templates" class="tab-content active">

                <!-- Category Filters -->
                <div class="filter-chips">
                    <button class="chip active" data-category="all">All</button>
                    <button class="chip" data-category="trending">Trending</button>
                    <button class="chip" data-category="classic">Classic</button>
                    <button class="chip" data-category="animals">Animals</button>
                    <button class="chip" data-category="movies">Movies/TV</button>
                    <button class="chip" data-category="gaming">Gaming</button>
                </div>

                <div class="template-grid" id="template-grid">
                    <!-- Templates will be loaded here via JS -->
                </div>
            </div>

            <!-- Tab Content: Upload -->
            <div id="tab-upload" class="tab-content">
                <div class="upload-area" id="drop-zone">
                    <p>Drag & Drop an image here</p>
                    <p>or</p>
                    <input type="file" id="image-upload" accept="image/*" />
                    <label for="image-upload" class="btn-secondary">Choose File</label>
                </div>
            </div>

            <hr class="divider">

            <!-- Text Controls -->
            <div class="control-group-row"
                style="align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                <label style="margin: 0; font-size: 1.1rem; font-weight: 700;">Text Layers</label>
                <button id="add-text-btn" class="btn-secondary"
                    style="margin: 0; background: #007bff; color: white; border: none;">+ Add Text</button>
            </div>

            <!-- Contextual Editor (Hidden until text is selected) -->
            <div id="text-editor"
                style="display: none; background: #f1f1f1; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <div class="control-group">
                    <label>Text Content</label>
                    <textarea id="active-text-input" class="text-input" rows="2" placeholder="Type here..."></textarea>
                </div>

                <div class="control-group-row">
                    <div class="half">
                        <label>Size (px)</label>
                        <input type="number" id="active-font-size" value="40" min="10" max="200">
                    </div>
                    <div class="half">
                        <label>Color</label>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <input type="color" id="active-text-color" value="#ffffff"
                                style="height: 38px; padding: 2px;">
                            <input type="color" id="active-stroke-color" value="#000000"
                                style="height: 38px; padding: 2px;" title="Outline Color">
                        </div>
                    </div>
                </div>

                <div class="control-group-row">
                    <div class="half">
                        <label>Rotation (°)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="range" id="active-rotation" min="0" max="360" value="0" style="flex: 1;">
                            <span id="rotation-val" style="width: 30px; text-align: right; font-weight: bold;">0°</span>
                        </div>
                    </div>
                    <div class="half">
                        <label>Weight</label>
                        <select id="active-font-weight" class="text-input" style="padding: 0.5rem;">
                            <option value="400">Normal</option>
                            <option value="700">Bold</option>
                            <option value="900">Extra Bold</option>
                        </select>
                    </div>
                </div>

                <button id="delete-text-btn"
                    style="width: 100%; background: #ff4757; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: 600;">Delete
                    Text</button>
            </div>

            <div id="no-selection-msg"
                style="text-align: center; color: #888; font-style: italic; margin-bottom: 1.5rem;">
                Select text on the image to edit
            </div>

            <button id="download-btn" class="btn-primary">Download Meme</button>

            <!-- More Tools Sidebar -->
            <?php get_template_part('sidebar-tools'); ?>

        </aside>

        <!-- Right: Preview -->
        <div class="meme-preview">
            <div class="canvas-container">
                <canvas id="meme-canvas"></canvas>
                <div id="placeholder-msg">Select a template or upload an image to start</div>
            </div>
        </div>

    </div>

</div>

<!-- Logic Script -->
<script src="<?php echo get_stylesheet_directory_uri(); ?>/transfer-manager.js?v=<?php echo time(); ?>"></script>
<script src="<?php echo $assets_url; ?>/script.js?v=<?php echo time(); ?>"></script>

<?php get_footer(); ?>