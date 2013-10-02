'use strict';

var _fs = require('fs-extra');
var _path = require('path');
var _uglify = require('uglify-js');

var actionTypes = {
    'importFiles': function (origin, destination, action) {
        console.log('import files');
        for (var j = 0, jmax = action.files.length; j < jmax; j++) {
            for (var k = 0, kmax = action.files[j].length; k < kmax; k++) {
                var file = action.files[j][k];
                console.log('copying [' + file + ']');
                var from = _path.resolve(origin, file);
                var to = _path.resolve(destination, file);
                _fs.mkdirsSync(_path.dirname(to));
                _fs.writeFileSync(to, _fs.readFileSync(from));
            }
        }
    },
    'importDirectories': function (origin, destination, action) {
        console.log('import directories');
        for (var j = 0, jmax = action.directories.length; j < jmax; j++) {
            var directory = action.directories[j];
            console.log('copying [' + directory + ']');
            var from = _path.resolve(origin, directory);
            var to = _path.resolve(destination, directory);
            // TODO: use sync when it exists (no after copy file change).
            _fs.copy(from, to);
        }
    },
    'replacePattern': function (origin, destination, action) {
        console.log('replace pattern [' + action.pattern + ']');
        for (var j = 0, jmax = action.files.length; j < jmax; j++) {
            var path = _path.resolve(destination, action.files[j]);
            _fs.writeFileSync(path, _fs.readFileSync(path, {encoding: 'utf8'}).replace(action.pattern, action.value), {encoding: 'utf8'});
        }
    },
    'minifyFiles': function (origin, destination, action) {
        console.log('minify files');
        var files = [];
        for (var j = 0, jmax = action.files.length; j < jmax; j++) {
            for (var k = 0, kmax = action.files[j].length; k < kmax; k++) {
                files.push(_path.resolve(origin, action.files[j][k]));
            }
        }
        _fs.writeFileSync(
            destination,
            _uglify.minify(files).code,
            {encoding: 'utf8'}
        );
    },
    'emptyDirectory': function (origin, destination, action) {
        var files = _fs.readdirSync(_path.resolve(__dirname, action.directory));
        for (var j = 0, jmax = files.length; j < jmax; j++) {
            var file = files[j];
            console.log('deleting [' + file + ']');
            _fs.unlinkSync(_path.resolve(destination, action.directory, file));
        }
    },
    'createDirectory': function (origin, destination, action) {
        console.log('creating [' + action.directory + ']');
        _fs.mkdirsSync(_path.resolve(destination, action.directory));
    },
};

function process(origin, destination, actions) {
    console.log(actions.length + ' actions found');
    for (var i = 0, imax = actions.length; i < imax; i++) {
        actionTypes[actions[i].type](origin, destination, actions[i]);
    }
}

function generateScriptTags(lists) {
    var tags = [];
    for (var j = 0, jmax = lists.length; j < jmax; j++) {
        for (var k = 0, kmax = lists[j].length; k < kmax; k++) {
            tags.push('<script type="text/javascript" src="' + _path.basename(lists[j][k]) + '"></script>');
        }
    }
    return tags.join('\n        ');
}

exports.generateScriptTags = generateScriptTags;
exports.process = process;
