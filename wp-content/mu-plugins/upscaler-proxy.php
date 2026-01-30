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
    // 1. Get arguments from frontend
    $params = $request->get_json_params();
    $image_base64 = isset($params['image']) ? $params['image'] : null;

    if (!$image_base64) {
        return new WP_Error('no_image', 'No image data provided', array('status' => 400));
    }

    // 2. Define External API URL (Insecure HTTP is okay server-to-server)
    $api_url = 'http://[IP_ADDRESS]/upscale_web';

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
