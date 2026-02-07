<?php
/*
 * Template Name: Image Resizer Tool
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

// Asset URL
$assets_url = get_stylesheet_directory_uri() . '/image-resizer';
?>

<!-- Load Local CSS -->
<link rel="stylesheet" href="<?php echo $assets_url; ?>/style.css?ver=<?php echo filemtime(__DIR__ . '/style.css'); ?>">
<!-- Google Fonts (Already loaded in main theme mostly, but ensuring Outfit) -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<div class="resizer-app">

    <!-- Header -->
    <header class="resizer-header">
        <!-- <a href="/" class="site-logo-link"> -->
        <!-- Using get_theme_file_uri for better child theme support -->
        <!-- <img src="<?php echo get_theme_file_uri('/image-resizer/logo.png'); ?>?v=<?php echo time(); ?>"
                alt="UpscaleIMG" class="resizer-logo"
                style="display: block; margin: 0 auto 1.5rem auto; max-width: 300px; height: auto;">
        </a> -->
        <h1 class="resizer-title">Free Image Resizer</h1>
        <p class="resizer-subtitle">Easily resize your images for social media, print, and web.</p>
    </header>

    <!-- App Workspace -->
    <div class="resizer-workspace">

        <!-- Left: Canvas + Queue -->
        <div class="workspace-left">

            <!-- Canvas / Visualizer -->
            <div class="canvas-container" id="drop-zone">

                <!-- Upload Prompt (Initial State) -->
                <div class="upload-overlay" id="upload-screen">
                    <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color:#333;">Drag & drop images</h2>
                    <p style="color:#666; margin-bottom: 2rem;">or browse to upload multiple files</p>
                    <button class="upload-btn" onclick="document.getElementById('file-input').click()">Upload
                        photos</button>
                    <!-- Added 'multiple' attribute -->
                    <input type="file" id="file-input" accept="image/*" multiple style="display: none;"
                        onchange="handleFileSelect(this)">

                    <div style="margin-top: 2rem; color: #888; font-size: 0.9rem;">
                        <span style="color: var(--brand-pink); margin-right: 5px;">✔</span> Free to use
                        <span style="color: var(--brand-pink); margin-left: 10px; margin-right: 5px;">✔</span> Batch
                        Processing
                    </div>
                </div>

                <!-- Editor Wrapper (Hidden initially) -->
                <div class="resizable-box" id="editor-box" style="display: none;">
                    <div class="resize-border"></div>
                    <!-- Handles -->
                    <div class="resize-handle handle-tl" data-handle="tl"></div>
                    <div class="resize-handle handle-tr" data-handle="tr"></div>
                    <div class="resize-handle handle-bl" data-handle="bl"></div>
                    <div class="resize-handle handle-br" data-handle="br"></div>

                    <!-- The Image -->
                    <img id="target-image" src="" alt="To Resize">
                </div>

            </div>

            <!-- File Queue Strip -->
            <div class="file-queue-strip" id="file-queue" style="display:none;">
                <!-- Add Button (Always First/Last?) Let's put it at the start -->
                <div class="queue-item add-btn" onclick="document.getElementById('file-input').click()"
                    title="Add more photos">
                    <span style="font-size: 2rem; color: #ccc;">+</span>
                </div>
                <!-- Queue Items will be injected here -->
            </div>

        </div>

        <!-- Right: Controls -->
        <aside class="controls-panel">

            <!-- Mode Toggle -->
            <div class="panel-section" style="margin-bottom: 1.5rem;">
                <label class="panel-label">Resizer Mode</label>
                <div class="mode-toggle">
                    <div class="mode-option active" id="mode-normal" onclick="switchMode('normal')">Normal</div>
                    <div class="mode-option" id="mode-smart" onclick="switchMode('smart')">Smart Mode</div>
                </div>
            </div>

            <!-- Smart Start Options (Background) - Hidden by default -->
            <div id="smart-controls" style="display: none;">
                <div class="panel-section">
                    <label class="panel-label">Background Fill</label>
                    <div class="pill-select">
                        <div class="pill-option active" id="bg-blur-opt" onclick="setSmartBg('blur')">Blur</div>
                        <div class="pill-option" id="bg-color-opt" onclick="setSmartBg('color')">Color</div>
                    </div>

                    <!-- Color Picker (Visible only if Color is selected) -->
                    <div id="color-picker-wrap" style="display: none; margin-top: 10px;">
                        <input type="color" id="bg-color-picker" value="#ffffff"
                            style="width: 100%; height: 40px; border: 1px solid #ccc; cursor: pointer;">
                    </div>
                </div>
            </div>

            <div class="panel-section">
                <label class="panel-label">Resize for</label>
                <select class="form-control" id="preset-select">
                    <option value="custom">Custom</option>
                    <option value="instagram-story">Instagram Story (1080x1920)</option>
                    <option value="instagram-post">Instagram Post (1080x1080)</option>
                    <option value="youtube-thumb">YouTube Thumbnail (1280x720)</option>
                    <option value="facebook-cover">Facebook Cover (820x312)</option>
                </select>
            </div>

            <div class="panel-section">
                <label class="panel-label">Dimensions (Applied to All)</label>
                <div class="input-group">
                    <div class="input-wrap">
                        <label>Width</label>
                        <input type="number" class="form-control" id="input-width" value="0">
                    </div>

                    <!-- Link Aspect Ratio -->
                    <button class="link-btn locked" id="link-aspect" title="Lock Aspect Ratio">
                        <span style="font-size: 1.2rem;">∞</span> <!-- Infinity symbol as link/chain proxy -->
                    </button>

                    <div class="input-wrap">
                        <label>Height</label>
                        <input type="number" class="form-control" id="input-height" value="0">
                    </div>
                    <div style="align-self: flex-end; padding-bottom: 10px; color: #666; font-size: 0.9rem;">px</div>
                </div>
            </div>

            <div class="panel-section">
                <label class="panel-label">Scale</label>
                <input type="range" id="scale-slider" min="1" max="200" value="100" style="width: 100%;">
                <div style="text-align: right; font-size: 0.8rem; color: #666; margin-top: 5px;" id="scale-val">100%
                </div>
            </div>

            <div class="action-bar">
                <button class="btn-primary" id="download-btn">Download</button>
            </div>

            <div class="mt-3 text-center" style="margin-top: 1rem;">
                <button class="btn-secondary" onclick="location.reload()"
                    style="background: transparent; text-decoration: underline;">Start Over</button>
            </div>

            <!-- More Tools Sidebar -->
            <?php get_template_part('sidebar-tools'); ?>

        </aside>

    </div>

</div>

<!-- Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<!-- Logic Script -->
<script src="<?php echo get_stylesheet_directory_uri(); ?>/transfer-manager.js?v=<?php echo time(); ?>"></script>
<script src="<?php echo $assets_url; ?>/script.js?ver=<?php echo filemtime(__DIR__ . '/script.js'); ?>"></script>

<?php get_footer(); ?>