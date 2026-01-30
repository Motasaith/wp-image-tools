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
        'subtitle' => 'Drag & Drop or Click to Browse',
    ), $atts);

    // Enqueue TransferManager if not already loaded (Handled globally in functions.php, but keeping as fallback)
    wp_enqueue_script('transfer-manager', get_stylesheet_directory_uri() . '/transfer-manager.js', array(), '1.2', true);

    ob_start();
    ?>
    <style>
        .uploader-wrapper {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
        }

        .uploader-box {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 2px dashed rgba(65, 105, 225, 0.3);
            border-radius: 20px;
            padding: 40px 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 250px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
        }

        .uploader-box:hover,
        .uploader-box.drag-active {
            border-color: #4169E1;
            background: rgba(255, 255, 255, 0.8);
            transform: translateY(-2px);
            box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.1);
        }

        .uploader-icon {
            font-size: 48px;
            color: #4169E1;
            margin-bottom: 15px;
            opacity: 0.8;
        }

        .uploader-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 8px;
        }

        .uploader-subtitle {
            font-size: 0.95rem;
            color: #666;
        }

        .uploader-spinner {
            display: none;
            width: 40px;
            height: 40px;
            border: 4px solid rgba(65, 105, 225, 0.1);
            border-left-color: #4169E1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        /* Hide actual input */
        #ext-file-input {
            display: none;
        }
    </style>

    <div class="uploader-wrapper">
        <div class="uploader-box" id="ext-uploader-box">
            <input type="file" id="ext-file-input" accept="image/*" multiple>

            <div id="ext-uploader-content">
                <div class="uploader-icon">☁️</div>
                <div class="uploader-title">
                    <?php echo esc_html($a['title']); ?>
                </div>
                <div class="uploader-subtitle">
                    <?php echo esc_html($a['subtitle']); ?>
                </div>
            </div>

            <div class="uploader-spinner" id="ext-uploader-spinner"></div>
            <div class="uploader-subtitle" id="ext-uploader-status" style="display:none; margin-top:10px;">Processing...
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const box = document.getElementById('ext-uploader-box');
            const input = document.getElementById('ext-file-input');
            const content = document.getElementById('ext-uploader-content');
            const spinner = document.getElementById('ext-uploader-spinner');
            const status = document.getElementById('ext-uploader-status');

            const REDIRECT_URL = '<?php echo esc_js($a['redirect']); ?>';

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
            box.addEventListener('click', () => input.click());

            // Handle Input Change
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) handleFiles(e.target.files);
            });

            // Allow multiple file selection
            input.setAttribute('multiple', 'multiple');

            async function handleFiles(fileList) {
                const incomingFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));

                if (incomingFiles.length === 0) {
                    alert('Please upload valid image files.');
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
                        console.error("TransferManager not loaded yet.");
                        if (window.TransferManager) {
                            window.transferManager = new TransferManager();
                        } else {
                            throw new Error("Transfer System loading...");
                        }
                    }

                    status.textContent = 'Saving for transfer...';

                    // Save Batch to DB
                    await window.transferManager.saveBatch(incomingFiles);

                    status.textContent = 'Redirecting...';

                    // Redirect
                    window.location.href = REDIRECT_URL;

                } catch (err) {
                    console.error(err);
                    status.textContent = 'Error: ' + err.message;
                    spinner.style.display = 'none';
                    setTimeout(() => {
                        content.style.display = 'block';
                        status.style.display = 'none';
                    }, 3000);
                }
            }
        });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('external-image-uploader', 'render_external_image_uploader_shortcode');
