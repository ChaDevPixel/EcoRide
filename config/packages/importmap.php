<?php

/**
 * Returns the importmap for this application.
 *
 * This file is processed by Symfony's AssetMapper component.
 * The top-level key "imports" is automatically added.
 *
 * - "path" is a path inside the asset mapper system. Use the
 * "debug:asset-map" command to see the full list of paths.
 *
 * - "entrypoint" (JavaScript only) set to true for any module that will
 * be used as an "entrypoint" (and passed to the importmap() Twig function).
 *
 * The "importmap:require" command can be used to add new entries to this file.
 */
return [ 
    'app' => [
        'path' => 'assets/app.js',
        'entrypoint' => true,
    ],
    '@hotwired/stimulus' => [
        'version' => '3.2.2',
        'type' => 'js', 
    ],
    '@symfony/stimulus-bridge' => [
        'path' => 'vendor/symfony/stimulus-bundle/assets/dist/loader.js',
        'type' => 'js',
    ],
    '@hotwired/turbo' => [
        'version' => '7.3.0',
        'type' => 'js', 
    ],
    'controllers/' => [
        'path' => 'assets/controllers/',
        'type' => 'module',
    ],
    'bootstrap' => [
        'version' => '5.3.3',
        'type' => 'js', 
    ],
    'bootstrap/dist/css/bootstrap.min.css' => [
        'version' => '5.3.3',
        'type' => 'css',
    ],
    'bootstrap-icons/font/bootstrap-icons.css' => [
        'version' => '1.11.3',
        'url' => 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
        'type' => 'css',
    ],
    'styles/main.scss' => [
        'path' => 'assets/styles/main.scss',
        'type' => 'css',
    ],
    'chart.js' => [
        'version' => '4.4.2',
        'url' => 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.min.js',
        'type' => 'js', 
    ]
];