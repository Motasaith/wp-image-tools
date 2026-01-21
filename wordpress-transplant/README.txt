# How to Install and Test

1.  **Copy Files**: Copy the entire `wordpress-transplant` folder into your current active theme directory.
    -   Example: `wp-content/themes/your-theme/wordpress-transplant/`
2.  **WP Admin**:
    -   Go to **Pages > Add New**.
    -   Title it "Upscaler".
    -   On the right sidebar, under **Page Attributes**, select **Template: Upscaler Dashboard**.
    -   Publish the page.
3.  **View**: Click "View Page".

## Troubleshooting Path Issues
The template assumes the folder is named `wordpress-transplant` and is inside your theme root.
If scripts don't load (console 404), check `page-upscaler.php`:
`<script src="<?php echo get_stylesheet_directory_uri(); ?>/wordpress-transplant/upscale-script.js"></script>`
Adjust the path to match where you actually placed the files.
