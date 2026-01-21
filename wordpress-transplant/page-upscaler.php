<?php
/*
 * Template Name: Upscaler Dashboard
 * Description: A custom page template for the AI Upscaler Dashboard.
 */

// Basic security check
if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

get_header(); 
?>

<!-- 
  NOTE: In a production WordPress environment, you should enqueue these styles and scripts 
  in your functions.php using wp_enqueue_style() and wp_enqueue_script().
  For simplicity of this drop-in template, we specific relative paths assuming 
  files are in the same directory or properly referenced.
-->

<!-- Load Styles -->
<link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/wordpress-transplant/upscale-style.css">

<style>
    /* Ensure the dashboard consumes full available height minus header if possible */
    .site-content {
        padding: 0 !important;
        margin: 0 !important;
    }
</style>

<div class="upscale-dashboard-wrapper">
    <aside class="sidebar">
        <h1 class="title">AI Image Upscaler</h1>
        <p class="subtitle">Enhance your images instantly</p>

        <div class="controls">
            <input
                type="file"
                id="file-upload"
                accept="image/*"
                multiple
                class="file-input"
            />
            <label for="file-upload" class="file-label">
                + Add Images
            </label>
            
            <!-- File List Container -->
            <div class="file-list">
                <!-- JS will populate this -->
            </div>

            <!-- TABS -->
            <div class="sidebar-tabs" style="display: flex; gap: 0.5rem; margin-top: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                <button id="tab-btn-upscale" class="tab-button active" style="flex:1; background:none; border:none; border-bottom: 2px solid var(--primary); font-weight:600; cursor:pointer; padding: 0.5rem; color: var(--text-main);">
                    Upscale
                </button>
                <button id="tab-btn-resize" class="tab-button" style="flex:1; background:none; border:none; border-bottom: 2px solid transparent; font-weight:500; cursor:pointer; padding: 0.5rem; color: var(--text-muted);">
                    Resize
                </button>
                <button id="tab-btn-crop" class="tab-button" style="flex:1; background:none; border:none; border-bottom: 2px solid transparent; font-weight:500; cursor:pointer; padding: 0.5rem; color: var(--text-muted);">
                    Crop
                </button>
            </div>

            <!-- TAB CONTENT: UPSCALE -->
            <div id="tab-content-upscale" class="tab-content" style="padding-top: 1rem;">
                <div class="action-buttons">
                    <button 
                        id="btn-upscale-active" 
                        class="primary-button"
                        disabled
                    >
                        Upscale Current
                    </button>
                    
                    <button 
                        id="btn-upscale-all" 
                        class="secondary-button"
                        style="display: none; margin-top: 0.5rem;"
                    >
                        Upscale All Pending
                    </button>
                </div>
                <div id="error-container"></div>
            </div>

            <!-- TAB CONTENT: RESIZE -->
            <div id="tab-content-resize" class="tab-content" style="display: none; padding-top: 1rem;">
                 <h3 style="font-size: 0.9rem; margin: 0 0 0.5rem 0; color: var(--text-muted);">Dimensions</h3>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div style="flex:1;">
                        <label style="font-size: 0.8rem; color: var(--text-muted);">Width</label>
                        <input type="number" id="resize-width" placeholder="Width" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px;">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size: 0.8rem; color: var(--text-muted);">Height</label>
                        <input type="number" id="resize-height" placeholder="Height" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 6px;">
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="resize-aspect" checked> Maintain Aspect Ratio
                    </label>
                </div>
                <button id="btn-resize-now" class="secondary-button" style="width: 100%; padding: 0.75rem; background: #fff; border: 1px solid var(--primary); color: var(--primary); border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Resize Active Image
                </button>
                
                 <button 
                    id="btn-resize-all" 
                    class="secondary-button"
                    style="display: none; margin-top: 0.5rem; width: 100%; padding: 0.75rem; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;"
                >
                    Resize All Pending
                </button>
            </div>

            <!-- TAB CONTENT: CROP -->
            <div id="tab-content-crop" class="tab-content" style="display: none; padding-top: 1rem;">
                <h3 style="font-size: 0.9rem; margin: 0 0 0.5rem 0; color: var(--text-muted);">Aspect Ratio</h3>
                <div class="aspect-controls" style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem; margin-bottom: 1rem;">
                    <button class="aspect-btn active" data-ratio="free" style="padding:0.5rem; border:1px solid var(--border-color); background:none; border-radius:4px; cursor:pointer; color: var(--text-main);">Free</button>
                    <button class="aspect-btn" data-ratio="1" style="padding:0.5rem; border:1px solid var(--border-color); background:none; border-radius:4px; cursor:pointer; color: var(--text-main);">1:1 (Square)</button>
                    <button class="aspect-btn" data-ratio="1.333333" style="padding:0.5rem; border:1px solid var(--border-color); background:none; border-radius:4px; cursor:pointer; color: var(--text-main);">4:3</button>
                    <button class="aspect-btn" data-ratio="1.777777" style="padding:0.5rem; border:1px solid var(--border-color); background:none; border-radius:4px; cursor:pointer; color: var(--text-main);">16:9</button>
                </div>

                <button id="btn-crop-now" class="secondary-button" style="width: 100%; padding: 0.75rem; background: #fff; border: 1px solid var(--primary); color: var(--primary); border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Crop Active Image
                </button>
            </div>
        </div>
    </aside>

    <main class="main-content">
        <!-- JS will populate this -->
         <div class="image-comparison">
            <div class="image-panel">
                <div class="panel-header">Original</div>
                <div class="image-wrapper">
                    <div class="placeholder">Select an image from the list</div>
                </div>
            </div>

            <div class="image-panel">
                <div class="panel-header">Upscaled</div>
                <div class="image-wrapper">
                    <div class="placeholder">Result will appear here</div>
                </div>
            </div>
        </div>
    </main>
</div>

<!-- Load Script -->
<script src="<?php echo get_stylesheet_directory_uri(); ?>/wordpress-transplant/upscale-script.js"></script>

<?php 
// Optional: Don't show footer to keep app-like feel, or keep it.
get_footer(); 
?>
