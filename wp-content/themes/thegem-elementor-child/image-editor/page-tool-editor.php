<?php
/*
 * Template Name: Image Editor Tool
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header(); 

// Asset URL
$assets_url = get_stylesheet_directory_uri() . '/image-editor';
?>

<!-- Toast UI Image Editor CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tui-image-editor@3.15.2/dist/tui-image-editor.min.css">
<!-- Custom CSS -->
<link rel="stylesheet" href="<?php echo $assets_url; ?>/style.css?v=<?php echo time(); ?>">
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<div class="editor-app">
    
    <!-- Header -->
    <header class="editor-header">
        <a href="/" class="site-logo-link">
            <img src="<?php echo get_theme_file_uri('/image-resizer/logo.png'); ?>" alt="UpscaleIMG" class="editor-logo" style="display: block; margin: 0 auto 1.5rem auto; max-width: 300px; height: auto;">
        </a>
        <h1 class="editor-title">Free Image Editor</h1>
        <p class="editor-subtitle">Draw, crop, filter, and add stickers to your images.</p>
    </header>

    <!-- App Workspace -->
    <div class="editor-workspace">
        
        <!-- Upload Overlay (Visible Initially) -->
        <div id="upload-screen" class="upload-screen">
            <div class="upload-box">
                <h2>Open Image to Edit</h2>
                <p>Drag & drop or browse</p>
                <button class="upload-btn" onclick="document.getElementById('file-input').click()">Select Image</button>
                <input type="file" id="file-input" accept="image/*" style="display: none;" onchange="handleFileSelect(this)">
            </div>
        </div>

        <!-- Editor Container (Hidden Initially) -->
        <div id="tui-image-editor-container"></div>

    </div>

</div>

<!-- Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/4.2.0/fabric.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tui-code-snippet@1.5.0/dist/tui-code-snippet.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tui-color-picker@2.2.6/dist/tui-color-picker.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tui-image-editor@3.15.2/dist/tui-image-editor.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>

<!-- Logic Script -->
<script src="<?php echo $assets_url; ?>/script.js?v=<?php echo time(); ?>"></script>

<?php 
get_footer(); 
?>
