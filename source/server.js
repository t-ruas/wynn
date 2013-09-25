'use strict';

var _logger = require('winston');
var _moment = require('moment');
var _crypto = require('crypto');
var _fs = require('fs');
var _path = require('path');
var _util = require('util');
var _http = require('http');
var _cookies = require('cookies');
var _routing = require('./routing.js');
var _ldap = require('./ldap.js');
var _data = require('./data.js');
var _config = require('./config.js');

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

_logger.remove(_logger.transports.Console);
_logger.add(_logger.transports.Console, {timestamp: function () { return _moment().format('HH:mm:ss'); }, colorize: true});
_logger.add(_logger.transports.File, {filename: _path.resolve(__dirname, 'logs', _moment().format('YYYYMMDD') + '.log')});

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

process.addListener('uncaughtException', function (error) {
        _logger.error(error.stack);
    }
);

process.addListener('exit', function () {
        _logger.info('Node closed.');
    }
);

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function login(context, callback) {
    _ldap.validate(context.content.username, context.content.password, function (error, result) {
        if (error) {
            callback(error);
        } else {
            context.authCookie = result;
            var cookies = new _cookies(context.request, context.response, _config.keys);
            cookies.set(_config.authCookieName, JSON.stringify(context.authCookie), {signed: true});
            callback();
        }
    });
}

function logout(context) {
    var cookies = new _cookies(context.request, context.response, _config.keys);
    cookies.set(_config.authCookieName, null);
}

function authorize(context) {
    var cookies = new _cookies(context.request, context.response, _config.keys);
    var cookie = cookies.get(_config.authCookieName, {signed: true});
    if (cookie) {
        context.authCookie = JSON.parse(cookie);
        return true;
    }
}

function authorizeOrRedirect(context, callback) {
    if (!authorize(context)) {
        callback(null, {redirect: 'login'});
    } else {
        return true;
    }
}

function authorizeOrFail(context, callback) {
    if (!authorize(context)) {
        callback(null, {status: 403});
    } else {
        return true;
    }
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

var routes = {
    'GET': [
        {
            pattern: /^\/?$/i,
            handler: function (context, callback) {
                if (authorize(context)) {
                    callback(null, {redirect: 'accueil'});
                } else {
                    callback(null, {redirect: 'login'});
                }
            }
        },
        {
            pattern: /^\/logout/i,
            handler: function (context, callback) {
                logout(context);
                callback(null, {redirect: 'login'});
            }
        },
        {
            pattern: /^\/login/i,
            handler: function (context, callback) {
                callback(null, {file: 'login.html'});
            }
        },
        {
            pattern: /^\/accueil/i,
            handler: function (context, callback) {
                if (authorizeOrRedirect(context, callback)) {
                    callback(null, {file: 'accueil.html'});
                }
            }
        },
        {
            pattern: /^\/logs$/i,
            handler: function (context, callback) {
                _logger.query(
                    null,
                    function (error, results) {
                        if (error) {
                            callback(error);
                        } else {
                            callback(null, results);
                        }
                    }
                );
            }
        },
    ],
    'POST': [
        {
            pattern: /^\/login/i,
            handler: function (context, callback) {
                login(context, function (error) {
                    if (error) {
                        if (error.name === 'AuthenticationError') {
                            callback(null, {file: 'login.html', fileData: {message: 'Nom ou mot de passe invalide.'}});
                        } else {
                            callback(error);
                        }
                    } else {
                        callback(null, {redirect: 'accueil'});
                    }
                });
            }
        },
        {
            pattern: /^\/service\/ca/i,
            handler: function (context, callback) {
                if (authorizeOrFail(context, callback)) {
                    _data.getIndicateurs(context.content, function (error, result) {
                        callback(error, {data: result});
                    });
                }
            }
        },
        {
            pattern: /^\/service\/synthese-prd/i,
            handler: function () {
                if (authorizeOrFail(context, callback)) {
                    context.content.type = 'PRD';
                    _data.getSynthese(context.content, function (error, result) {
                        callback(error, {data: result});
                    });
                }
            }
        },
        {
            pattern: /^\/service\/synthese-org/i,
            handler: function () {
                if (authorizeOrFail(context, callback)) {
                    context.content.type = 'ORG';
                    _data.getSynthese(context.content, function (error, result) {
                        callback(error, {data: result});
                    });
                }
            }
        },
    ]
};

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

new _routing.start(routes);

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
