<?php
/*
 * Template Name: Image Sharpen Tool
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

// Asset URL
$assets_url = get_stylesheet_directory_uri() . '/image-sharpen';
?>

<!-- Load Local CSS -->
<link rel="stylesheet" href="<?php echo $assets_url; ?>/style.css?v=<?php echo time(); ?>">
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<div class="sharpen-app">

    <!-- Header -->
    <header class="sharpen-header">
        <h1 class="sharpen-title">Image Sharpener</h1>
        <p class="sharpen-subtitle">Enhance photo details instantly right in your browser. No upload required.</p>
    </header>

    <!-- App Workspace -->
    <div class="sharpen-workspace">

        <!-- Controls (Left) -->
        <aside class="sharpen-controls">

            <div class="upload-area" id="drop-zone">
                <div class="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </div>
                <h3>Upload Image</h3>
                <p>Drag & drop or click to browse</p>
                <input type="file" id="image-upload" accept="image/*">
                <label for="image-upload" class="btn-secondary">Choose File</label>
            </div>

            <hr class="divider">

            <!-- Sharpen Settings -->
            <div class="control-group" id="settings-panel" style="opacity: 0.5; pointer-events: none;">
                <div class="slider-header">
                    <label>Sharpen Intensity</label>
                    <span id="intensity-val">0</span>
                </div>
                <input type="range" id="intensity-slider" min="0" max="100" value="0" class="range-slider">
                <p class="help-text">Slide right to increase sharpness.</p>
            </div>

            <div class="action-bar">
                <button id="download-btn" class="btn-primary" disabled>Download Image</button>
            </div>

            <!-- More Tools Sidebar -->
            <?php get_template_part('sidebar-tools'); ?>

        </aside>

        <!-- Preview (Right) -->
        <div class="sharpen-preview">
            <div class="canvas-wrapper">
                <canvas id="main-canvas"></canvas>
                <div id="placeholder-msg">Upload an image to start sharpening</div>
                <div id="compare-label" class="compare-badge" style="display: none;">Original (Hold to View)</div>
            </div>

            <!-- Comparison Toggle (Optional, using "Push to compare" logic usually better) -->
            <button id="compare-btn" class="btn-floating" style="display: none;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Hold to Compare
            </button>
        </div>

    </div>

</div>

<!-- Logic Script -->
<script src="<?php echo $assets_url; ?>/script.js?v=<?php echo time(); ?>"></script>

<?php get_footer(); ?>