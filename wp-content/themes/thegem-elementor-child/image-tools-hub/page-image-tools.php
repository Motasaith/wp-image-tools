<?php
/*
 * Template Name: Image Tools Hub
 * Description: A full features landing page for image tools.
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

// Get the URL of the current directory (image-tools-hub)
$hub_url = get_stylesheet_directory_uri() . '/image-tools-hub';
?>

<!-- Force load CSS for this section -->
<link rel="stylesheet"
    href="<?php echo $hub_url; ?>/hub-style.css?ver=<?php echo filemtime(__DIR__ . '/hub-style.css'); ?>">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

<div class="image-hub-wrapper" style="min-height: auto; background: transparent;">

    <!-- Hero Section -->
    <section class="hub-hero">
        <div class="hub-container">
            <h1 class="hero-title">Every tool you could want to edit images</h1>
            <p class="hero-subtitle">
                Your online photo editor is here and forever free!
            </p>

            <!-- Category Filter Pills -->
            <div class="filter-pills">
                <span class="pill active" onclick="filterTools('all', this)">All</span>
                <span class="pill" onclick="filterTools('optimize', this)">Optimize</span>
                <span class="pill" onclick="filterTools('create', this)">Create</span>
                <span class="pill" onclick="filterTools('edit', this)">Edit</span>
                <span class="pill" onclick="filterTools('convert', this)">Convert</span>
            </div>
        </div>
    </section>

    <!-- Tools Grid -->
    <section class="tools-grid-section">
        <div class="hub-container">
            <div class="tools-grid">

                <!-- 1. Compress IMAGE -->
                <a href="/free-image-compressor-tool-online" class="tool-card" data-category="optimize">
                    <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/compress_img.svg" alt="Compress Image"
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Compress IMAGE</h3>
                    </div>
                    <p class="card-desc">Compress JPG, PNG, SVG, and GIFs while saving space.</p>
                    <span class="tool-btn">Compress</span>
                </a>

                <!-- 2. Resize IMAGE -->
                <a href="/free-image-resizer-tool-online" class="tool-card" data-category="edit">
                    <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/resize_img.svg" alt="Resize IMAGE"
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Resize IMAGE</h3>
                    </div>
                    <p class="card-desc">Define your dimensions, by percent or pixel.</p>
                    <span class="tool-btn">Resize</span>
                </a>

                <!-- 3. Crop IMAGE -->
                <a href="/free-image-cropper-tool-online" class="tool-card" data-category="edit">
                    <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/crop_img.svg" alt="Crop IMAGE"
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Crop IMAGE</h3>
                    </div>
                    <p class="card-desc">Crop JPG, PNG, or GIFs with ease; Choose pixels.</p>
                    <span class="tool-btn">Crop</span>
                </a>

                <!-- 4. Conversion -->
                <a href="/free-image-conversion-tool-online" class="tool-card" data-category="convert">
                    <div class="card-header">
                        <div class="brand-icon">
                            <!-- Using Convert to JPG icon as the main icon for now, or a generic one if available -->
                            <img src="<?php echo $hub_url; ?>/SVG/convert_to_jpg.svg" alt="Conversion"
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Conversion</h3>
                    </div>
                    <p class="card-desc">Convert your images to and from various formats (JPG, PNG, PDF, etc).</p>
                    <span class="tool-btn">Convert</span>
                </a>

                <!-- 6. Photo editor -->
                <!-- <a href="/free-photo-editor-tool-online" class="tool-card" data-category="edit">
                    <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/photo_editor.svg" alt="Photo editor"
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Photo editor</h3>
                    </div>
                    <p class="card-desc">Spice up your pictures with text, effects, and frames.</p>
                    <span class="tool-btn">Edit</span>
                </a> -->

                <!-- 7. Upscale Image -->
                <a href="/free-image-upscaler-tool-online" class="tool-card" data-category="optimize">
                    <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/upscale_img.svg" alt="Upscale Image"
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Upscale Image</h3>
                        <!-- <span class="badge-new">New!</span> -->
                    </div>
                    <p class="card-desc">Enlarge your images with high resolution AI.</p>
                    <span class="tool-btn">Upscale</span>
                </a>

                <!-- 8. Remove background -->
                <a href="/remove-image-background" class="tool-card" data-category="edit">
                    <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/remove_background.svg" alt="Remove background"
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Remove background</h3>
                        <!-- <span class="badge-new">New!</span> -->
                    </div>
                    <p class="card-desc">Quickly remove image backgrounds with high accuracy.</p>
                    <span class="tool-btn">Remove</span>
                </a>

                <!-- 9. Watermark IMAGE -->
                <!-- <a href="#" class="tool-card" data-category="edit">
                     <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/watermark_img.svg" alt="Watermark IMAGE" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Watermark IMAGE</h3>
                     </div>
                    <p class="card-desc">Stamp an image or text over your images in seconds.</p>
                     <span class="tool-btn">Watermark</span>
                </a> -->

                <!-- 10. Remove Watermark -->
                <!-- <a href="#" class="tool-card" data-category="edit">
                     <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/remove_watermark.svg" alt="Remove Watermark" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Remove Watermark</h3>
                     </div>
                    <p class="card-desc">Erase watermarks, logos, and text from images using AI.</p>
                     <span class="tool-btn">Clean</span>
                </a> -->


                <!-- 11. Meme generator -->
                <a href="/free-meme-generator-tool-online" class="tool-card" data-category="create">
                    <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/meme_generator.svg" alt="Meme generator"
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Meme Generator</h3>
                    </div>
                    <p class="card-desc">Create funny memes instantly. Choose a template or upload your own.</p>
                    <span class="tool-btn">Create</span>
                </a>

                <!-- 12. Rotate IMAGE -->
                <!-- <a href="#" class="tool-card" data-category="edit">
                     <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/rotate_img.svg" alt="Rotate IMAGE" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">Rotate IMAGE</h3>
                     </div>
                    <p class="card-desc">Rotate many images JPG or PNGs at the same time.</p>
                     <span class="tool-btn">Rotate</span>
                </a> -->

                <!-- 13. HTML to IMAGE -->
                <a href="/free-html-to-image-tool-online" class="tool-card" data-category="convert">
                    <div class="card-header">
                        <div class="brand-icon">
                            <img src="<?php echo $hub_url; ?>/SVG/html_to_img.svg" alt="HTML to IMAGE"
                                style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <h3 class="card-title">HTML to IMAGE</h3>
                    </div>
                    <p class="card-desc">Convert webpages to high-quality images.</p>
                    <span class="tool-btn">Convert</span>
                </a>

                <!-- 14. Image Sharpen -->
                <a href="/free-image-sharpen-tool-online" class="tool-card" data-category="edit">
                    <div class="card-header">
                        <div class="brand-icon">
                            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#007bff"
                                stroke-width="2" style="display:block; margin:auto;">
                                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                <polyline points="2 17 12 22 22 17"></polyline>
                                <polyline points="2 12 12 17 22 12"></polyline>
                            </svg>
                        </div>
                        <h3 class="card-title">Image Sharpen</h3>
                    </div>
                    <p class="card-desc">Enhance photo details and clarity instantly.</p>
                    <span class="tool-btn">Sharpen</span>
                </a>

                <!-- 14. Blur face -->
                <!-- <a href="#" class="tool-card" data-category="edit">
                     <div class="card-header">
                          <div class="brand-icon">
                             <img src="<?php echo $hub_url; ?>/SVG/blur_face.svg" alt="Blur face" style="width: 100%; height: 100%; object-fit: contain;">
                          </div>
                         <h3 class="card-title">Blur face</h3>
                         <span class="badge-new">New!</span>
                     </div>
                    <p class="card-desc">Easily blur out faces in photos.</p>
                     <span class="tool-btn">Blur</span>
                </a> -->

            </div>
        </div>
    </section>

    <!-- Comparison Section (Inline) -->
    <style>
        .comparison-section {
            padding: 5rem 0;
            background: #fff;
        }

        .comp-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1.5rem;
        }

        .comp-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }

        .comp-card {
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
            border: 1px solid #eee;
            transition: transform 0.3s ease;
        }

        .comp-card:hover {
            transform: translateY(-5px);
        }

        .comp-visual {
            position: relative;
            height: 300px;
            overflow: hidden;
            cursor: ew-resize;
            /* East-West resize cursor */
            user-select: none;
        }

        .comp-img-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
        }

        /* RIGHT SIDE (Base Layer) -> Processed/After */
        /* This is always visible, but covered by the Left layer */
        .comp-right-processed {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
        }

        /* LEFT SIDE (Top Layer) -> Original/Before */
        /* This width changes with slider. Overflow hidden clips it. */
        .comp-left-original {
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            /* Starts at mid */
            height: 100%;
            overflow: hidden;
            z-index: 2;
            border-right: 2px solid #fff;
            background: #fff;
            /* Fallback */
        }

        /* The Image INSIDE the Left Layer */
        /* CRITICAL: Must be width of PARENT CONTAINER to look "Fixed" */
        .comp-img-fixed {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: auto;
            /* Calculated by JS */
            max-width: none;
            object-fit: cover;
        }

        .comp-slider-handle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: #fff;
            border-radius: 50%;
            z-index: 3;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            pointer-events: none;
            color: #333;
        }

        .comp-slider-handle::after {
            content: '↔';
            font-weight: bold;
        }

        .comp-content {
            padding: 1.5rem;
        }

        .comp-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0 0 0.5rem 0;
            color: #1a1a1a;
        }

        .comp-desc {
            font-size: 0.95rem;
            color: #666;
            line-height: 1.5;
            margin: 0;
        }

        /* Labels */
        .img-label {
            position: absolute;
            top: 1rem;
            background: rgba(0, 0, 0, 0.6);
            color: #fff;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            pointer-events: none;
            z-index: 4;
        }

        .label-left {
            left: 1rem;
        }

        /* Original */
        .label-right {
            right: 1rem;
        }

        /* Processed */
    </style>

    <section class="comparison-section">
        <div class="comp-container">
            <div class="comp-title-area text-center mb-5">
                <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; color: #1a1a1a;">See the magic in
                    action</h2>
                <p style="color: #666; max-width: 600px; margin: 0 auto 3rem auto;">Transform your images instantly with
                    our AI-powered tools.</p>
            </div>

            <div class="comp-grid">

                <!-- Card 1: Remove Background (Using New Images) -->
                <div class="comp-card">
                    <div class="comp-visual" onmousemove="updateSlider(event, this)"
                        ontouchmove="updateSlider(event, this)">

                        <!-- Base: Processed (Right) -->
                        <!-- We use the user uploaded processed image here -->
                        <img src="<?php echo get_stylesheet_directory_uri(); ?>/image-tools-hub/images/rem-bg-processed.png"
                            class="comp-right-processed" alt="Removed BG">

                        <!-- Top: Original (Left) -->
                        <div class="comp-left-original">
                            <!-- We use the user uploaded original image here -->
                            <img src="<?php echo get_stylesheet_directory_uri(); ?>/image-tools-hub/images/rem-bg-original.png"
                                class="comp-img-fixed" alt="Original">
                        </div>

                        <div class="comp-slider-handle"></div>
                        <span class="img-label label-left">Original</span>
                        <span class="img-label label-right">Removed BG</span>
                    </div>
                    <div class="comp-content">
                        <h3 class="comp-title">Remove Background</h3>
                        <p class="comp-desc">Create professional product photos with clean backgrounds for online
                            stores.</p>
                    </div>
                </div>

                <!-- Card 2: Face Enhancer -->
                <div class="comp-card">
                    <div class="comp-visual" onmousemove="updateSlider(event, this)"
                        ontouchmove="updateSlider(event, this)">
                        <!-- Base: Enhanced -->
                        <img src="<?php echo get_stylesheet_directory_uri(); ?>/image-tools-hub/images/faceenhancer_processed.jpeg"
                            class="comp-right-processed" alt="Enhanced">

                        <!-- Top: Original/Blurry -->
                        <div class="comp-left-original">
                            <img src="<?php echo get_stylesheet_directory_uri(); ?>/image-tools-hub/images/faceenhancer_original.jpg"
                                class="comp-img-fixed" alt="Blurry">
                        </div>

                        <div class="comp-slider-handle"></div>
                        <span class="img-label label-left">Blurry</span>
                        <span class="img-label label-right">Enhanced</span>
                    </div>
                    <div class="comp-content">
                        <h3 class="comp-title">Face Enhancer</h3>
                        <p class="comp-desc">Sharpen details and enhance faces perfectly with our <a href="#">face
                                enhancer</a>.</p>
                    </div>
                </div>

                <!-- Card 3: Image Upscaler -->
                <div class="comp-card">
                    <div class="comp-visual" onmousemove="updateSlider(event, this)"
                        ontouchmove="updateSlider(event, this)">
                        <!-- Base: Upscaled -->
                        <img src="<?php echo get_stylesheet_directory_uri(); ?>/image-tools-hub/images/upscaler_processed.png"
                            class="comp-right-processed" alt="Upscaled">

                        <!-- Top: Low Res -->
                        <div class="comp-left-original">
                            <img src="<?php echo get_stylesheet_directory_uri(); ?>/image-tools-hub/images/upscaler_original.png"
                                class="comp-img-fixed" alt="Low Res">
                        </div>

                        <div class="comp-slider-handle"></div>
                        <span class="img-label label-left">Low Res</span>
                        <span class="img-label label-right">Upscaled 4x</span>
                    </div>
                    <div class="comp-content">
                        <h3 class="comp-title">Image Upscaler</h3>
                        <p class="comp-desc">Upscale low-res images to 4k ready for print and marketing.</p>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <script>
        function updateSlider(e, container) {
            // Handle Mouse or Touch events
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;

            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            let percentage = (x / rect.width) * 100;

            // Clamp 0-100
            if (percentage < 0) percentage = 0;
            if (percentage > 100) percentage = 100;

            // Update the Top Layer (Original) width
            const overlay = container.querySelector('.comp-left-original');
            overlay.style.width = percentage + '%';

            // Move Handle
            const handle = container.querySelector('.comp-slider-handle');
            handle.style.left = percentage + '%';
        }

        // JS Logic to keep the inner "Fixed" Image width = Container Width
        // This creates the "reveal" effect instead of "squish" effect
        function fixImageWidths() {
            document.querySelectorAll('.comp-visual').forEach(visual => {
                const rect = visual.getBoundingClientRect();
                const widthPx = rect.width + 'px';

                // Set the width of the inner image of the top layer to match the full container
                const fixedImg = visual.querySelector('.comp-left-original .comp-img-fixed');
                if (fixedImg) fixedImg.style.width = widthPx;
            });
        }

        // Run on load and resize
        window.addEventListener('load', fixImageWidths);
        window.addEventListener('resize', fixImageWidths);
        // Also run immediately in case DOM is ready
        fixImageWidths();
    </script>

    <!-- Filter Script -->
    <script>
        function filterTools(category, element) {
            // 1. Update Filters
            const pills = document.querySelectorAll('.pill');
            pills.forEach(pill => pill.classList.remove('active'));
            element.classList.add('active');

            // 2. Filter Cards
            const cards = document.querySelector('.tools-grid').querySelectorAll('.tool-card'); // Scope to .tools-grid to avoid conflicts if any
            cards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'flex'; // Restore display
                } else {
                    card.style.display = 'none';
                }
            });
        }
    </script>

</div>

<!-- Elementor Content Section -->
<div class="elementor-content-area">
    <?php
    while (have_posts()):
        the_post();
        the_content();
    endwhile;
    ?>
</div>

<?php
get_footer();
?>