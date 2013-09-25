'use strict';

var _errors = require('./errors');

function validate(name, pass, callback) {
    if (name === 'aaa' && pass === 'aaa') {
        callback(null, {nom: name, type: 0});
    } else {
        callback(new _errors.Error('AuthenticationError'));
    }
}

exports.validate = validate;
