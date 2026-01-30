<?php
/*
 * Template Name: Image Upscaler Tool
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

// Asset URL
$assets_url = get_stylesheet_directory_uri() . '/image-upscaler';
?>

<!-- Load Local CSS -->
<link rel="stylesheet" href="<?php echo $assets_url; ?>/style.css?ver=<?php echo filemtime(__DIR__ . '/style.css'); ?>">
<!-- Google Fonts (Already loaded in main theme mostly, but ensuring Outfit) -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<div class="upscaler-app">

    <header class="upscaler-header">
        <!-- <a href="/" class="site-logo-link">
            <img src="<?php echo get_stylesheet_directory_uri(); ?>/image-upscaler/logo.png?v=<?php echo time(); ?>"
                alt="UpscaleIMG" class="upscaler-logo"
                style="display: block; margin: 0 auto 1.5rem auto; max-width: 300px; height: auto;">
        </a> -->
        <h1 class="upscaler-title">Image Upscaler</h1>
        <p class="upscaler-subtitle">Easily upscale your images.</p>
    </header>

    <div class="upscale-dashboard-wrapper">
        <aside class="sidebar">
            <!-- Sidebar Title Removed (Already in Header) -->
            <!-- <h2 class="title" style="margin-top: 0;">AI Image Upscaler</h2>
            <p class="subtitle">Enhance your images instantly</p> -->

            <div class="controls">
                <input type="file" id="file-upload" accept="image/*" multiple class="file-input" />
                <label for="file-upload" class="file-label">
                    + Add Images<br>
                    <span style="font-size: 0.9rem; font-weight: 400; display: block; margin-top: 5px;">or Drag & Drop
                        here</span>
                </label>

                <p class="upload-limits">
                    Up to 20 file(s) (Max size 10MB each).<br>
                    Supported: JPG, JPEG, PNG, GIF, JFIF, WEBP, BMP, ICO, SVG, AVIF.
                </p>

                <!-- File List Container -->
                <div class="file-list-header"
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; padding: 0 5px;">
                    <label
                        style="font-size: 0.85rem; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center;">
                        <input type="checkbox" id="select-all-files" style="margin-right: 8px;"> Select All
                    </label>
                </div>

                <div class="file-list">
                    <!-- JS will populate this -->
                </div>

                <!-- Bulk Actions (Hidden by default) -->
                <div class="bulk-actions" id="bulk-actions-container">
                    <!-- Transfer Button Removed per user request -->
                    <button id="btn-download-zip" class="bulk-btn zip-btn">
                        <span>⬇</span> Download ZIP
                    </button>
                </div>

                <!-- TAB CONTENT: UPSCALE -->
                <div id="tab-content-upscale" class="tab-content" style="padding-top: 1rem;">
                    <div class="action-buttons">
                        <button id="btn-upscale-active" class="primary-button" disabled>
                            Upscale Current
                        </button>

                        <button id="btn-upscale-all" class="secondary-button"
                            style="display: none; margin-top: 0.5rem;">
                            Upscale All Pending
                        </button>
                    </div>
                    <div id="error-container"></div>
                </div>

            </div>
            <!-- More Tools Sidebar -->
            <?php get_template_part('sidebar-tools'); ?>
        </aside>

        <main class="main-content">
            <!-- JS will populate this -->
            <div class="single-image-view">
                <div class="placeholder">Select an image from the list<br><span
                        style="font-size: 0.9em; opacity: 0.7;">or Drag & Drop here</span></div>
            </div>
        </main>
    </div>

    <!-- Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <!-- Logic Script -->
    <script src="<?php echo get_stylesheet_directory_uri(); ?>/transfer-manager.js?v=<?php echo time(); ?>"></script>
    <script src="<?php echo $assets_url; ?>/script.js?v=<?php echo time(); ?>"></script>

    <?php
    get_footer();
    ?>