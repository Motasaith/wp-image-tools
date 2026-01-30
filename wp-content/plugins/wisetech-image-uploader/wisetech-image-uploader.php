<?php
/*
 * Plugin Name: Image Uploader System
 * Description: A custom system for uploading and enhancing images.
 * Version: 1.0
 * Author: Ibrar Ayub
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */


/* -------------------------
   Schedule Daily Event
------------------------- */

register_activation_hook(__FILE__, 'wisetech_schedule_daily_event');
add_action('init', 'wisetech_schedule_daily_event');

function wisetech_schedule_daily_event()
{
    if (!wp_next_scheduled('wisetech_daily_api_check')) {
        wp_schedule_event(time(), 'daily', 'wisetech_daily_api_check');
        error_log('[Wisetech Cron] Scheduled daily API check.');
    }
}

register_deactivation_hook(__FILE__, 'wisetech_clear_daily_event');

function wisetech_clear_daily_event()
{
    $timestamp = wp_next_scheduled('wisetech_daily_api_check');
    if ($timestamp) {
        wp_unschedule_event($timestamp, 'wisetech_daily_api_check');
        error_log('[Wisetech Cron] Daily API check unscheduled.');
    }
}

function wisetech_resolve_dns_api($dns_url, $option_key)
{

    $response = wp_remote_get($dns_url, array(
        'timeout' => 180,
        'method' => 'GET',
    ));

    if (is_wp_error($response)) {
        error_log('[Wisetech Cron] Error fetching ' . $dns_url . ': ' . $response->get_error_message());
        return false;
    }

    $api_url = trim(wp_remote_retrieve_body($response));

    if (filter_var($api_url, FILTER_VALIDATE_URL)) {
        update_option($option_key, untrailingslashit($api_url));
        update_option($option_key . '_last_updated', current_time('mysql'));
        error_log('[Wisetech Cron] Updated ' . $option_key . ': ' . $api_url);
        return true;
    }

    error_log('[Wisetech Cron] Invalid API URL from ' . $dns_url . ': ' . $api_url);
    return false;
}

add_action('wisetech_daily_api_check', 'wisetech_fetch_and_store_api_urls');

function wisetech_fetch_and_store_api_urls()
{

    // Main API DNS
    wisetech_resolve_dns_api(
        'https://sd.rad-wi.com',
        'wisetech_api_base_url'
    );

    // Image Background Remove API DNS
    wisetech_resolve_dns_api(
        'https://ibgc.rad-wi.com',
        'wisetech_bg_remove_api_base_url'
    );
}

// Main API
function wisetech_get_api_base_url()
{
    $url = get_option('wisetech_api_base_url', 'http://34.232.100.156:5454');
    if (!$url) {
        error_log('[Wisetech Cron] Using fallback Main API URL.');
    }
    return untrailingslashit($url);
}

// Image Background Remove API
function wisetech_get_bg_remove_api_url()
{
    $url = get_option('wisetech_bg_remove_api_base_url', 'http://34.232.100.156:5566'); // fallback example
    if (!$url) {
        error_log('[Wisetech Cron] Using fallback BG Remove API URL.');
    }
    return untrailingslashit($url);
}

$wisetech_main_api_url = wisetech_get_api_base_url();
$wisetech_bg_api_url = wisetech_get_bg_remove_api_url();

// Define constants for API endpoints
//define('WISETECH_UPSCALE_API', 'http://34.232.100.156:5454/upscale_web'); // old
//define('WISETECH_UPSCALE_API', $wisetech_main_api_url . '/upscale_web'); // old we were using 
define('WISETECH_UPSCALE_API', $wisetech_main_api_url . '/upscale_web_v2'); // abdul raufs 
//define('WISETECH_FACE_ENHANCER_API', 'http://34.232.100.156:5454/faceenhance_web'); // old
define('WISETECH_FACE_ENHANCER_API', $wisetech_main_api_url . '/faceenhance_web');


