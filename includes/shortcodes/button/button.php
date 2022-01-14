<?php

function _themename_button($atts = [], $content = null){
    extract(shortcode_atts([
        'color' => 'red',
        'text' => 'text'
    ], $atts));

    return '<button class="_themename_button style="background-color: ' . esc_attr($color) . '">' .  esc_html($content) . '</button>';
}

add_shortcode( '_themename_button', '_themename_button' );