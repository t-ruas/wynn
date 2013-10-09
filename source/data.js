'use strict';

var _util = require('util');
var _http = require('http');
var _logger = require('winston');
var _moment = require('moment');
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
        response.on('end', function () {
            var result = JSON.parse(content);
            if (result.error) {
                callback(new _errors.Error('ElasticSearchError', result.error));
            } else {
                _logger.info('Réponse EslasticeSearch : ' + _util.inspect(result, {depth: null}));
                callback(null, result);
            }
        });
    }).on('error', function (error) {
        callback(error);
    });
    if (data) {
        _logger.info('Requête EslasticeSearch : ' + _util.inspect(data, {depth: null}));
        req.write(JSON.stringify(data));
    }
    req.end();
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\ pour récupérer les entrées, a merger avec les précédentes
function postSearchEnt(type, data, callback) {
	_logger.info("recherche entree : " + data);
    sendRequestEnt({method: 'POST', path: '/' + type + '/_search'}, data, callback);
}

function sendRequestEnt(options, data, callback) {
    options.hostname = _config.elasticSearch.host;
    options.port = _config.elasticSearch.port;
    options.path = '/' + _config.elasticSearch.indexEnt + options.path;
    var req = _http.request(options, function (response) {
        var content = '';
        response.on('data', function (chunk) {
            content += chunk;
        });
        response.on('end', function () {
            var result = JSON.parse(content);
            if (result.error) {
                callback(new _errors.Error('ElasticSearchError', result.error));
            } else {
                _logger.info('Réponse EslasticeSearch : ' + _util.inspect(result, {depth: null}));
                callback(null, result);
            }
        });
    }).on('error', function (error) {
        callback(error);
    });
    if (data) {
        _logger.info('Requête EslasticeSearch : ' + _util.inspect(data, {depth: null}));
        req.write(JSON.stringify(data));
    }
    req.end();
}


//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function round2(n) {
    return Math.round(n * 100) / 100;
}

function dateToString(date) {
    return _moment().format('YYYYMMDDHHmm');
}

function makeDateFilter(date) {
    // TODO: retirer.
    return {};
    return {
        range: {
            'DATE': {
                from: dateToString(new Date(date.getFullYear(), date.getMonth(), date.getDate())),
                to: dateToString(date),
                include_lower: true,
                include_upper: false
            }
        }
    };
}

function getBudget(callback) {
    callback(null, {ca: 10, vtPartAcc: 15, vtPartServ: 15, vtPartOa: 15, vtPartRem: 15});
}

function prepareDateFilters() {

    var dates = new Array(3);

    // TODO: remettre la date du jour.
    dates[0] = new Date(2013, 09, 23, 14, 38, 49);
    dates[1] = new Date(dates[0]);
    dates[1].setMinutes(dates[1].getMinutes() - 2);
    dates[2] = new Date(dates[1]);
    dates[2].setFullYear(dates[2].getFullYear() - 1);

    for (var i = 0; i < 3; i++) {
        dates[i] = makeDateFilter(dates[i]);
    }

    return dates;
}

var filterFields = {

    // On ignore le premier niveau (couleur).
    'prd1': {cd: 'CPROD1', lib: 'LPROD1'},
    'prd2': {cd: 'CPROD2', lib: 'LPROD2'},
    'prd3': {cd: 'CPROD3', lib: 'LPROD3'},
    'prd4': {cd: 'CPROD4', lib: 'LPROD4'},
    'prd5': {cd: 'CPROD5', lib: 'LPROD5'},
    'prd6': {cd: 'CPRODUIT', lib: 'LPRODUIT'},

    'org1': {cd: 'CORG0', lib: 'LORG0'},
    'org2': {cd: 'CORG1', lib: 'LORG1'},
    'org3': {cd: 'CORG2', lib: 'LORG2'},
    'org4': {cd: 'CVENDEUR', lib: 'LVENDEUR'},
};

