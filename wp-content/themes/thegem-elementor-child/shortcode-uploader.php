<?php
/**
 * Shortcode: [show-image-uploader]
 * Displays a glass-morphism style image uploader area.
 * Logic:
 *  1. Accepts file drag/drop or click.
 *  2. Saves image to TransferManager (IndexedDB).
 *  3. Redirects to /image-upscaler/ (or the defined URL).
 */

function render_external_image_uploader_shortcode($atts)
{
    // Attributes
    $a = shortcode_atts(array(
        'redirect' => '/free-image-upscaler-tool-online', // Default redirect path
        'title' => 'Upload Image to Upscale',
        'subtitle' => 'Guest uploads are limited to 1 image (10MB max). Bulk uploads are available for logged-in users based on their active plan. Supported: JPG, JPEG, PNG, GIF, JFIF, WEBP, BMP, ICO, SVG, AVIF.',
    ), $atts);

    // Enqueue TransferManager if not already loaded (Handled globally in functions.php, but keeping as fallback)
    wp_enqueue_script('transfer-manager', get_stylesheet_directory_uri() . '/transfer-manager.js', array(), '1.2', true);

    ob_start();
    $uid = uniqid('sc_up_'); // Generate Unique ID for this instance
    ?>
    <style>
        /* Shared Styles (Class-based to allow multiple instances) */
        .uploader-wrapper { width: 100%; max-width: 600px; margin: 0 auto; text-align: center; position: relative; }
        .uploader-box { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 2px dashed rgba(65, 105, 225, 0.3); border-radius: 20px; padding: 40px 20px; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: visible; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05); }
        .uploader-box:hover, .uploader-box.drag-active { border-color: #4169E1; background: rgba(255, 255, 255, 0.8); transform: translateY(-2px); box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.1); }
        .uploader-icon { font-size: 48px; color: #4169E1; margin-bottom: 15px; opacity: 0.8; }
        .uploader-title { font-weight: 700; color: #333; margin-bottom: 8px; }
        .uploader-subtitle { color: #555; line-height: 1.5; }
        .uploader-spinner { display: none; width: 40px; height: 40px; border: 4px solid rgba(65, 105, 225, 0.1); border-left-color: #4169E1; border-radius: 50%; animation: spin 1s linear infinite; }
        .bulk-upload-btn-overlay { position: absolute; top: -15px; right: 0; background: linear-gradient(135deg, #ff436b 0%, #4651e6 100%); color: #fff !important; padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 700; text-decoration: none; z-index: 100; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
        .bulk-upload-btn-overlay:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); color: #fff !important; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        /* Modal Styles */
        .sc-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100000; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
        .sc-modal.active { opacity: 1; pointer-events: auto; }
        .sc-modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px); }
        .sc-modal-content { position: relative; width: 90%; max-width: 500px; background: linear-gradient(135deg, #fc6767 0%, #ec008c 100%); padding: 2.5rem 2rem; border-radius: 16px; color: white; text-align: center; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .sc-modal.active .sc-modal-content { transform: scale(1); }
        .sc-modal-close { position: absolute; top: 15px; right: 15px; background: none; border: none; color: rgba(255, 255, 255, 0.8); font-size: 1.5rem; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s; z-index: 10; }
        .sc-modal-close:hover { background: rgba(255, 255, 255, 0.2); color: white; }
        .sc-modal-icon { font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
        .sc-modal-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .sc-modal-desc { font-size: 1rem; line-height: 1.5; margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.95); }
        .sc-modal-btn { display: inline-block; background: white; color: #ec008c; padding: 12px 28px; border-radius: 50px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; border: none; }
        .sc-modal-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); background: #fff; color: #d0007b; }
        
        /* Hide file input */
        .sc-file-input { display: none; }
    </style>

    <div class="uploader-wrapper" id="<?php echo $uid; ?>_wrapper">

        <?php if (!is_user_logged_in()): ?>
            <a href="<?php echo esc_url(site_url('/my-account/')); ?>" class="bulk-upload-btn-overlay">
                🔒 Login to Bulk Upload
            </a>
        <?php endif; ?>

        <div class="uploader-box" id="<?php echo $uid; ?>_box">
            <input type="file" id="<?php echo $uid; ?>_input" class="sc-file-input" accept="image/*" multiple>
            <div id="<?php echo $uid; ?>_content">
                <div class="uploader-icon">☁️</div>
                <div class="uploader-title"><?php echo esc_html($a['title']); ?></div>
                <div class="uploader-subtitle"><?php echo esc_html($a['subtitle']); ?></div>
            </div>
            <div class="uploader-spinner" id="<?php echo $uid; ?>_spinner"></div>
            <div class="uploader-subtitle" id="<?php echo $uid; ?>_status" style="display:none; margin-top:10px;">Processing...</div>
        </div>
    </div>

    <!-- Shortcode Modal HTML (Scoped ID) -->
    <div id="<?php echo $uid; ?>_modal" class="sc-modal">
        <div class="sc-modal-overlay" id="<?php echo $uid; ?>_overlay"></div>
        <div class="sc-modal-content">
            <button class="sc-modal-close" id="<?php echo $uid; ?>_close">×</button>
            <div class="sc-modal-icon">🔒</div>
            <div class="sc-modal-title">Multiple Uploads Restricted</div>
            <div class="sc-modal-desc">
                Guest users can only upload 1 image at a time.<br>
                Please login to unlock bulk uploading features.
            </div>
            <a href="/my-account" class="sc-modal-btn">Login / Create Account</a>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            // Scoped Elements
            const box = document.getElementById('<?php echo $uid; ?>_box');
            const input = document.getElementById('<?php echo $uid; ?>_input');
            const content = document.getElementById('<?php echo $uid; ?>_content');
            const spinner = document.getElementById('<?php echo $uid; ?>_spinner');
            const status = document.getElementById('<?php echo $uid; ?>_status');
            
            // Modal Elements
            const scModal = document.getElementById('<?php echo $uid; ?>_modal');
            const scOverlay = document.getElementById('<?php echo $uid; ?>_overlay');
            const scClose = document.getElementById('<?php echo $uid; ?>_close');

            const REDIRECT_URL = '<?php echo esc_js($a['redirect']); ?>';
            const isUserLoggedIn = <?php echo is_user_logged_in() ? 'true' : 'false'; ?>;

            // Modal Functions
            function showScModal() {
                if(scModal) scModal.classList.add('active');
            }
            function hideScModal() {
                if(scModal) scModal.classList.remove('active');
            }
            if(scOverlay) scOverlay.onclick = hideScModal;
            if(scClose) scClose.onclick = hideScModal;

            // Helper: Prevent defaults
            const preventDefaults = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                box.addEventListener(eventName, preventDefaults, false);
                document.body.addEventListener(eventName, preventDefaults, false); // Global prevent
            });

            // Highlight
            ['dragenter', 'dragover'].forEach(eventName => {
                box.addEventListener(eventName, () => box.classList.add('drag-active'), false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                box.addEventListener(eventName, () => box.classList.remove('drag-active'), false);
            });

            // Handle Drop
            box.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files.length > 0) handleFiles(files);
            });

            // Handle Click
            box.addEventListener('click', (e) => {
                // Prevent click when clicking the login button
                if (e.target.closest('.bulk-upload-btn-overlay')) return;
                input.click();
            });

            // Handle Input Change
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) handleFiles(e.target.files);
            });

            // Allow multiple file selection
            input.setAttribute('multiple', 'multiple');

            async function handleFiles(fileList) {
                // Filter images
                const incomingFiles = Array.from(fileList).filter(f => f.type.match(/^image\//));

                if (incomingFiles.length === 0) {
                    alert('Please upload valid image files (JPG, PNG, WEBP, etc).');
                    return;
                }

                // --- GUEST RESTRICTION LOGIC ---
                if (incomingFiles.length > 1 && !isUserLoggedIn) {
                    // Replaced alert with Custom Modal
                    showScModal(); 
                    // Clear input so they can try again
                    input.value = '';
                    return;
                }

                // Visual Loading State
                content.style.display = 'none';
                spinner.style.display = 'block';
                status.style.display = 'block';
                status.textContent = `Preparing ${incomingFiles.length} image(s)...`;

                try {
                    // Ensure TransferManager is ready
                    if (!window.transferManager) {
                        console.log("TransferManager not ready, attempting fallback check...");
                        if (typeof TransferManager !== 'undefined') {
                            window.transferManager = new TransferManager();
                        } else {
                            throw new Error("Upload system (TransferManager) is not loaded. Please refresh.");
                        }
                    }

                    status.textContent = 'Saving for transfer...';

                    // Save Batch to DB
                    await window.transferManager.saveBatch(incomingFiles);

                    status.textContent = 'Processing...';

                    // Redirect with Auto-Start Flag
                    const separator = REDIRECT_URL.includes('?') ? '&' : '?';
                    window.location.href = REDIRECT_URL + separator + 'auto_start=1';

                } catch (err) {
                    console.error("Upload Error:", err);
                    status.textContent = 'Error: ' + err.message;
                    status.style.color = 'red';
                    spinner.style.display = 'none';

                    // Show error for a moment
                    setTimeout(() => {
                        content.style.display = 'block';
                        status.style.display = 'none';
                        status.style.color = 'inherit';
                    }, 5000);
                }
            }
        });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('external-image-uploader', 'render_external_image_uploader_shortcode');
