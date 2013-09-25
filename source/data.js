'use strict';

var _util = require('util');
var _http = require('http');
var _logger = require('winston');
var _config = require('./config');
var _errors = require('./errors');

// http://www.elasticsearch.org/guide/

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function postSearch(type, data, callback) {
    sendRequest({method: 'POST', path: '/' + type + '/_search'}, data, callback);
}

function sendRequest(options, data, callback) {
    options.hostname = _config.elasticSearch.host;
    options.port = _config.elasticSearch.port;
    options.path = '/' + _config.elasticSearch.index + options.path;
    var req = _http.request(options, function (response) {
        var content = '';
        response.on('data', function (chunk) {
            content += chunk;
        });
        response.on('end', function (chunk) {
            callback(null, JSON.parse(content));
        });
    }).on('error', function (error) {
        callback(error);
    });
    if (data) {
        req.write(JSON.stringify(data));
    }
    req.end();
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function round2(n) {
    return Math.round(n * 100) / 100;
}

// Retourne une date en chaîne au format yyyyMMddHHmm.
function dateToString(date) {
    return '' + date.getFullYear() + pad(date.getMonth(), 2) + pad(date.getDate(), 2) + pad(date.getHours(), 2) + pad(date.getMinutes(), 2);
}

function pad(str, n, c) {
    str += '';
    while (str.length < n) {
        str = (c || '0') + str;
    }
    return str;
};

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

/*
function makeFilter(date) {

    var filter = [];

    // TODO: remettre la date du jour.
    var now = new Date(2013, 09, 20, 14, 38, 49);

    filter.push({
        range: {
            'DCREATION': {
                from: dateToString(new Date(now.getFullYear(), now.getMonth(), now.getDate())),
                to: dateToString(now),
                include_lower: true,
                include_upper: false
            }
        }
    });

    for (var i = 0, imax = arguments.length; i < imax; i++) {
        for (var option in arguments[i]) {
            var p = {};
            p[option] = arguments[i][option];
            filter.push({term: p);
        }
    }
    if (filter.length > 1) {
        filter = {and: filter};
    }
    return filter;
}
*/

function getIndicateursValues(date, callback) {

    var dateFilter = {
        range: {
            'DCREATION': {
                from: dateToString(new Date(date.getFullYear(), date.getMonth(), date.getDate())),
                to: dateToString(date),
                include_lower: true,
                include_upper: false
            }
        }
    };

    var data = {
        size: 0,
        filter: {},
        facets: {
            'global': {
                facet_filter: {and: [dateFilter]},
                statistical: {field: 'PVTOTAL'}
            },
            'acc': {
                facet_filter: {and: [dateFilter, {term: {'CTYPENT': 'co'}}]},
                statistical: {field: 'PVTOTAL'}
            },
            'serv': {
                facet_filter: {and: [dateFilter, {term: {'CTYPENT': 'se'}}]},
                statistical: {field: 'PVTOTAL'}
            },
            'oa': {
                facet_filter: {and: [dateFilter, {term: {'CTYPENT': 'co'}}]},
                statistical: {field: 'PVTOTAL'}
            },
            'rem': {
                facet_filter: {and: [dateFilter, {term: {'CTYPENT': 're'}}]},
                statistical: {field: 'PVTOTAL'}
            },
        }
    };

    _logger.info('Requête EslasticeSearch : ' + _util.inspect(data, {depth: null}));
    postSearch('lv', data, function (error, result) {
        if (error || result.error) {
            callback(error || new _errors.Error('ElasticSearchError', result.error));
        } else {
            _logger.info('Réponse EslasticeSearch : ' + _util.inspect(result, {depth: null}));
            callback(null, result);
        }
    });
}

function getIndicateurs(options, callback) {

    // TODO: remettre la date du jour.
    var today = new Date(2013, 09, 20, 14, 38, 49);
    var lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    getIndicateursValues(today, function (error, result2) {
        if (error) {
            callback(error);
        } else {
            getIndicateursValues(lastYear, function (error, result1) {
                if (error) {
                    callback(error);
                } else {
                    var o = {};
                    for (var facet in result1.facets) {
                        o[facet] = {
                            val1: round2(result1.facets[facet].total),
                            val2: round2(result2.facets[facet].total)
                        };
                        o[facet].evol = ((o[facet].val2 - o[facet].val1) / o[facet].val1) * 100;
                    }
                    callback(null, o);
                }
            });
        }
    });
}

function getSynthese(options, callback) {

    // http://www.elasticsearch.org/guide/reference/api/search/facets/terms-stats-facet/

    var data = {
        size: 0,
        facets: {
            'produits': {
                facet_filter: makeFilter(options),
                terms_stats: {
                    //size: 10,
                    key_field: {'PRD': 'produit', 'ORG': 'lieu'}[options.type],
                    value_field: 'pvtotal',
                    order: 'total'
                }
            }
        }
    };

    postSearch('ldv', data, function (error, result) {
        if (error || result.error) {
            callback(error || new _errors.Error('ElasticSearchError', result.error));
        } else {
            _logger.info(_util.inspect(result));

            var a = result.facets['ca'].terms;
            var imax = a.length;
            var o = new Array(imax);
            for (var i = 0; i < imax; i++) {
                o.push({name: a[i].term, value: round2(a[i].total)});
            }

            callback(null, o);
        }
    });
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

exports.getIndicateurs = getIndicateurs;

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
