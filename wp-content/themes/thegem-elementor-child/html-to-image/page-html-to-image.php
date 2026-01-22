<?php
/*
 * Template Name: HTML to Image Tool
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

// Asset URL
$assets_url = get_stylesheet_directory_uri() . '/html-to-image';
?>

<!-- Load Local CSS -->
<link rel="stylesheet" href="<?php echo $assets_url; ?>/style.css?v=<?php echo time(); ?>">
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<div class="resizer-app">

    <!-- Header -->
    <header class="resizer-header">
        <h1 class="resizer-title">HTML to Image</h1>
        <p class="resizer-subtitle">Convert webpages to high-quality images instantly.</p>
    </header>

    <!-- App Workspace -->
    <div class="resizer-workspace"
        style="max-width: 1000px; margin: 0 auto; min-height: 500px; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">

        <!-- Main Area: Preview/Input -->
        <div class="workspace-main"
            style="flex: 2; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column;">

            <div id="input-zone"
                style="flex: 1; min-height: 300px; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">

                <h2 style="font-size: 1.5rem; margin-bottom: 2rem; color:#333;">Enter URL to Convert</h2>

                <div class="url-input-container">
                    <input type="url" id="url-input" class="url-input" placeholder="https://example.com" required>
                    <button id="convert-btn" class="btn-primary"
                        style="border-radius: 50px; font-size: 1.1rem; padding: 16px;">Convert to Image</button>
                    <p id="error-msg" style="color: red; margin-top: 1rem; display: none;"></p>
                </div>

            </div>

            <div id="preview-area"
                style="flex: 1; background: #f0f0f0; display: none; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; padding: 20px; position: relative;">
                <img id="result-image" src="" alt="Result"
                    style="max-width: 100%; max-height: 100%; display: block; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
                <button onclick="resetApp()"
                    style="position: absolute; top: 10px; right: 10px; background: #fff; border: 1px solid #ccc; padding: 5px 10px; cursor: pointer; border-radius: 4px;">✕
                    Close</button>
            </div>

        </div>

        <!-- Right: Settings -->
        <aside class="controls-panel" style="width: 300px; background: #fff;">



            <div class="panel-section">
                <label class="panel-label">Viewport Width</label>
                <select class="form-control" id="width-select">
                    <option value="1920">1920px (Desktop)</option>
                    <option value="1366">1366px (Laptop)</option>
                    <option value="768">768px (Tablet)</option>
                    <option value="375">375px (Mobile)</option>
                </select>
            </div>

            <div class="panel-section">
                <label class="panel-label">Option</label>
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="full-page" checked>
                    <span style="font-size: 0.95rem; color: #555;">Full Page Screenshot</span>
                </label>
            </div>

            <div class="action-bar" style="flex-direction: column; margin-top: auto;">
                <button class="btn-primary" id="download-btn" disabled>Download Image</button>
            </div>

        </aside>

    </div>

</div>

<!-- Logic Script -->
<script src="<?php echo $assets_url; ?>/script.js?v=<?php echo time(); ?>"></script>

<?php get_footer(); ?>