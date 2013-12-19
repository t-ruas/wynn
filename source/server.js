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
			_logger.info(error);
            callback(error);
        } else {
            context.authCookie = result;
            var cookies = new _cookies(context.request, context.response, _config.keys);
            cookies.set(_config.authCookieName, JSON.stringify(context.authCookie), {signed: true});
            callback();
        }
    });
}

// Détruit le cookie lors de la déconnexion
function logout(context) {
    var cookies = new _cookies(context.request, context.response, _config.keys);
    cookies.set(_config.authCookieName, null);
}
// créé un cookie lors de la connexion
function authorize(context) {
    var cookies = new _cookies(context.request, context.response, _config.keys);
    var cookie = cookies.get(_config.authCookieName, {signed: true});
    if (cookie) {
        context.authCookie = JSON.parse(cookie);
        return true;
    }
}

// retourne true ou la page de log, si l'on est pas logué ! 
function authorizeOrRedirect(context, callback) {
    if (!authorize(context)) {
        callback(null, {redirect: 'login'});
    } else {
        return true;
    }
}

// retourne true si c'est autorisé, 403 si l'utilisateur n'a pas accès
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
            pattern: /^\/status$/i, // pour vérifier si ES et node sont bien actifs ! 
            handler: function (context, callback) {
				getPingEs(context, callback);
            }
        },{
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
            pattern: /^\/logout$/i,
            handler: function (context, callback) {
                logout(context);
                callback(null, {redirect: 'login'});
            }
        },
        {
            pattern: /^\/login$/i,
            handler: function (context, callback) {
                callback(null, {file: 'login.html'});
            }
        },
        {
            pattern: /^\/accueil$/i,
            handler: function (context, callback) {
                if (authorizeOrRedirect(context, callback)) {
					// console.log('CONTEXT : ');
					// console.log(context);
                    getRefData(context, function (error, result) {
                        if (error) {
                            callback(error);
                        } else {
                            callback(error, {file: 'accueil.html', fileData: result});
                        }
                    });
                }
            }
        },
        {			
			// on envoie la page avec quelques informations dans le result.
			pattern: /^\/details$/i,
            handler: function (context, callback) {
                if (authorizeOrRedirect(context, callback)) {
                    // on récupère les données qui seront necessaire à la conception de la page (données envoyées avec le template)
						
						getRefData(context, function (error, result) {
                        if (error) {
                            callback(error);
                        } else {
							//_logger.info('2 Réponse dans RefData : ' + _util.inspect(result, {depth: null}));
                            callback(error, {file: 'details.html', fileData: result});
                        }
                    });
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
            pattern: /^\/login$/i,
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
            pattern: /^\/service\/indicateursEnt$/i,
            handler: function (context, callback) {
                if (authorizeOrFail(context, callback)) {
                    _data.getIndicatorsEnt(context.content, function (error, result) {
                        callback(error, {data: result});
                    });
                }
            }
        },
        
        {
            pattern: /^\/service\/indicateurs$/i,
            handler: function (context, callback) {
                if (authorizeOrFail(context, callback)) {
                    _data.getIndicators(context.content, function (error, result) {
						console.log('result : ');
						console.log(result);
                        callback(error, {data: result});
                    });
                }
            }
        },
        {
            pattern: /^\/service\/details$/i,
            handler: function (context, callback) {
                if (authorizeOrFail(context, callback)) {
                    _data.getDetails(context.content, function (error, result) {
                        callback(error, {data: result});
                    });
                }
            }
        }
    ]
};

// Récupération des données de référentiels déposées sur les pages: 
// filtres, budget, ordre.
function getRefData(context, callback) {  	
    var data = {};
    _data.getFilterText(context.path.query, function (error, result) {
    	
        if (error) {
            callback(error);
        } else {
        	/*_logger.info('2 Réponse dans RefData : ' + _util.inspect(result, {depth: null}));*/
			// ajout des filtres
            data.filtres = result;
				_data.getBudget(function (error, result) {
                if (error) {
                    callback(error);
                } else {
					// ajout des budget
                    data.budget = result;
					// console.log('DATA_BUDGET LOADING ! >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
					// console.log(result);
                    callback(error, data);
                }
            });
        }
    });
}
function getPingEs(context, callback){ 
	_data.getES(context, callback)
};

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

new _routing.start(routes);

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
