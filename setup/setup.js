'use strict';

var _path = require('path');
var _build = require('./build.js');

var files = {
    jsServer: [
        'server.js',
        'config.js',
        'errors.js',
        'routing.js',
        'data.js',
        'ldap.js'
    ],
    jsShared: [
    ],
    jsClient: [
        'static/darty.wynn.js',
        'static/darty.wynn.data.js',
        'static/darty.wynn.gui.js',
    ],
    templates: [
        'templates/accueil.html',
        'templates/details.html',
    ],
    jsBase: [
        // http://jquery.com/
        'static/jquery-1.10.1.js',
        // https://github.com/olado/doT
        'static/doT.js'
    ],
    misc: [
        'static/favicon.ico',
        'static/default.css'
    ],
    setup: [
        'package.json',
    ]
};

var actions = {
    dev: [
        {type: 'importFiles', files: [files.jsBase, files.jsShared, files.jsServer, files.jsShared, files.jsClient, files.setup, files.templates, files.misc]},
        {type: 'importDirectories', directories: ['static/images']},
        {type: 'importDirectories', directories: ['static/styles']},
        {type: 'replacePattern', pattern: /\\{\\{/g, value: '<%', files: ['static/doT.js']},
        {type: 'replacePattern', pattern: /\\}\\}/g, value: '%>', files: ['static/doT.js']},
        {type: 'replacePattern', pattern: /@@scripts@@/g, value: _build.generateScriptTags([files.jsClient]), files: files.templates},
        {type: 'createDirectory', directory: 'logs'},
    ],
    prd: [
        {type: 'importFiles', files: [files.jsBase, files.jsShared, files.jsServer, files.setup, files.templates, files.misc]},
        {type: 'importDirectories', directories: ['static/images']},
        {type: 'importDirectories', directories: ['static/styles']},
        {type: 'minifyFiles', files: [files.jsShared, files.jsClient], destination: 'static/darty.win.min.js'},
        {type: 'replacePattern', pattern: /\\{\\{/g, value: '<%', files: ['static/doT.js']},
        {type: 'replacePattern', pattern: /\\}\\}/g, value: '%>', files: ['static/doT.js']},
        {type: 'replacePattern', pattern: /@@scripts@@/g, value: 'darty.wynn.min.js', files: files.templates},
        {type: 'createDirectory', directory: 'logs'},
    ]
};

var origin = process.argv[2];
var destination = process.argv[3];
var env = process.argv[4];

console.log('environement is [' + env + ']');

_build.process(origin, destination, actions[env]);
