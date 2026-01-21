<?php
/*
 * Template Name: Image Converter Tool
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header(); 

// Asset URL
$assets_url = get_stylesheet_directory_uri() . '/image-converter';
?>

<!-- Load Local CSS -->
<link rel="stylesheet" href="<?php echo $assets_url; ?>/style.css?v=<?php echo time(); ?>">
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<div class="resizer-app">
    
    <!-- Header -->
    <header class="resizer-header">
        <a href="/" class="site-logo-link">
            <img src="<?php echo get_theme_file_uri('/image-resizer/logo.png'); ?>" alt="UpscaleIMG" class="resizer-logo" style="display: block; margin: 0 auto 1.5rem auto; max-width: 300px; height: auto;">
        </a>
        <h1 class="resizer-title">Free Image Converter</h1>
        <p class="resizer-subtitle">Convert images to JPEG, PNG, or WEBP in seconds.</p>
    </header>

    <!-- App Workspace -->
    <div class="resizer-workspace" style="max-width: 1000px; margin: 0 auto; height: auto; min-height: 500px; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
        
        <!-- Main Area: Queue & Stats -->
        <div class="workspace-main" style="flex: 2; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column;">
            
            <!-- Area to Drag & Drop -->
            <div id="drop-zone" style="flex: 1; min-height: 300px; background: #f9f9f9; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
                
                <!-- Initial Upload Screen -->
                <div class="upload-overlay" id="upload-screen">
                    <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color:#333;">Convert Images</h2>
                    <p style="color:#666; margin-bottom: 2rem;">Drag & drop or browse (Max 20 files)</p>
                    <button class="upload-btn" onclick="document.getElementById('file-input').click()">Select Images</button>
                    <input type="file" id="file-input" accept="image/*" multiple style="display: none;" onchange="handleFileSelect(this)">
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
                <label class="panel-label">Convert to</label>
                <select class="form-control" id="format-select">
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WEBP</option>
                </select>
                <p style="font-size: 0.8rem; color: #888; margin-top: 8px; line-height: 1.4;">
                   Select the target format for all images. You can also change this individually.
                </p>
            </div>
            
            <!-- Hidden Quality Slider (We set high quality by default for 'Converter', or exposes it?) -->
            <!-- Let's keep it but simplified, or maybe just hidden and hardcoded 90%? 
                 User expects 'Conversion' not 'Compression'. Let's hide it for simplicity unless requested. 
                 Or maybe just a "High Quality" checkbox? 
                 Let's stick to "Convert" defaults (Quality ~ 92%).
            -->

            <div class="action-bar" style="flex-direction: column; margin-top: auto;">
                <button class="btn-primary" id="process-btn">Convert & Download</button>
                <button class="btn-secondary" onclick="location.reload()" style="background: transparent; margin-top: 10px;">Clear All</button>
            </div>

        </aside>

    </div>

</div>

<!-- Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<!-- Logic Script -->
<script src="<?php echo $assets_url; ?>/script.js?v=<?php echo time(); ?>"></script>

<?php get_footer(); ?>
