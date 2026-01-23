<?php
/*
 * Template Name: Image Compressor Tool
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

// Asset URL
$assets_url = get_stylesheet_directory_uri() . '/image-compressor';
?>

<!-- Load Local CSS -->
<link rel="stylesheet" href="<?php echo $assets_url; ?>/style.css?v=<?php echo time(); ?>">
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<div class="resizer-app">

    <!-- Header -->
    <header class="resizer-header">
        <a href="/" class="site-logo-link">
            <img src="<?php echo get_theme_file_uri('/image-resizer/logo.png'); ?>" alt="UpscaleIMG"
                class="resizer-logo"
                style="display: block; margin: 0 auto 1.5rem auto; max-width: 300px; height: auto;">
        </a>
        <h1 class="resizer-title">Free Image Compressor</h1>
        <p class="resizer-subtitle">Reduce file size while maintaining the best possible quality.</p>
    </header>

    <!-- App Workspace -->
    <div class="resizer-workspace"
        style="max-width: 1000px; margin: 0 auto; height: auto; min-height: 500px; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">

        <!-- Main Area: Queue & Stats -->
        <div class="workspace-main"
            style="flex: 2; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column;">

            <!-- Area to Drag & Drop -->
            <div id="drop-zone"
                style="flex: 1; min-height: 300px; background: #f9f9f9; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">

                <!-- Initial Upload Screen -->
                <div class="upload-overlay" id="upload-screen">
                    <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color:#333;">Compress Images</h2>
                    <p style="color:#666; margin-bottom: 2rem;">Drag & drop or browse (Max 20 files)</p>
                    <button class="upload-btn" onclick="document.getElementById('file-input').click()">Select
                        Images</button>
                    <input type="file" id="file-input" accept="image/*" multiple style="display: none;"
                        onchange="handleFileSelect(this)">
                </div>

                <!-- File List (Hidden Initially) -->
                <div id="file-list" style="width: 100%; height: 100%; padding: 20px; overflow-y: auto; display: none;">
                    <!-- Items injected via JS -->
                </div>

            </div>

        </div>

        <!-- Right: Settings -->
        <aside class="controls-panel" style="width: 300px; background: #fff;">

            <div class="panel-section">
                <label class="panel-label">Compression Quality</label>
                <input type="range" id="quality-slider" min="10" max="100" value="75" style="width: 100%;">
                <div
                    style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; margin-top: 5px;">
                    <span>Small Size</span>
                    <span id="quality-val" style="font-weight: bold; color: var(--brand-blue);">75%</span>
                    <span>Best Quality</span>
                </div>
            </div>

            <div class="panel-section">
                <label class="panel-label">Output Format</label>
                <select class="form-control" id="format-select">
                    <option value="original">Keep Original</option>
                    <option value="image/jpeg">JPEG (Better Compression)</option>
                    <option value="image/webp">WEBP (Best for Web)</option>
                    <option value="image/png">PNG (Lossless-ish)</option>
                </select>
            </div>

            <div class="action-bar" style="flex-direction: column; margin-top: auto;">
                <div id="stats-summary"
                    style="text-align: center; margin-bottom: 15px; font-size: 0.9rem; color: #666;">
                    Total Saved: <span id="total-saved" style="color: #27ae60; font-weight: bold;">0%</span>
                </div>
                <button class="btn-primary" id="process-btn">Compress & Download</button>
                <button class="btn-secondary" onclick="location.reload()"
                    style="background: transparent; margin-top: 10px;">Clear All</button>
            </div>

            <!-- More Tools Sidebar -->
            <?php get_template_part('sidebar-tools'); ?>

        </aside>

    </div>

</div>

<!-- Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<!-- Logic Script -->
<script src="<?php echo $assets_url; ?>/script.js?v=<?php echo time(); ?>"></script>

<?php get_footer(); ?>