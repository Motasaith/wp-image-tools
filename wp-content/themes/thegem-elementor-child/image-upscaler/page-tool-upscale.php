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

    <header class="upscaler-header" style="position: relative;">
        <!-- <a href="/" class="site-logo-link">
            <img src="<?php echo get_stylesheet_directory_uri(); ?>/image-upscaler/logo.png?v=<?php echo time(); ?>"
                alt="UpscaleIMG" class="upscaler-logo"
                style="display: block; margin: 0 auto 1.5rem auto; max-width: 300px; height: auto;">
        </a> -->
        <h1 class="upscaler-title">Image Upscaler</h1>
        <p class="upscaler-subtitle">Easily upscale your images.</p>

        <?php if (!is_user_logged_in()): ?>
            <a href="/my-account" class="primary-button upscaler-login-btn">
                Login for Bulk Upload
            </a>
        <?php endif; ?>
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
                    (Max size 10MB each).<br>
                    Supported: JPG, JPEG, PNG, GIF, JFIF, WEBP, BMP, ICO, SVG, AVIF.
                </p>

                <!-- File List Container -->
                <div class="file-list-header"
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; padding: 0 5px;">
                    <!-- Select All Removed -->
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

        <main class="main-content" style="display: flex; flex-direction: column;">
            <!-- Guest Notice (Persists) -->
            <?php if (!is_user_logged_in()): ?>
                <div class="upscaler-guest-notice"
                    style="width: 100%; max-width: 800px; margin: 0 auto 1rem auto; padding: 10px; background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; border-radius: 8px; text-align: center;">
                    <strong>Note:</strong> Guests are limited to 5 upscales every 10 minutes. <a href="/my-account"
                        style="color: #533f03; text-decoration: underline; font-weight: bold;">Login here</a> for higher
                    limits.
                </div>
            <?php endif; ?>

            <!-- App Root (JS targets this) -->
            <div id="upscale-app-root" style="flex: 1; display: flex; flex-direction: column;">
                <!-- Initial State (Replaced by JS immediately) -->
                <div class="row">
                    <div class="col-12" style="max-width: 800px; margin: 0 auto;">
                        <div class="upscale-upload-box">Select an image from the list<br><span
                                style="font-size: 0.9em; opacity: 0.7;">or Drag & Drop here</span></div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <!-- Dynamic Settings (Nonce for Authentication & User Status) -->
    <script>
        const upscalerSettings = {
            nonce: "<?php echo wp_create_nonce('wp_rest'); ?>",
            isLoggedIn: <?php echo is_user_logged_in() ? 'true' : 'false'; ?>,
            uploadLimit: <?php echo upscaleimg_get_user_upload_limit(); ?>
        };
    </script>

    <!-- Login Prompt Modal -->
    <div id="login-prompt-modal" class="upscaler-modal" style="display: none;">
        <div class="upscaler-modal-overlay"></div>
        <div class="upscaler-modal-content">
            <button class="modal-close-btn" id="modal-close-btn">×</button>
            <div class="modal-icon">🔒</div>
            <h3 class="modal-title">Multiple Image Upload</h3>
            <p class="modal-desc">Guest users can only upload 1 image at a time. Please login to upload multiple images.
            </p>
            <a href="/my-account" class="modal-cta-btn">Login / Create Account</a>
        </div>
    </div>

    <!-- Navigation Warning Modal -->
    <div id="nav-warning-modal" class="upscaler-modal" style="display: none;">
        <div class="upscaler-modal-overlay"></div>
        <div class="upscaler-modal-content">
            <div class="modal-icon">⚠️</div>
            <h3 class="modal-title">Unsaved Changes</h3>
            <p class="modal-desc">
                Only the currently selected image will be transferred to the new tool.<br><br>
                Any other images or unsaved changes will be lost.<br>
                Do you want to proceed?
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
                <button id="nav-cancel-btn" class="secondary-button"
                    style="border: 2px solid white; color: white; background: transparent;">Cancel</button>
                <button id="nav-proceed-btn" class="modal-cta-btn">Proceed</button>
            </div>
        </div>
    </div>

    <!-- Logic Script -->
    <script src="<?php echo get_stylesheet_directory_uri(); ?>/transfer-manager.js?v=<?php echo time(); ?>"></script>
    <script src="<?php echo $assets_url; ?>/script.js?v=<?php echo time(); ?>"></script>

    <?php
    get_footer();
    ?>