//define('WISETECH_BG_REMOVER_API', 'http://34.232.100.156:5454'); // old
define('WISETECH_BG_REMOVER_API', $wisetech_bg_api_url); // get from https://ibgc.rad-wi.com/
//define('WISETECH_BG_REMOVER_UPLOAD', '/uploadImageV2_web'); // old
define('WISETECH_BG_REMOVER_UPLOAD', '/uploadImageV2');
//define('WISETECH_BG_REMOVER_PROCESS', '/processImageBackgroundRemove_web'); // old
define('WISETECH_BG_REMOVER_PROCESS', '/processImageBackgroundRemove');
define('WISETECH_BG_REMOVER_STATUS', '/getStatus');
define('WISETECH_BG_REMOVER_DOWNLOAD', '/downloadImage');

// Define supported formats for each API
define('WISETECH_UPSCALE_FORMATS', 'JPG, JPEG, PNG, GIF, JFIF, WEBP, BMP, ICO, SVG, AVIF');
define('WISETECH_FACE_ENHANCER_FORMATS', 'JPG, JPEG, PNG, GIF, JFIF, WEBP, BMP, ICO, SVG, AVIF');
define('WISETECH_BG_REMOVER_FORMATS', 'JPG, JPEG, PNG, WEBP, JFIF, BMP');

// Enqueue scripts and styles
add_action('wp_enqueue_scripts', 'wisetech_image_uploader_enqueue_scripts');
function wisetech_image_uploader_enqueue_scripts()
{

    $max_limit = upscaleimg_get_user_subscription_limit();

    wp_enqueue_style(
        'image-uploader-style',
        plugins_url('assets/css/image-uploader-style.css', __FILE__)
    );

    wp_enqueue_script(
        'jszip',
        plugins_url('assets/js/jszip.min.js', __FILE__),
        array(),
        '3.10.1',
        true
    );

    wp_enqueue_script(
        'image-uploader-script',
        plugins_url('assets/js/image-uploader-script.js', __FILE__),
        array('jquery', 'jszip'),
        '1.0',
        true
    );

    wp_localize_script('image-uploader-script', 'wisetechVars', [
        'ajaxurl' => admin_url('admin-ajax.php'),
        'upscale_nonce' => wp_create_nonce('wisetech_upscale_nonce'),
        'face_enhancer_nonce' => wp_create_nonce('wisetech_face_enhancer_nonce'),
        'bg_remove_nonce' => wp_create_nonce('wisetech_bg_remove_nonce'),
        'max_files' => $max_limit,
        'max_file_size' => 10 * 1024 * 1024,
        'bg_remover_api' => WISETECH_BG_REMOVER_API,
        'bg_remover_download' => WISETECH_BG_REMOVER_DOWNLOAD,
        'bg_remover_status' => admin_url('admin-ajax.php?action=wisetech_bg_remove_status'),
        'is_logged_in' => is_user_logged_in(),
        'login_url' => site_url('/my-account/')
    ]);
}


/**
 * Get user's limit based on subscription status and plan
 * 
 * @return int The limit number based on subscription status:
 *             - Non-logged in users: 1
 *             - Logged in users without active subscription: 20
 *             - Active "free" plan subscription: 20
 *             - Active "basic" plan subscription: 50
 *             - Active "pro" plan subscription: 150
 */
