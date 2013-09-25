'use strict';

var _util = require('util');

var NodeError = function (name, message) {
    Error.captureStackTrace(this, this);
    this.name = name;
    this.message = message;
};
_util.inherits(NodeError, Error);

exports.Error = NodeError;
