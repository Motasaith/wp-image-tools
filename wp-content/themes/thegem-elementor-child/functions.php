<?php
function custom_admin_selection_style()
{
    echo '<style>
        ::selection {
            background: #ff295f !important;
            color: #ffffff !important;
        }
        ::-moz-selection {
            background: #ff295f !important;
            color: #ffffff !important;
        }
    </style>';
}
add_action('admin_head', 'custom_admin_selection_style');

// Remove rel="nofollow" from internal links (comment, language, etc.)
add_filter('get_comment_reply_link', 'upscaleimgai_remove_nofollow');
add_filter('cancel_comment_reply_link', 'upscaleimgai_remove_nofollow');
add_filter('wp_nav_menu', 'upscaleimgai_remove_nofollow');
add_filter('translatepress_language_selector', 'upscaleimgai_remove_nofollow'); // for TranslatePress switcher

function upscaleimgai_remove_nofollow($content)
{
    if (is_string($content)) {
        // Remove nofollow attribute
        $content = str_replace('rel="nofollow"', '', $content);
        $content = str_replace("rel='nofollow'", '', $content);
    }
    return $content;
}


/* 
    Hide or show menu items based on login status
*/
add_filter('wp_nav_menu_objects', function ($items) {

    foreach ($items as $key => $item) {

        // If menu item title is "Login"
        if ($item->title === 'Login') {
            if (is_user_logged_in()) {
                unset($items[$key]); // hide Login for logged-in users
            }
        }

        // If menu item title is "My Account"
        if ($item->title === 'My Account') {
            if (!is_user_logged_in()) {
                unset($items[$key]); // hide My Account for guests
            }
        }
    }

    return $items;
});


/* 
    Prevent WordPress from showing update notifications for the Social Login plugin. 
*/
add_filter('site_transient_update_plugins', function ($transient) {
    if (isset($transient->response['nextend-facebook-connect/nextend-facebook-connect.php'])) {
        unset($transient->response['unextend-facebook-connect/nextend-facebook-connect.php']);
    }
    return $transient;
});




/**
 * Center WooCommerce account forms (login/register) as a block
 * Content inside the form stays left-aligned
 * Fully responsive for all screen sizes
 */
add_action('wp_enqueue_scripts', function () {
    if (!is_account_page())
        return;

    /* ----------  CSS  ---------- */
    wp_add_inline_style('woocommerce-inline', '
        /* ---- center the form wrapper ---- */
        .woocommerce-account .checkout-login,
        .woocommerce-account .my-account-signup, .woocommerce-account .lost_reset_password {
            display: block;          
            max-width: 420px;        /* max width for larger screens */
            width: 90%;              /* responsive width for smaller screens */
            margin: 0 auto;          /* center horizontally */
            box-sizing: border-box;  /* include padding in width */
            padding: 0 15px;         /* optional padding for mobile */
        }

        /* ---- center wrapper in the row ---- */
        .woocommerce-account .woocommerce .row.woocommerce-account-modern {
            display: flex;
            justify-content: center; 
            margin: auto;
        }

        /* ---- inside the form: left-align everything ---- */
        .woocommerce-form-row label { text-align: left; }
        .woocommerce-form-row input[type=text],
        .woocommerce-form-row input[type=email],
        .woocommerce-form-row input[type=password] { width: 100%; }
        .gem-button-container,
        .woocommerce-form-login .form-row,
        .woocommerce-form-register .form-row { text-align: left; }
        
        
        /* ---- style login/register buttons ---- */
        .woocommerce-account .checkout-login .gem-button,
        .woocommerce-account .my-account-signup .gem-button, .woocommerce-account .lost_reset_password .gem-button {
            background-color: #ff436b;   
            color: #fff;                 
            border-radius: 25px !important;         
            border: none;               
            padding-right: 25px;   
            padding-left: 25px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s ease; /* smooth hover effect */
        }
        
        /* ---- hover effect ---- */
        .woocommerce-account .checkout-login .gem-button:hover,
        .woocommerce-account .my-account-signup .gem-button:hover, .woocommerce-account .lost_reset_password .gem-button:hover {
            background-color: #363fbe;   /* hover blue */
            color: #fff;                 /* keep text white */
        }

        /* ---- toggle links ---- */
        .form-toggle-text { text-align: center; margin-top: 15px; }
        .form-toggle-text a { font-weight: bold; color: #0073aa; text-decoration: none; }

        /* ---- responsive adjustments ---- */
        @media (max-width: 480px) {
            .woocommerce-account .checkout-login,
            .woocommerce-account .my-account-signup {
                width: 95%;          /* almost full width on small screens */
                padding: 0 10px;     /* add small padding on edges */
            }
        }
    ');

    /* ----------  JS flip (unchanged) ---------- */
    wp_add_inline_script('jquery-core', '
        jQuery(function($){
            const $login  = $(".checkout-login");
            const $reg    = $(".my-account-signup");
            $login.show(); $reg.hide();
            $(document).on("click", "#show-register", function(e){
                e.preventDefault(); $login.hide(); $reg.show();
            });
            $(document).on("click", "#show-login",  function(e){
                e.preventDefault(); $reg.hide();  $login.show();
            });
        });
    ');

    // Enqueue Transfer Manager Globally (needed for Upscaler to receive files)
    wp_enqueue_script('transfer-manager', get_stylesheet_directory_uri() . '/transfer-manager.js', array(), '1.2', true);
});

/* ----------  toggle links ---------- */
add_action('woocommerce_login_form_end', function () {
    echo '<p class="form-toggle-text">Don\'t have an account? <a href="#" id="show-register">Register here</a>.</p>';
});
add_action('woocommerce_register_form_end', function () {
    echo '<p class="form-toggle-text">Already have an account? <a href="#" id="show-login">Login here</a>.</p>';
});


/* ----------  Limit one Prodcut/Plan in WC Cart ---------- */
add_filter('woocommerce_add_to_cart_validation', 'upscaleimg_remove_cart_item_before_add_to_cart', 20, 3);
function upscaleimg_remove_cart_item_before_add_to_cart($passed, $product_id, $quantity)
{
    if (!WC()->cart->is_empty()) {
        WC()->cart->empty_cart();
    }
    return $passed;
}




/**
 * Determine User Upload Limit based on Plan
 * Guest: 1
 * Free (Logged In): 8
 * Basic (Product 5509): 40
 * Pro (Product 5507): 80
 */
function upscaleimg_get_user_upload_limit()
{
    if (!is_user_logged_in()) {
        return 1; // Guests
    }

    $user_id = get_current_user_id();

    // Check for Pro Plan (5507) - Limit 80
    if (upscaleimg_has_active_plan($user_id, 5507)) {
        return 80;
    }

    // Check for Basic Plan (5509) - Limit 40
    if (upscaleimg_has_active_plan($user_id, 5509)) {
        return 40;
    }

    // Default Free Logged In - Limit 8
    return 8;
}

/**
 * Helper to check if user has active subscription to product
 */
function upscaleimg_has_active_plan($user_id, $product_id)
{
    if (function_exists('wcs_user_has_subscription')) {
        return wcs_user_has_subscription($user_id, $product_id, 'active');
    }
    // Fallback: Check if they bought it (Lifetime access?) or manually added capability
    // For now, assume WCS is the main method, or return false to fallback to Free.
    return false;
}

// Include External Uploader Shortcode
require_once get_stylesheet_directory() . '/shortcode-uploader.php';