function upscaleimg_get_user_subscription_limit()
{
    // Default limit for non-logged in users
    if (!is_user_logged_in()) {
        return 1;
    }

    $user_id = get_current_user_id();
    $limit = 1; // Default limit for logged-in users without active subscription

    // Check if subscription plugin is active
    if (!class_exists('SpringDevs\Subscription\Illuminate\Helper')) {
        // If subscription plugin is not active, return default for logged-in users
        return 20;
    }

    // Get active subscriptions for the current user
    $subscriptions = SpringDevs\Subscription\Illuminate\Helper::get_subscriptions(array(
        'user_id' => $user_id,
        'post_status' => 'active', // Only check active subscriptions
        'return' => 'post',
    ));

    // If no active subscriptions, return default limit for logged-in users
    if (empty($subscriptions)) {
        return 20;
    }

    // Check all active subscriptions for the highest plan
    foreach ($subscriptions as $subscription) {
        $subscription_id = $subscription->ID;
        $subscription_data = SpringDevs\Subscription\Illuminate\Helper::get_subscription_data($subscription_id);

        if (!$subscription_data) {
            continue;
        }

        // Get product from subscription
        $order_id = $subscription_data['order']['order_id'] ?? 0;
        $order_item_id = $subscription_data['order']['order_item_id'] ?? 0;

        if (!$order_id || !$order_item_id) {
            continue;
        }

        $order = wc_get_order($order_id);
        if (!$order) {
            continue;
        }

        $order_item = $order->get_item($order_item_id);
        if (!$order_item) {
            continue;
        }

        $product_id = $order_item->get_product_id();

        // Check product categories to determine plan
        $categories = wp_get_post_terms($product_id, 'product_cat');

        if (!empty($categories) && !is_wp_error($categories)) {
            $category_slugs = array();

            foreach ($categories as $category) {
                $category_slugs[] = strtolower($category->slug);
            }

            // Check for plan categories
            if (in_array('pro', $category_slugs)) {
                // If user has PRO subscription, return highest limit
                return 150;
            }

            if (in_array('basic', $category_slugs)) {
                // If user has BASIC subscription, but might have PRO later
                $limit = max($limit, 50); // Keep the highest limit
            }

            if (in_array('free', $category_slugs)) {
                // If user has FREE subscription
                $limit = max($limit, 20); // Keep the highest limit
            }
        }
    }

    return $limit;
}


// AJAX handlers
add_action('wp_ajax_wisetech_upscale_image', 'wisetech_upscale_image_handler');
add_action('wp_ajax_nopriv_wisetech_upscale_image', 'wisetech_upscale_image_handler');
add_action('wp_ajax_wisetech_face_enhancer', 'wisetech_face_enhancer_handler');
add_action('wp_ajax_nopriv_wisetech_face_enhancer', 'wisetech_face_enhancer_handler');
add_action('wp_ajax_wisetech_bg_remove', 'wisetech_bg_remove_handler');
add_action('wp_ajax_nopriv_wisetech_bg_remove', 'wisetech_bg_remove_handler');
add_action('wp_ajax_wisetech_bg_remove_status', 'wisetech_bg_remove_status_handler');
add_action('wp_ajax_nopriv_wisetech_bg_remove_status', 'wisetech_bg_remove_status_handler');
add_action('wp_ajax_wisetech_bg_remove_download', 'wisetech_bg_remove_download_handler');
add_action('wp_ajax_nopriv_wisetech_bg_remove_download', 'wisetech_bg_remove_download_handler');

// Shortcodes
add_shortcode('show-image-uploader', 'wisetech_display_image_uploader_shortcode');
add_shortcode('show-face-enhancer', 'wisetech_display_face_enhancer_shortcode');
add_shortcode('show-bg-remover', 'wisetech_display_bg_remover_shortcode');

// AJAX handler for image upscaling
function wisetech_upscale_image_handler()
{
    wisetech_process_image('upscale');
}

// AJAX handler for face enhancement
function wisetech_face_enhancer_handler()
{
    wisetech_process_image('face_enhancer');
}

