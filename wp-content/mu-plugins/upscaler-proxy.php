<?php
/*
Plugin Name: Upscaler Proxy (MU)
Description: Auto-loaded proxy for the Image Upscaler API to fix Mixed Content/CORS.
Version: 1.0
Author: UpscaleAI
*/

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register Server-Side Proxy for Upscaler API
 * Solves Mixed Content (HTTPS -> HTTP) and CORS issues.
 */
add_action('rest_api_init', function () {
    register_rest_route('thegem/v1', '/upscaler/proxy', array(
        'methods' => 'POST',
        'callback' => 'handle_upscaler_proxy_mu',
        'permission_callback' => '__return_true', // Open endpoint
    ));
});

function handle_upscaler_proxy_mu($request)
{
    // --- SECURITY: Payload Size Check ---
    // Approx 10MB image ~ 14MB Base64. 15MB Safety Cap.
    $content_length = $request->get_header('content-length');
    if ($content_length && $content_length > 15 * 1024 * 1024) {
        return new WP_Error('payload_too_large', 'Image is too large (Max 10MB).', array('status' => 413));
    }

    // --- SECURITY: Rate Limiting ---
    $user_id = get_current_user_id();
    $client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    // Limits (Requests per 10 Minutes)
    $limit = $user_id ? 100 : 5;
    $transient_key = 'upscale_limit_' . ($user_id ? "user_{$user_id}" : "ip_" . md5($client_ip));

    $current_count = get_transient($transient_key);

    if ($current_count !== false && $current_count >= $limit) {
        return new WP_Error('rate_limit_exceeded', 'Rate limit exceeded. Please wait a few minutes.', array('status' => 429));
    }

    // Increment Counter
    if ($current_count === false) {
        set_transient($transient_key, 1, 10 * 60); // 10 Minutes
    } else {
        // Update without resetting timeout (approximate, simpler than exact slide)
        // For strict sliding window, would need stored timestamps, but this is sufficient for basic protection.
        // Actually, set_transient overwrites expiration. To keep it simple:
        // Just increment. If it's close to expiring, they get a fresh window soon anyway.
        // A better pattern for fixed window:
        set_transient($transient_key, $current_count + 1, 10 * 60);
    }

    // 1. Get arguments from frontend
    $params = $request->get_json_params();
    $image_base64 = isset($params['image']) ? $params['image'] : null;

    if (!$image_base64) {
        return new WP_Error('no_image', 'No image data provided', array('status' => 400));
    }

    // Double check actual string length (in case content-length header was missing/spoofed)
    if (strlen($image_base64) > 15 * 1024 * 1024) {
        return new WP_Error('payload_too_large', 'Image data is too large.', array('status' => 413));
    }

    // 2. Define External API URL (Insecure HTTP is okay server-to-server)
    $api_url = 'http://198.11.171.198:4404/upscale_web';

    // 3. Make Request using WordPress HTTP API
    $response = wp_remote_post($api_url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode(array('image' => $image_base64)),
        'method' => 'POST',
        'data_format' => 'body',
        'timeout' => 120 // Increase timeout for AI processing
    ));

    // 4. Handle Errors
    if (is_wp_error($response)) {
        return new WP_Error('external_api_error', $response->get_error_message(), array('status' => 500));
    }

    // 5. Return Data to Frontend
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (isset($data['error'])) {
        return new WP_Error('api_error', $data['error'], array('status' => 500));
    }

    // Return the successful JSON response
    return new WP_REST_Response($data, 200);
}
