<?php
/*
 * Template Name: Image Cropper Tool
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header(); 

// Asset URL
$assets_url = get_stylesheet_directory_uri() . '/image-cropper';
?>

<!-- Load Local CSS -->
<link rel="stylesheet" href="<?php echo $assets_url; ?>/style.css?v=<?php echo time(); ?>">
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<div class="resizer-app">
    
    <!-- Header -->
    <header class="resizer-header">
        <a href="/" class="site-logo-link">
            <!-- Reuse Resizer Logo logic -->
            <img src="<?php echo get_theme_file_uri('/image-resizer/logo.png'); ?>" alt="UpscaleIMG" class="resizer-logo" style="display: block; margin: 0 auto 1.5rem auto; max-width: 300px; height: auto;">
        </a>
        <h1 class="resizer-title">Free Image Cropper</h1>
        <p class="resizer-subtitle">Crop your images to the perfect size and aspect ratio.</p>
    </header>

    <!-- App Workspace -->
    <div class="resizer-workspace">
        
        <!-- Left: Canvas / Visualizer -->
        <div class="workspace-left">
            
            <div class="canvas-container" id="drop-zone">
                
                <!-- Upload Prompt -->
                <div class="upload-overlay" id="upload-screen">
                    <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color:#333;">Drag & drop images</h2>
                    <p style="color:#666; margin-bottom: 2rem;">or browse to upload</p>
                    <button class="upload-btn" onclick="document.getElementById('file-input').click()">Upload Photos</button>
                    <!-- Allow multiple files -->
                    <input type="file" id="file-input" accept="image/*" multiple style="display: none;" onchange="handleFileSelect(this)">
                </div>

                <!-- Editor Wrapper -->
                <div class="resizable-box" id="editor-box" style="display: none; background: transparent;">
                    
                    <!-- The Background Image (Not Cropped, Full Size Visual) -->
                    <img id="target-image" src="" alt="To Crop" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">
                    
                    <!-- Crop Overlay (The Box user drags) -->
                    <div id="crop-overlay" style="position: absolute; border: 2px dashed #fff; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5); cursor: move;">
                        <!-- Grid Lines -->
                        <div class="crop-grid"></div>
                        
                        <!-- Handles -->
                        <div class="resize-handle handle-tl" data-handle="tl"></div>
                        <div class="resize-handle handle-tr" data-handle="tr"></div>
                        <div class="resize-handle handle-bl" data-handle="bl"></div>
                        <div class="resize-handle handle-br" data-handle="br"></div>
                    </div>

                </div>

            </div>
            
            <!-- File Queue Strip -->
            <div class="file-queue-strip" id="file-queue" style="display: none;"></div>

        </div>

        <!-- Right: Controls -->
        <aside class="controls-panel">
            
            <div class="panel-section">
                <label class="panel-label">Aspect Ratio</label>
                <select class="form-control" id="ratio-select">
                    <option value="free">Free</option>
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="4:3">Standard (4:3)</option>
                    <option value="9:16">Story (9:16)</option>
                    <option value="3:4">Portrait (3:4)</option>
                </select>
            </div>

            <div class="action-bar" style="flex-direction: column;">
                <button class="btn-primary" id="download-btn">Crop & Download</button>
                <button class="btn-secondary" onclick="location.reload()" style="background: transparent; text-decoration: underline;">Start Over</button>
            </div>

        </aside>

    </div>

</div>

</div>

<!-- Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<!-- Logic Script -->
<script src="<?php echo $assets_url; ?>/script.js?v=<?php echo time(); ?>"></script>

<?php get_footer(); ?>