// Common image processing function
function wisetech_process_image($type)
{
    // Verify nonce
    $nonce_action = $type === 'upscale' ? 'wisetech_upscale_nonce' : 'wisetech_face_enhancer_nonce';
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], $nonce_action)) {
        wp_send_json_error(array('error' => 'Invalid nonce'));
        exit;
    }

    if (!isset($_FILES['image'])) {
        wp_send_json_error(array('error' => 'No image file provided'));
        exit;
    }

    // Validate file
    $allowed_mimes = array(
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'jfif' => 'image/jfif',
        'webp' => 'image/webp',
        'bmp' => 'image/bmp',
        'ico' => 'image/x-icon',
        'svg' => 'image/svg+xml',
        'avif' => 'image/avif'
    );

    $file_info = wp_check_filetype($_FILES['image']['name'], $allowed_mimes);
    if (!$file_info['ext']) {
        wp_send_json_error(array('error' => 'Invalid file type'));
        exit;
    }

    if ($_FILES['image']['size'] > 10 * 1024 * 1024) {
        wp_send_json_error(array('error' => 'File size exceeds 10MB limit'));
        exit;
    }

    // Read file and encode as base64
    $image_data = file_get_contents($_FILES['image']['tmp_name']);
    $base64_image = base64_encode($image_data);

    // Determine API endpoint
    $api_url = $type === 'upscale' ? WISETECH_UPSCALE_API : WISETECH_FACE_ENHANCER_API;

    $args = array(
        'body' => json_encode(array('image' => $base64_image)),
        'headers' => array('Content-Type' => 'application/json'),
        'timeout' => 180
    );

    $response = wp_remote_post($api_url, $args);

    if (is_wp_error($response)) {
        wp_send_json_error(array('error' => $response->get_error_message()));
        exit;
    }

    $data = json_decode(wp_remote_retrieve_body($response), true);
    if (wp_remote_retrieve_response_code($response) != 200 || !isset($data['image'])) {
        wp_send_json_error(array('error' => 'API request failed'));
        exit;
    }

    wp_send_json_success(array(
        'image_data' => $data['image'],
        'filename' => ($type === 'upscale' ? 'upscaled_' : 'enhanced_') . $_FILES['image']['name'],
        'original_name' => $_FILES['image']['name']
    ));
    exit;
}

// Background remover handler - UPDATED to match your working PHP script
function wisetech_bg_remove_handler()
{
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'wisetech_bg_remove_nonce')) {
        wp_send_json_error(['error' => 'Invalid nonce']);
        return;
    }

    if (!isset($_FILES['image'])) {
        wp_send_json_error(['error' => 'No image file provided']);
        return;
    }

    // Validate file
    $allowed_mimes = array(
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'jfif' => 'image/jfif',
        'bmp' => 'image/bmp'
    );

    $file_info = wp_check_filetype($_FILES['image']['name'], $allowed_mimes);
    if (!$file_info['ext']) {
        wp_send_json_error(array('error' => 'Invalid file type'));
        return;
    }

    if ($_FILES['image']['size'] > 10 * 1024 * 1024) {
        wp_send_json_error(['error' => 'File size exceeds 10MB limit']);
        return;
    }

    try {
        $original_name = $_FILES['image']['name'];
        $file_ext = pathinfo($original_name, PATHINFO_EXTENSION);
        $unique_name = 'img_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;

        // Upload to background remover API
        $upload_url = WISETECH_BG_REMOVER_API . WISETECH_BG_REMOVER_UPLOAD;
        $file_tmp = $_FILES['image']['tmp_name'];

        if (!file_exists($file_tmp)) {
            throw new Exception("Temporary file not found.");
        }

        $post_data = [
            'file' => new CURLFile($file_tmp, mime_content_type($file_tmp), $unique_name)
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $upload_url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $post_data,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 180
        ]);
        $upload_response = curl_exec($ch);

        if (curl_errno($ch)) {
            throw new Exception("Upload error: " . curl_error($ch));
        }
        curl_close($ch);

        $upload_result = json_decode($upload_response, true);
        if (!$upload_result || !isset($upload_result['result']) || $upload_result['result'] !== 'success') {
            throw new Exception("Upload failed. Response: " . $upload_response);
        }

        // Start processing
        $process_url = WISETECH_BG_REMOVER_API . WISETECH_BG_REMOVER_PROCESS . "?imageName=" . urlencode($unique_name);
        $process_response = wp_remote_get($process_url, ['timeout' => 180]);

        if (is_wp_error($process_response)) {
            throw new Exception($process_response->get_error_message());
        }

        $process_data = json_decode(wp_remote_retrieve_body($process_response), true);
        if (!isset($process_data['result']) || $process_data['result'] !== 'success') {
            throw new Exception("Process failed. Response: " . wp_remote_retrieve_body($process_response));
        }

        // Store processing data in user session or transient
        $session_id = 'bg_session_' . md5($unique_name . time());
        set_transient($session_id, [
            'processing_image' => $unique_name,
            'processed_image' => pathinfo($unique_name, PATHINFO_FILENAME) . '.png',
            'original_name' => $original_name
        ], HOUR_IN_SECONDS);

        // Check initial status
        $status_url = WISETECH_BG_REMOVER_API . WISETECH_BG_REMOVER_STATUS . "?imageName=" . urlencode($unique_name);
        $status_response = wp_remote_get($status_url, ['timeout' => 180]);

        $status = null;
        if (!is_wp_error($status_response)) {
            $status_data = json_decode(wp_remote_retrieve_body($status_response), true);
            if (isset($status_data['status'])) {
                $status = intval($status_data['status']);
            }
        }

        wp_send_json_success([
            'session_id' => $session_id,
            'tracking_id' => $unique_name,
            'processed_name' => pathinfo($unique_name, PATHINFO_FILENAME) . '.png',
            'original_name' => $original_name,
            'initial_status' => $status,
            'message' => 'Processing started successfully'
        ]);

    } catch (Exception $e) {
        wp_send_json_error(['error' => $e->getMessage()]);
    }
}

