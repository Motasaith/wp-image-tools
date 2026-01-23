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
        'name' => 'Photo Editor',
        'url' => '/free-photo-editor-tool-online',
        'icon' => '🎨'
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
    <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: #333;">Try Other Tools</h3>
    <ul class="tools-list" style="list-style: none; padding: 0; margin: 0;">
        <?php foreach ($tools as $tool): ?>
            <?php
            // Skip if the current page URL contains the tool URL
            // We use strpos to check if the path matches (handles sub-queries/trailing slashes loosely)
            // Normalize by trimming slashes for robust logic if needed, but strpos is usually sufficient for these slugs
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
    </style>
</div>