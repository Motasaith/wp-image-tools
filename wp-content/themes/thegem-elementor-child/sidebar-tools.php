<?php
// Define Tools Data
$tools = [
    [
        'name' => 'Compress Image',
        'url' => '/free-image-compressor-tool-online',
        'icon' => '📉'
    ],
    [
        'name' => 'Image Converter',
        'url' => '/free-image-conversion-tool-online',
        'icon' => '🔄'
    ],
    [
        'name' => 'Resize Image',
        'url' => '/free-image-resizer-tool-online',
        'icon' => '📏'
    ],
    [
        'name' => 'Crop Image',
        'url' => '/free-image-cropper-tool-online',
        'icon' => '✂️'
    ],
    [
        'name' => 'Image Upscaler',
        'url' => '/free-image-upscaler-tool-online',
        'icon' => '🔍✨'
    ],
    [
        'name' => 'Meme Generator',
        'url' => '/free-meme-generator-tool-online',
        'icon' => '🤣'
    ],
    [
        'name' => 'HTML to Image',
        'url' => '/free-html-to-image-tool-online',
        'icon' => '🌐'
    ],
    [
        'name' => 'Image Sharpen',
        'url' => '/free-image-sharpen-tool-online',
        'icon' => '✨'
    ],
];

// Get current path to filter out the active page
$current_path = $_SERVER['REQUEST_URI'];
?>

<div class="more-tools-widget" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #171616;">
    <!-- Header with ID and Icon -->
    <h3 id="tools-widget-header"
        style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: #333; display: flex; justify-content: space-between; align-items: center;">
        Try Other Tools
        <span class="tools-toggle-icon" style="transition: transform 0.3s ease; font-size: 0.8em;">▼</span>
    </h3>

    <!-- List with ID -->
    <ul id="tools-list-container" class="tools-list" style="list-style: none; padding: 0; margin: 0;">
        <?php foreach ($tools as $tool): ?>
            <?php
            // Skip if the current page URL contains the tool URL
            if (strpos($current_path, $tool['url']) !== false) {
                continue;
            }
            ?>
            <li style="margin-bottom: 8px;">
                <a href="<?php echo $tool['url']; ?>"
                    style="display: flex; align-items: center; color: #555; text-decoration: none; padding: 8px; border-radius: 6px; transition: background 0.2s;">
                    <span style="font-size: 1.2rem; margin-right: 10px;">
                        <?php echo $tool['icon']; ?>
                    </span>
                    <?php echo $tool['name']; ?>
                </a>
            </li>
        <?php endforeach; ?>
    </ul>

    <style>
        .tools-list a:hover {
            background: #f5f5f5;
            color: #007bff !important;
        }

        /* Mobile specific styles */
        @media (max-width: 991px) {
            #tools-widget-header {
                cursor: pointer;
                background: #f9f9f9;
                padding: 10px;
                border-radius: 8px;
            }

            .tools-list {
                display: none;
                /* Hidden by default on mobile */
                padding: 0 10px !important;
            }

            .tools-list.expanded {
                display: block;
                animation: slideDown 0.3s ease-out;
            }

            .tools-toggle-icon.rotated {
                transform: rotate(180deg) !important;
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-5px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        }

        /* Desktop: Always show, hide icon */
        @media (min-width: 992px) {
            .tools-toggle-icon {
                display: none;
            }

            #tools-widget-header {
                cursor: default !important;
            }

            .tools-list {
                display: block !important;
            }
        }
    </style>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const header = document.getElementById('tools-widget-header');
            const list = document.getElementById('tools-list-container');
            const icon = header ? header.querySelector('.tools-toggle-icon') : null;

            if (header && list) {
                header.addEventListener('click', function () {
                    // Only active on mobile check via CSS state or window width
                    if (window.getComputedStyle(list).display === 'none' || list.classList.contains('expanded') || window.innerWidth <= 991) {
                        list.classList.toggle('expanded');
                        if (icon) icon.classList.toggle('rotated');
                    }
                });
            }
        });
    </script>
</div>