// Background remove status handler - UPDATED
function wisetech_bg_remove_status_handler()
{
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'wisetech_bg_remove_nonce')) {
        wp_send_json_error(['error' => 'Invalid nonce']);
        return;
    }

    if (!isset($_POST['session_id']) || empty($_POST['session_id'])) {
        wp_send_json_error(['error' => 'Missing session ID']);
        return;
    }

    // Get processing data from transient
    $processing_data = get_transient($_POST['session_id']);
    if (!$processing_data || !isset($processing_data['processing_image'])) {
        wp_send_json_error(['error' => 'Session expired or invalid']);
        return;
    }

    $tracking_id = $processing_data['processing_image'];
    $status_url = WISETECH_BG_REMOVER_API . WISETECH_BG_REMOVER_STATUS . "?imageName=" . urlencode($tracking_id);
    $response = wp_remote_get($status_url, ['timeout' => 180]);

    if (is_wp_error($response)) {
        wp_send_json_error(['error' => $response->get_error_message()]);
        return;
    }

    $status_data = json_decode(wp_remote_retrieve_body($response), true);

    if (!$status_data) {
        wp_send_json_error([
            'error' => 'Invalid API response',
            'response' => wp_remote_retrieve_body($response)
        ]);
        return;
    }

    // Handle the API response format
    if (isset($status_data['status'])) {
        $status = intval($status_data['status']);

        switch ($status) {
            case 1: // Completed
                $download_url = admin_url('admin-ajax.php') . '?action=wisetech_bg_remove_download&session_id=' . $_POST['session_id'];
                wp_send_json_success([
                    'status' => 'completed',
                    'download_url' => $download_url,
                    'processed_filename' => $processing_data['processed_image'],
                    'api_response' => $status_data
                ]);
                break;

            case 0: // Processing
                wp_send_json_success([
                    'status' => 'processing',
                    'api_response' => $status_data
                ]);
                break;

            case -1: // Error
                wp_send_json_error([
                    'error' => 'Background removal failed on server',
                    'api_response' => $status_data
                ]);
                break;

            default:
                wp_send_json_error([
                    'error' => 'Unknown status from API: ' . $status,
                    'api_response' => $status_data
                ]);
        }
    } else {
        wp_send_json_error([
            'error' => 'Missing status field in API response',
            'api_response' => $status_data
        ]);
    }
}

