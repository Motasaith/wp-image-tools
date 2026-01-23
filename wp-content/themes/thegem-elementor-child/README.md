# Upscale.media WordPress Theme (Child)

**Staging Site:** [https://staging.upscaleimg.ai](https://staging.upscaleimg.ai)

This repository contains the custom Child Theme for the Upscale AI WordPress site. It includes custom-built image processing tools integrated as WordPress Page Templates.

## 📂 Directory Overview

The project is organized by tool. Each folder corresponds to a specific image tool and typically contains:
- `page-[tool-name].php`: The WordPress Page Template file.
- `style.css`: Tool-specific styles.
- `script.js`: Tool-specific logic (React/Vanila JS).

### Core Directories

| Folder Name | Description |
| :--- | :--- |
| **`image-tools-hub`** | The main landing page listing all available tools. |
| `html-to-image` | Tool to convert HTML/URLs to images. |
| `image-compressor` | Client-side image compression tool. |
| `image-converter` | Format conversion tool (JPG, PNG, WEBP, etc.). |
| `image-cropper` | Image cropping utility. |
| `image-editor` | Full-featured photo editor (filters, text, etc.). |
| `image-resizer` | Image resizing tool. |
| `image-sharpen` | **New** Tool to sharpen images using convolution kernels. |
| `meme-generator` | Meme generator with template library and text editor. |
| `remove-background` | (If present) Background removal tool context. |

---

## 🛠️ Tools & URLs

These tools are deployed as WordPress pages. Below is the mapping of Tool Name, Folder, and Public URL.

| Tool Name | Folder Path | Public URL Slug |
| :--- | :--- | :--- |
| **Image Tools Hub** | `image-tools-hub/` | `/` (or `/image-tools`) |
| **Compress Image** | `image-compressor/` | `/free-image-compressor-tool-online` |
| **Resize Image** | `image-resizer/` | `/free-image-resizer-tool-online` |
| **Crop Image** | `image-cropper/` | `/free-image-cropper-tool-online` |
| **Image Converter** | `image-converter/` | `/free-image-conversion-tool-online` |
| **Photo Editor** | `image-editor/` | `/free-photo-editor-tool-online` |
| **Meme Generator** | `meme-generator/` | `/free-meme-generator-tool-online` |
| **HTML to Image** | `html-to-image/` | `/free-html-to-image-tool-online` |
| **Image Sharpen** | `image-sharpen/` | `/image-sharpen-tool` |
| **Upscale Image** | *(External/Plugin)* | `/bulk-image-upscaler` |
| **Remove Background** | *(External/Plugin)* | `/remove-image-background` |

---

## 👨‍💻 Development Guidelines

1.  **Page Templates:**
    Each tool uses a header comment to define the template name:
    ```php
    /*
    * Template Name: [Tool Name]
    */
    ```
    Create a new page in WordPress and select this template to deploy the tool.

2.  **Asset Loading:**
    Assets are loaded dynamically using `get_stylesheet_directory_uri()` in the PHP template.
    ```php
    $tool_url = get_stylesheet_directory_uri() . '/my-tool';
    // Link CSS/JS using $tool_url
    ```

3.  **Local vs Staging:**
    - **Local:** `d:\Upscale_AI_Wordpress\wp-content\themes\thegem-elementor-child\`
    - **Staging:** `https://staging.upscaleimg.ai`

4.  **File Location in WordPress:**
    The code for these tools is located in your active **Child Theme** directory.
    - **FTP/SFTP:** Navigate to `/wp-content/themes/[your-active-child-theme]/`
    - **WP Dashboard:** Go to **Appearance** -> **Theme File Editor** (or use a File Manager plugin).
    
    *Do not edit the parent theme directly.*

## 📝 Recent Updates
- **Meme Generator:** Updated with categorized template library (Trending, Classic, Gaming, etc.) and JS-based rendering.
- **Image Sharpen:** Newly added client-side sharpening tool.