// Prépare les filtres ElasticSearch à partir des options de navigation org et prd.
function makeNavFilters(options, prefix) {
    var filters = [];
    for (var n in filterFields) {
        if (n in options && n.slice(0, 3) === prefix) {
            var o = {};
            o[filterFields[n].cd] = options[n].toLowerCase();
            filters.push({term: o});
        }
    }
    return filters;
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

// Traduit {prd1: 'CD1'} en {prd1: {cd: 'CD1', lib: 'LB1'}}.
function getFilterText(options, callback) {
    var o = {};
    var cancel = false;
    var i = 0;
    for (var m in options) {
        (function (n) {
            if (n in filterFields) {
                i++;
                getLib(filterFields[n], options[n], function (error, result) {
                    // En cas d'erreur sur un des codes, on sort en erreur et ignore tous les autres retours.
                    if (error) {
                        callback(error);
                        cancel = true;
                    }
                    if (!cancel) {
                        o[n] = {cd: options[n], lib: result};
                        if (!--i) {
                            callback(null, o);
                        }
                    }
                });
            } else {
                o[n] = options[n];
            }
        })(m);
    }
    if (!i) {
        callback(null, o);
    }
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

var libCache = {};

// Récupère un libellé en allant chercher la première ligne qui l'utilise.
function getLib(field, code, callback) {

    if (!libCache[field.cd]) {
        libCache[field.cd] = {};
    }

    if (code in libCache[field.cd]) {
        callback(null, libCache[field.cd][code]);
    } else {
        var f = {};
        f[field.cd] = code;

        var data = {
            size: 1,
            fields: [field.cd, field.lib],
            filter: {term: f}
        };

        postSearch('lv', data, function (error, result) {
            if (error) {
                callback(error);
            } else {
                if (result.hits.hits.length) {
                    libCache[field.cd][code] = result.hits.hits[0].fields[field.lib];
                    callback(null, libCache[field.cd][code]);
                } else {
                    callback(new _errors.Error('NotFoundError'));
                }
            }
        });

    }
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function getIndicators(options, callback) {

    var fDates = prepareDateFilters();
    var fAcc = {term: {'FLAGPM': 'acc'}};
    var fServ = {term: {'FLAGTYPART': 'p'}};
    var fOa = {term: {'FLAGOA': 'oa'}};
    var fRem = {term: {'FLAGREM': 'rem'}};

    var fVt = {field: 'NVENTE'};
    var fCa = {field: 'PVTOTAL'};

    var fPrd = makeNavFilters(options, 'prd');
    var fOrg = makeNavFilters(options, 'org');

    var data = {
        size: 0,
        facets: {
            'ca': {facet_filter: {and: [fDates[0]].concat(fPrd).concat(fOrg)}, statistical: fCa},
            'ca_1y': {facet_filter: {and: [fDates[2]].concat(fPrd).concat(fOrg)}, statistical: fCa},
            'ca_2m': {facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, statistical: fCa},
            'ca_global_1y': {facet_filter: {and: [fDates[2]].concat(fPrd)}, statistical: fCa},
            'ca_global_2m': {facet_filter: {and: [fDates[1]].concat(fPrd)}, statistical: fCa},
            'vt_acc_1y': {facet_filter: {and: [fDates[2], fAcc].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_acc_2m': {facet_filter: {and: [fDates[1], fAcc].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_acc_global_2m': {facet_filter: {and: [fDates[1], fAcc].concat(fPrd)}, terms: fVt},
            'vt_serv_1y': {facet_filter: {and: [fDates[2], fServ].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_serv_2m': {facet_filter: {and: [fDates[1], fServ].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_serv_global_2m': {facet_filter: {and: [fDates[1], fServ].concat(fPrd)}, terms: fVt},
            'vt_oa_1y': {facet_filter: {and: [fDates[2], fOa].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_oa_2m': {facet_filter: {and: [fDates[1], fOa].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_oa_global_2m': {facet_filter: {and: [fDates[1], fOa].concat(fPrd)}, terms: fVt},
            'ca_rem_1y': {facet_filter: {and: [fDates[2], fRem].concat(fPrd).concat(fOrg)}, terms: fCa},
            'ca_rem_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd).concat(fOrg)}, terms: fCa},
            'ca_rem_global_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd)}, terms: fCa},
            'vt_1y': {facet_filter: {and: [fDates[2]].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_2m': {facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_global_1y': {facet_filter: {and: [fDates[2]].concat(fPrd)}, terms: fVt},
            'vt_global_2m': {facet_filter: {and: [fDates[1]].concat(fPrd)}, terms: fVt}
        }
    };

    postSearch('lv', data, function (error, result) {
        if (error) {
            callback(error);
        } else {

            var getCaFacet = function (name) {
                return result.facets[name].total;
            }

            var getVtFacet = function (name) {
                return result.facets[name].terms.length;
            }

            callback(null, {
                ca: getCaFacet('ca'),
                ca2m: getCaFacet('ca_2m'),
                ca1y: getCaFacet('ca_1y'),
                caGlobal1y: getCaFacet('ca_global_1y'),
                caGlobal2m: getCaFacet('ca_global_2m'),
                vt2m: getVtFacet('vt_2m'),
                vt1y: getVtFacet('vt_1y'),
                vtGlobal1y: getVtFacet('vt_global_1y'),
                vtGlobal2m: getVtFacet('vt_global_2m'),
                vtAcc1y: getVtFacet('vt_acc_1y'),
                vtAcc2m: getVtFacet('vt_acc_2m'),
                vtAccGlobal2m: getVtFacet('vt_acc_global_2m'),
                vtServ1y: getVtFacet('vt_serv_1y'),
                vtServ2m: getVtFacet('vt_serv_2m'),
                vtServGlobal2m: getVtFacet('vt_serv_global_2m'),
                vtOa1y: getVtFacet('vt_oa_1y'),
                vtOa2m: getVtFacet('vt_oa_2m'),
                vtOaGlobal2m: getVtFacet('vt_oa_global_2m'),
                caRem1y: getCaFacet('ca_rem_1y'),
                caRem2m: getCaFacet('ca_rem_2m'),
                caRemGlobal2m: getCaFacet('ca_rem_global_2m'),
                // TODO
                ent2m: 15,
                ent1y: 10,
            });
        }
    });
}

function getIndicatorsEnt(options, callback) {

    var fDates = prepareDateFilters();
    var fEnt = {field: 'QENTREE'};
    var fOrg = makeNavFilters(options, 'org');

    var data = {
        size: 0,
        facets: {
            'ent_2m': {facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, statistical: fEnt},
            'ent_1y': {facet_filter: {and: [fDates[2]].concat(fPrd).concat(fOrg)}, statistical: fEnt}
        }
    };

    postSearchEnt('entrees', data, function (error, result) {
        if (error) {
            callback(error);
        } else {

            var getEntFacet = function (name) {
                return result.facets[name].total;
            }

            callback(null, {
                ent2m: getEntFacet('ent_2m') ,
                ent1y: getEntFacet('ent_1y'),
            });
        }
    });
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function getDetails(options, callback) {

    var aggField = filterFields[options.agg];

    var fDates = prepareDateFilters();
    var fAcc = {term: {'FLAGPM': 'acc'}};
    var fServ = {term: {'FLAGTYPART': 'p'}};
    var fOa = {term: {'FLAGOA': 'oa'}};
    var fRem = {term: {'FLAGREM': 'rem'}};

    var fLib = {
        field: aggField.cd,
        script: 'term + ";" + _source.' + aggField.lib
    };

    // on concatène le numéro de vente avec l'axe d'aggrégation pour avoir un count de ventes et non de lignes.
    var fVt = {
        field: aggField.cd,
        script: 'term + ";" + _source.NVENTE'
    };

    var fCa = {
        key_field: aggField.cd,
        value_field: 'PVTOTAL'
    };

    var fPrd = makeNavFilters(options, 'prd');
    var fOrg = makeNavFilters(options, 'org');

    var data = {
        size: 0,
        facets: {
            'lib': {facet_filter: {and: [fDates[0]].concat(fPrd).concat(fOrg)}, terms: fLib},
            'ca': {facet_filter: {and: [fDates[0]].concat(fPrd).concat(fOrg)}, terms_stats: fCa},
            'ca_1y': {facet_filter: {and: [fDates[2]].concat(fPrd).concat(fOrg)}, terms_stats: fCa},
            'ca_2m': {facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms_stats: fCa},
            'ca_global_1y': {facet_filter: {and: [fDates[2]].concat(fPrd)}, terms_stats: fCa},
            'ca_global_2m': {facet_filter: {and: [fDates[1]].concat(fPrd)}, terms_stats: fCa},
            'vt_acc_1y': {facet_filter: {and: [fDates[2], fAcc].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_acc_2m': {facet_filter: {and: [fDates[1], fAcc].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_acc_global_2m': {facet_filter: {and: [fDates[1], fAcc].concat(fPrd)}, terms: fVt},
            'vt_serv_1y': {facet_filter: {and: [fDates[2], fServ].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_serv_2m': {facet_filter: {and: [fDates[1], fServ].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_serv_global_2m': {facet_filter: {and: [fDates[1], fServ].concat(fPrd)}, terms: fVt},
            'vt_oa_1y': {facet_filter: {and: [fDates[2], fOa].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_oa_2m': {facet_filter: {and: [fDates[1], fOa].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_oa_global_2m': {facet_filter: {and: [fDates[1], fOa].concat(fPrd)}, terms: fVt},
            'ca_rem_1y': {facet_filter: {and: [fDates[2], fRem].concat(fPrd).concat(fOrg)}, terms_stats: fCa},
            'ca_rem_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd).concat(fOrg)}, terms_stats: fCa},
            'ca_rem_global_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd)}, terms_stats: fCa},
            'vt_1y': {facet_filter: {and: [fDates[2]].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_2m': {facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms: fVt}
        }
    };

    postSearch('lv', data, function (error, result) {
        if (error) {
            callback(error);
        } else {

            var o = {};

            var mergeCaList = function (p, terms) {
                for (var i = 0, imax = terms.length; i < imax; i++) {
                    var term = terms[i];
                    o[term.term][p] = term.total;
                }
            }

            var mergeVtList = function (p, terms) {
                for (var i = 0, imax = terms.length; i < imax; i++) {
                    var term = terms[i].term.split(';')[0];
                    if (typeof o[term][p] !== 'number') {
                        o[term][p] = 0;
                    }
                    o[term][p]++;
                }
            }

            if (!libCache[aggField.cd]) {
                libCache[aggField.cd] = {};
            }

            // On commence par les libellés pour créer les objets.
            for (var i = 0, imax = result.facets['lib'].terms.length; i < imax; i++) {
                var parts = result.facets['lib'].terms[i].term.split(';');
                o[parts[0]] = {
                    cd: parts[0],
                    lib: parts[1]
                };
                // On en profite pour remplir le cache des libellés.
                if (!libCache[aggField.cd][parts[0]]) {
                    libCache[aggField.cd][parts[0]] = parts[1];
                }
            }

            mergeCaList('ca', result.facets['ca'].terms);
            mergeCaList('ca2m', result.facets['ca_2m'].terms);
            mergeCaList('ca1y', result.facets['ca_1y'].terms);
            mergeCaList('caGlobal1y', result.facets['ca_global_1y'].terms);
            mergeCaList('caGlobal2m', result.facets['ca_global_2m'].terms);
            mergeVtList('vt2m', result.facets['vt_2m'].terms);
            mergeVtList('vt1y', result.facets['vt_1y'].terms);
            mergeVtList('vtAcc1y', result.facets['vt_acc_1y'].terms);
            mergeVtList('vtAcc2m', result.facets['vt_acc_2m'].terms);
            mergeVtList('vtAccGlobal2m', result.facets['vt_acc_global_2m'].terms);
            mergeVtList('vtServ1y', result.facets['vt_serv_1y'].terms);
            mergeVtList('vtServ2m', result.facets['vt_serv_2m'].terms);
            mergeVtList('vtServGlobal2m', result.facets['vt_serv_global_2m'].terms);
            mergeVtList('vtOa1y', result.facets['vt_oa_1y'].terms);
            mergeVtList('vtOa2m', result.facets['vt_oa_2m'].terms);
            mergeVtList('vtOaGlobal2m', result.facets['vt_oa_global_2m'].terms);
            mergeCaList('caRem1y', result.facets['ca_rem_1y'].terms);
            mergeCaList('caRem2m', result.facets['ca_rem_2m'].terms);
            mergeCaList('caRemGlobal2m', result.facets['ca_rem_global_2m'].terms);

            var u = [];

            for (var n in o) {
                u.push(o[n]);
            }

            callback(null, u);
        }
    });
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

exports.getIndicators = getIndicators;
exports.getIndicatorsEnt = getIndicatorsEnt;
exports.getDetails = getDetails;
exports.getFilterText = getFilterText;
exports.getBudget = getBudget;

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