// Background remove download handler - NEW
function wisetech_bg_remove_download_handler()
{
    if (!isset($_GET['session_id']) || empty($_GET['session_id'])) {
        wp_die('Missing session ID');
    }

    // Get processing data from transient
    $processing_data = get_transient($_GET['session_id']);
    if (!$processing_data || !isset($processing_data['processed_image'])) {
        wp_die('Session expired or invalid');
    }

    $download_url = WISETECH_BG_REMOVER_API . WISETECH_BG_REMOVER_DOWNLOAD . "?imageName=" . urlencode($processing_data['processed_image']);

    // Download the file from API
    $response = wp_remote_get($download_url, ['timeout' => 180]);

    if (is_wp_error($response)) {
        wp_die('Download failed: ' . $response->get_error_message());
    }

    if (wp_remote_retrieve_response_code($response) !== 200) {
        wp_die('Download failed with status: ' . wp_remote_retrieve_response_code($response));
    }

    // Get the image data and content type
    $image_data = wp_remote_retrieve_body($response);
    $content_type = wp_remote_retrieve_header($response, 'content-type');

    if (!$content_type) {
        $content_type = 'image/png'; // Default to PNG
    }

    // Set headers and output the image
    header('Content-Type: ' . $content_type);
    header('Content-Disposition: attachment; filename="' . $processing_data['processed_image'] . '"');
    header('Content-Length: ' . strlen($image_data));

    echo $image_data;
    exit;
}

// Shortcode functions
function wisetech_display_image_uploader_shortcode($atts)
{
    return wisetech_get_uploader_html('upscale');
}

function wisetech_display_face_enhancer_shortcode($atts)
{
    return wisetech_get_uploader_html('face_enhancer');
}

function wisetech_display_bg_remover_shortcode($atts)
{
    return wisetech_get_uploader_html('bg_remove');
}

