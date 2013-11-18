'use strict';

var _http = require('http');
var _url = require('url');
var _util = require('util');
var _path = require('path');
var _fs = require('fs');
var _querystring = require('querystring');
var _uuid = require('node-uuid');
var _logger = require('winston');
var _static = require('node-static');
var _dot = require('dot');
var _config = require('./config');

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

// Configure DoT pour ne pas supprimer les retours à la ligne du html.
_dot.templateSettings.strip = false;

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

var fileServer;
var routes;

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function start(r) { // lancement du serveur Node ! 
    routes = r;
    fileServer = new _static.Server(_config.staticRoot, {cache: false});
    _http.createServer(handleRequest).listen(_config.port);
}

function handleRequest(request, response) {
    var context = {
        id: _uuid.v4(),
        request: request,
        response: response,
        path: _url.parse(request.url, true),
        client: (request.headers['x-forwarded-for'] || '').split(',')[0] || request.connection.remoteAddress,
        body: ''
    };
    _logger.info(context.request.method + ' ' + context.path.pathname);
    request.addListener('data', function (chunk) {
            context.body += chunk;
        }
    );
    request.addListener('end', function () {
			// console.log('routing.js return on End ;)')
            if (context.body.length) {
                context.content = (function (ct) {
                    if (!ct.indexOf('application/json')) {
                        return JSON.parse(context.body);
                    } else if (!ct.indexOf('application/x-www-form-urlencoded')) {
                        return _querystring.parse(context.body);
                    }
                })(context.request.headers['content-type']);
            }
            var methodRoutes = routes[context.request.method]; // dispose des pattern de routes
            for (var i = 0, imax = methodRoutes.length; i < imax; i++) { // on fait le tour des différentes routes disponibles 
                var route = methodRoutes[i];
                //_logger.info(_util.inspect(route));
                var matches = route.pattern.exec(context.path.pathname);
                if (matches) { // si c'est la bonne route 
                    for (var j = 1; j < matches.length; j++) {
                        if (!isNaN(matches[j])) {	
                            matches[j] = parseInt(matches[j]);
                        }
                    }
                    matches.splice(0, 1, context, function (error, result) {
                            if (error) { // si erreur, Code 500 ! (web services unavailable)
                                _logger.error(error.stack);
                                context.response.statusCode = 500;
                                context.response.end();
                            } else {
                                if (result.data) { // si ok, code 200 + data
                                    context.response.statusCode = result.status || 200;
                                    context.response.setHeader('content-type', 'application/json');
                                    context.response.end(JSON.stringify(result.data));
                                } else if (result.file) { // si ok mais file (?)
                                    context.response.statusCode = result.status || 200;
                                    context.response.setHeader('content-type', 'text/html');
                                    var s = _fs.createReadStream(_path.resolve('templates', result.file));
                                    var txt = '';
                                    s.on('data', function (data) {
                                        txt += data;
                                    });
                                    s.on('end', function () {
                                        context.response.end(_dot.template(txt)(result.fileData || {}));
                                    });
                                } else if (result.redirect) { // si jamais le résultat demande un redirect
                                    context.response.writeHead(301, {'Location': result.redirect});
                                    context.response.end();
                                } else {
                                    context.response.statusCode = result.status || 200;
                                    context.response.end();
                                }
                            }
                        }
                    );
                    route.handler.apply(this, matches);
                    return;
                }
            }
            if (context.request.method === 'GET') { // si la méthode demandée est get , on fournit la demande, sauf si inaccessible 
                fileServer.serve(context.request, context.response, function (error, result) {
                    if (error) {
                        notFound(context);
                    }
                });
            } else {
                notFound(context);
            }
        }
    );
}

function notFound(context) {
    _logger.error('Not found');
    context.response.statusCode = 404;
    context.response.end();
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

exports.start = start;

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
