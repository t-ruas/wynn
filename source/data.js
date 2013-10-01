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
        response.on('end', function () {
            var result = JSON.parse(content);
            _logger.info('Réponse EslasticeSearch : ' + _util.inspect(result, {depth: null}));
            if (result.error) {
                callback(new _errors.Error('ElasticSearchError', result.error));
            } else {
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
}

function makeDateFilter(date) {
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

function getScoreEvol(val, histo, moyenne, budget) {
    var score = 0;
    (val > histo) && score++;
    (val > histo + (histo * moyenne) / 100) && score++;
    (val > histo + (histo * budget) / 100) && score++;
    return score;
}

function getScore(val, histo, moyenne, budget) {
    var score = 0;
    (val > histo) && score++;
    (val > moyenne) && score++;
    (val > histo + (histo * budget) / 100) && score++;
    return score;
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
    for (var i = 1; i < 4; i++) {
        var p = prefix + i;
        if (p in options) {
            var o = {};
            o[filterFields[p].cd] = options[p].toLowerCase();
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
    for (var m in filterFields) {
        if (m in options) {
            i++;
            var n = m;
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
        }
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

    getBudget(function (error, result) {
        if (error) {
            callback(error);
        } else {
            var budget = result;

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
                    'vt_rem_1y': {facet_filter: {and: [fDates[2], fRem].concat(fPrd).concat(fOrg)}, terms: fVt},
                    'vt_rem_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd).concat(fOrg)}, terms: fVt},
                    'vt_rem_global_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd)}, terms: fVt},
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

                    var o = {};

                    o.ca = result.facets['ca'].total;
                    o.ca2m = result.facets['ca_2m'].total;
                    var ca1y = result.facets['ca_1y'].total;
                    o.caEvo = 100 * (o.ca2m - ca1y) / ca1y;
                    var caGlobal1y = result.facets['ca_global_1y'].total;
                    var caGlobal2m = result.facets['ca_global_2m'].total;
                    o.caPt = getScoreEvol(
                        o.ca,
                        ca1y,
                        caGlobal2m / (caGlobal2m - caGlobal1y),
                        budget.ca);

                    o.vt2m = result.facets['vt_2m'].terms.length;
                    o.vt1y = result.facets['vt_1y'].terms.length;
                    o.vtEvo = 100 * (o.vt2m - o.vt1y) / o.vt1y;
                    o.vtPt = getScoreEvol(
                        o.vt2m,
                        o.vt1y,
                        result.facets['vt_global_1y'].terms.length / (result.facets['vt_global_1y'].terms.length - result.facets['vt_global_2m'].terms.length),
                        budget.vt);

                    o.vtPartAcc1y = 100 * result.facets['vt_acc_1y'].terms.length / o.vt1y;
                    o.vtPartAcc2m = 100 * result.facets['vt_acc_2m'].terms.length / o.vt2m;
                    o.vtPartAccPt = getScore(
                        o.vtPartAcc2m,
                        o.vtPartAcc1y,
                        result.facets['vt_acc_global_2m'].terms.length,
                        budget.vtPartAcc);

                    o.vtPartServ1y = 100 * result.facets['vt_serv_1y'].terms.length / o.vt1y;
                    o.vtPartServ2m = 100 * result.facets['vt_serv_2m'].terms.length / o.vt2m;
                    o.vtPartServPt = getScore(
                        o.vtPartServ2m,
                        o.vtPartServ1y,
                        result.facets['vt_serv_global_2m'].terms.length,
                        budget.vtPartServ);

                    o.vtPartOa1y = 100 * result.facets['vt_oa_1y'].terms.length / o.vt1y;
                    o.vtPartOa2m = 100 * result.facets['vt_oa_2m'].terms.length / o.vt2m;
                    o.vtPartOaPt = getScore(
                        o.vtPartOa2m,
                        o.vtPartOa1y,
                        result.facets['vt_oa_global_2m'].terms.length,
                        budget.vtPartOa);

                    o.vtPartRem1y = 100 * result.facets['vt_rem_1y'].terms.length / o.vt1y;
                    o.vtPartRem2m = 100 * result.facets['vt_rem_2m'].terms.length / o.vt2m;
                    o.vtPartRemPt = 3 - getScore(
                        o.vtPartRem2m,
                        o.vtPartRem1y,
                        result.facets['vt_rem_global_2m'].terms.length,
                        budget.vtPartRem);

                    // TODO
                    o.ent = 15;
                    o.entEvo = 100;

                    callback(null, o);
                }
            });
        }
    });
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function getDetails(options, callback) {

    getBudget(function (error, result) {
        if (error) {
            callback(error);
        } else {
            var budget = result;

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

            // Cas particulier au niveau filiale.
            if (options.agg === 'org1') {
                var dartycom = {
                    or: [
                        {prefix: {'NVENTE': '907001'}},
                        {
                            and: [
                                {term: {'CORDG2': '040'}},
                                {term: {'CORG0': '907'}}
                            ]
                        }
                    ]
                };
            }

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
                    'vt_rem_1y': {facet_filter: {and: [fDates[2], fRem].concat(fPrd).concat(fOrg)}, terms: fVt},
                    'vt_rem_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd).concat(fOrg)}, terms: fVt},
                    'vt_rem_global_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd)}, terms: fVt},
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

                    _logger.info('libCache : ' + _util.inspect(libCache));

                    mergeCaList('ca', result.facets['ca'].terms);
                    mergeCaList('ca2m', result.facets['ca_2m'].terms);
                    mergeCaList('ca1y', result.facets['ca_1y'].terms);
                    mergeCaList('caGlobal1y', result.facets['ca_global_1y'].terms);
                    mergeCaList('caGlobal2m', result.facets['ca_global_2m'].terms);

                    mergeVtList('vt2m', result.facets['vt_2m'].terms);
                    mergeVtList('vt1y', result.facets['vt_1y'].terms);

                    mergeVtList('vtPartAcc1y', result.facets['vt_acc_1y'].terms);
                    mergeVtList('vtPartAcc2m', result.facets['vt_acc_2m'].terms);
                    mergeVtList('vtPartAccGlobal2m', result.facets['vt_acc_global_2m'].terms);

                    mergeVtList('vtPartServ1y', result.facets['vt_serv_1y'].terms);
                    mergeVtList('vtPartServ2m', result.facets['vt_serv_2m'].terms);
                    mergeVtList('vtPartServGlobal2m', result.facets['vt_serv_global_2m'].terms);

                    mergeVtList('vtPartOa1y', result.facets['vt_oa_1y'].terms);
                    mergeVtList('vtPartOa2m', result.facets['vt_oa_2m'].terms);
                    mergeVtList('vtPartOaGlobal2m', result.facets['vt_oa_global_2m'].terms);

                    mergeVtList('vtPartRem1y', result.facets['vt_rem_1y'].terms);
                    mergeVtList('vtPartRem2m', result.facets['vt_rem_2m'].terms);
                    mergeVtList('vtPartRemGlobal2m', result.facets['vt_rem_global_2m'].terms);

                    var u = [];

                    for (var n in o) {
                        o[n].caEvo = 100 * (o[n].ca2m - o[n].ca1y) / o[n].ca1y;
                        o[n].caPt = getScoreEvol(
                            o[n].ca,
                            o[n].ca1y,
                            o[n].caGlobal2m / (o[n].caGlobal2m - o[n].caGlobal1y),
                            budget.ca);
                        delete o[n].ca;
                        delete o[n].ca1y;
                        delete o[n].caGlobal1y;
                        delete o[n].caGlobal2m;

                        o[n].vtPartAcc1y = 100 * o[n].vtPartAcc1y / o[n].vt1y;
                        o[n].vtPartAcc2m = 100 * o[n].vtPartAcc2m / o[n].vt2m;
                        o[n].vtAccPt = getScore(
                            o[n].vtPartAcc2m,
                            o[n].vtPartAcc1y,
                            o[n].vtPartAccGlobal2m,
                            budget.vtPartAcc);
                        delete o[n].vtPartAcc1y;
                        delete o[n].vtPartAccGlobal2m;

                        o[n].vtPartServ1y = 100 * o[n].vtPartServ1y / o[n].vt1y;
                        o[n].vtPartServ2m = 100 * o[n].vtPartServ2m / o[n].vt2m;
                        o[n].vtServPt = getScore(
                            o[n].vtPartServ2m,
                            o[n].vtPartServ1y,
                            o[n].vtPartServGlobal2m,
                            budget.vtPartServ);
                        delete o[n].vtPartServ1y;
                        delete o[n].vtPartServGlobal2m;

                        o[n].vtPartOa1y = 100 * o[n].vtPartOa1y / o[n].vt1y;
                        o[n].vtPartOa2m = 100 * o[n].vtPartOa2m / o[n].vt2m;
                        o[n].vtOaPt = getScore(
                            o[n].vtPartOa2m,
                            o[n].vtPartOa1y,
                            o[n].vtPartOaGlobal2m,
                            budget.vtPartOa);
                        delete o[n].vtPartOa1y;
                        delete o[n].vtPartOaGlobal2m;

                        o[n].vtPartRem1y = 100 * o[n].vtPartRem1y / o[n].vt1y;
                        o[n].vtPartRem2m = 100 * o[n].vtPartRem2m / o[n].vt2m;
                        o[n].vtRemPt = getScore(
                            o[n].vtPartRem2m,
                            o[n].vtPartRem1y,
                            o[n].vtPartRemGlobal2m,
                            budget.vtPartRem);
                        delete o[n].vtPartRem1y;
                        delete o[n].vtPartRemGlobal2m;

                        u.push(o[n]);
                    }

                    callback(null, u);
                }
            });
        }
    });
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

exports.getIndicators = getIndicators;
exports.getDetails = getDetails;
exports.getFilterText = getFilterText;

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

getFilterText({prd1: 'div'}, function (error, result) { _logger.info('test getFilterText() : ' + _util.inspect(result)); });

if (getScoreEvol(1200, 1000, 25, 10) !== 2) {
    console.error('getScoreEvol()');
}