// Common uploader HTML generator
function wisetech_get_uploader_html($type)
{
    $config = [
        'upscale' => [
            'title' => 'Drop file(s) here or click to upload',
            'action' => 'wisetech_upscale_image',
            'nonce' => wp_create_nonce('wisetech_upscale_nonce'),
            'progress_label' => 'Upscaling image(s)...',
            'formats' => WISETECH_UPSCALE_FORMATS
        ],
        'face_enhancer' => [
            'title' => 'Drop file(s) here for face enhancement',
            'action' => 'wisetech_face_enhancer',
            'nonce' => wp_create_nonce('wisetech_face_enhancer_nonce'),
            'progress_label' => 'Enhancing face(s)...',
            'formats' => WISETECH_FACE_ENHANCER_FORMATS
        ],
        'bg_remove' => [
            'title' => 'Drop file(s) here for background removal',
            'action' => 'wisetech_bg_remove',
            'nonce' => wp_create_nonce('wisetech_bg_remove_nonce'),
            'progress_label' => 'Removing background(s)...',
            'formats' => WISETECH_BG_REMOVER_FORMATS
        ]
    ][$type] ?? [
        'title' => 'Drop file(s) here to upload',
        'action' => '',
        'nonce' => '',
        'progress_label' => 'Processing image(s)...',
        'formats' => 'JPG, JPEG, PNG'
    ];

    // Customize Selectors for Upscale to DETACH default JS
    $is_upscale = ($type === 'upscale');
    $inputId = $is_upscale ? 'fileInputRedirect' : 'fileInput';
    $btnClass = $is_upscale ? 'upload-button-redirect' : 'upload-button';
    $boxId = $is_upscale ? 'uploadBoxRedirect' : 'uploadBox'; // Detach drag/drop handlers

    ob_start();

    // --- INJECT CUSTOM REDIRECT LOGIC FOR UPSCALER ---
    if ($is_upscale) {
        ?>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Simplified Transfer Manager for Homepage
            const DB_NAME = 'UpscaleToolsDB';
            const STORE_NAME = 'transfer_store';
            const DB_VERSION = 1;

            function saveAndRedirect(file) {
                // Show simple loading state on button
                const btn = document.querySelector('.upload-button-redirect');
                if(btn) btn.textContent = 'Preparing...';

                // Use FileReader + LocalStorage (Synchronous, simple)
                const reader = new FileReader();
                reader.onload = function(e) {
                    const payload = {
                        action: 'upscale_transfer',
                        name: file.name,
                        type: file.type,
                        data: e.target.result, // Base64
                        timestamp: Date.now()
                    };
                    
                    try {
                        localStorage.setItem('pending_upscale_image', JSON.stringify(payload));
                        // Small delay to ensure storage commit
                        setTimeout(() => {
                            window.location.href = '/free-image-upscaler-tool-online';
                        }, 100);
                    } catch (err) {
                        console.error(err);
                        alert('Image is too large for instant transfer. Please upload it directly on the tool page.');
                        window.location.href = '/free-image-upscaler-tool-online';
                    }
                };
                reader.onerror = function() {
                    alert('Error reading file.');
                };
                reader.readAsDataURL(file);
            }

            // Bind to Redirect Elements
            const input = document.getElementById('fileInputRedirect');
            const btn = document.querySelector('.upload-button-redirect');
            const box = document.getElementById('uploadBoxRedirect');

            if (input) {
                input.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files[0]) {
                        saveAndRedirect(e.target.files[0]);
                    }
                });
            }

            if (btn && input) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    input.click();
                });
            }

            if (box) {
                box.addEventListener('click', (e) => {
                    if (e.target !== input && !e.target.classList.contains('upload-button-redirect')) {
                        input.click();
                    }
                });

                box.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    box.classList.add('drag-over');
                });

                box.addEventListener('dragleave', (e) => {
                    box.classList.remove('drag-over');
                });

                box.addEventListener('drop', (e) => {
                    e.preventDefault();
                    box.classList.remove('drag-over');
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        saveAndRedirect(e.dataTransfer.files[0]);
                    }
                });
            }
        });
        </script>
        <style>
            /* Ensure Redirect Button looks same as original */
            .upload-button-redirect {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 50px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                margin-top: 15px;
                display: inline-block;
            }
            .upload-button-redirect:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(118, 75, 162, 0.4);
            }
        </style>
        <?php
    }
    // -------------------------------------------------

    // Wrapper ID
    $wrapperId = $is_upscale ? 'delayedUploaderRedirect' : 'delayedUploader';
    
    ?>
    <div id="<?php echo esc_attr($wrapperId); ?>" style="<?php echo $is_upscale ? 'display:block;' : 'display: none;'; ?>" 
         data-action="<?php echo esc_attr($config['action']); ?>" 
         data-nonce="<?php echo esc_attr($config['nonce']); ?>">
        <div class="image-upscaler-container">
            <!-- Bulk Upload Button for Non-logged-in Users - Outside upload box -->
            <?php if (!is_user_logged_in()) : ?>
            <a href="<?php echo esc_url(site_url('/my-account/')); ?>" class="bulk-upload-btn" title="Login for bulk upload" id="bulkUploadBtn">
                 🔒 Login to Bulk Upload
            </a>
            <?php endif; ?>

            <div class="upload-container">
                <div class="upload-box" id="<?php echo esc_attr($boxId); ?>">
                    <div class="upload-content">
                        <div class="upload-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3 class="upload-title"><?php echo esc_html($config['title']); ?></h3>
                        <p class="upload-subtitle" id="uploadSubtitle">Up to
                            <?php echo upscaleimg_get_user_subscription_limit(); ?> file(s) (Max size 10MB each). Supported:
                            <?php echo esc_html($config['formats']); ?>.
                        </p>
                        <button class="<?php echo esc_attr($btnClass); ?>" type="button">Upload file(s)</button>
                        <input type="file" id="<?php echo esc_attr($inputId); ?>" <?php echo is_user_logged_in() ? 'multiple' : ''; ?>
                            accept="<?php echo wisetech_get_accept_attr($type); ?>" hidden>
                    </div>

                    <div class="upload-progress" id="uploadProgress">
                        <div class="progress-circle">
                            <svg class="progress-ring" width="60" height="60">
                                <circle cx="30" cy="30" r="25" stroke="#4a5568" stroke-width="4" fill="none" />
                                <circle class="progress-bar" cx="30" cy="30" r="25" stroke="#f093fb" stroke-width="4"
                                    fill="none" stroke-dasharray="157" stroke-dashoffset="157" />
                            </svg>
                            <span class="progress-text">0%</span>
                        </div>
                        <p class="progress-label"><?php echo esc_html($config['progress_label']); ?></p>
                        <div class="files-processing" id="filesProcessing">
                            <!-- Files being processed will appear here -->
                        </div>
                    </div>

                    <style>
                        /* Dark overlay container */
                        .login-overlay {
                            display: none;
                            /* Shown only when not logged in */
                            position: absolute;
                            inset: 0;
                            background: rgba(0, 0, 0, 0.65);
                            backdrop-filter: blur(4px);
                            -webkit-backdrop-filter: blur(4px);
                            z-index: 99;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            border-radius: 12px;
                        }

                        /* Text and layout */
                        .overlay-content {
                            text-align: center;
                            color: #fff;
                            padding: 20px;
                        }

                        /* Lock icon */
                        .lock-icon {
                            font-size: 60px;
                            margin-bottom: 15px;
                        }

                        /* Subtitle */
                        .overlay-text {
                            font-size: 18px;
                            margin-bottom: 20px;
                        }

                        /* Login button */
                        .overlay-login-btn {
                            padding: 12px 24px;
                            background: #ff436b;
                            display: inline-block;
                            border-radius: 15px;
                            color: #fff;
                            font-weight: 600;
                            font-size: 16px;
                            text-decoration: none;
                            transition: 0.3s;
                        }

                        .overlay-login-btn:hover {
                            background: #363fbe;
                            color: #fff;
                        }
                    </style>
                </div>

                <div class="upload-complete" id="uploadComplete" style="display: none;">
                    <div class="complete-header">
                        <div class="success-icon">✓</div>
                        <h3 class="complete-title" id="completeTitle">Processing Complete</h3>

                        <p class="complete-failderror" id="completeFaildError" style="color:red;font-weight: 600;"></p>
                        <p style=" font-weight: 500;" class="complete-subtitle" id="completeSubtitle"></p>
                        <button style="margin-top: 10px;   padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 500;" class="view-files-btn" id="viewFilesBtn">Download Processed File(s)</button>

                    </div>
                    <div class="complete-actions">
                        <p style="margin-top: 10px; color: #5c5c5e; margin-bottom: 10px; font-weight: 500;">Want to process
                            more images?</p>
                        <button style="    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 500;" class="new-upload-btn" id="newUploadBtn">Process New Images</button>
                    </div>
                </div>

                <div class="files-preview" id="filesPreview">
                    <div class="preview-header">
                        <h4 class="preview-title">Selected File(s)</h4>
                        <button class="add-more-btn" id="addMoreBtn">Add More File(s)</button>
                    </div>
                    <div class="files-list" id="filesList">
                        <!-- Files will be dynamically added here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script type="text/javascript">
        // Only run this legacy show/hide logic if we are NOT in upscale mode (which has its own logic)
        <?php if (!$is_upscale) : ?>
        document.addEventListener("DOMContentLoaded", function() {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                setTimeout(function() {
                    document.getElementById("delayedUploader").style.display = "block";
                }, 5000);
            } else {
                document.getElementById("delayedUploader").style.display = "block";
            }
        });
        <?php endif; ?>
    </script>
    <?php
    return ob_get_clean();
}

// Helper function to get accept attribute based on API type
function wisetech_get_accept_attr($type)
{
    switch ($type) {
        case 'upscale':
        case 'face_enhancer':
            return '.jpg,.jpeg,.png,.gif,.jfif,.webp,.bmp,.ico,.svg,.avif';
        case 'bg_remove':
            return '.jpg,.jpeg,.png,.webp,.jfif,.bmp';
        default:
            return '.jpg,.jpeg,.png';
    }
}
