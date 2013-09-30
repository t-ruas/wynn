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
};

function makeDateFilter(date) {
    return {
        range: {
            'DCREATION': {
                from: dateToString(new Date(date.getFullYear(), date.getMonth(), date.getDate())),
                to: dateToString(date),
                include_lower: true,
                include_upper: false
            }
        }
    };
}

/*
function getRefOrg(callback) {
}

var refPrd = null;

function getRefPrd(callback) {
    if (refPrd) {
        callback(null, refPrd);
    } else {
        postSearch('prd', {}, function (error, result) {
            if (error) {
                callback(error);
            } else {
                var list = result.hits[0];
                refPrd = {};
                for (var i = 0, imax = list.length; i < imax; i++) {
                    var b;
                    var e = list[i];
                    refPrd[e.CUNIVERS] || refPrd[e.CUNIVERS] = {lib: e.LUNIVERS, sub: {}};
                    b = refPrd[e.CUNIVERS];
                    b.sub[e.CRAYON] || b.sub[e.CRAYON] = {lib: e.LRAYON, sub: {}};
                    b = b.sub[e.CRAYON];
                    b.sub[e.CGAMME] || b.sub[e.CGAMME] = {lib: e.LGAMME, sub: {}};
                    b = b.sub[e.CGAMME];
                    b.sub[e.CCODIT] || b.sub[e.CCODIT] = {lib: e.LCODIT};
                }
                callback(null, refPrd);
            }
        });
    }
}
*/

function getBudget() {
    return {ca: 10, vtPartAcc: 15, vtPartServ: 15, vtPartOa: 15, vtPartRem: 15};
}

function getScoreEvol(val, histo, moyenne, budget) {
    var score = 0;
    (val > histo) && score++;
    (val > histo + (histo * moyenne) / 100) && score++;
    (val > histo + (histo * budget) / 100) && score++;
    return score;
}

if (getScoreEvol(1200, 1000, 25, 10) !== 2) {
    console.error('getScoreEvol()');
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
    dates[0] = new Date(2013, 09, 20, 14, 38, 49);
    dates[1] = new Date(dates[0]);
    dates[1].setMinutes(dates[1].getMinutes() - 2);
    dates[2] = new Date(dates[1]);
    dates[2].setFullYear(dates[2].getFullYear() - 1);

    for (var i = 0; i < 3; i++) {
        dates[i] = makeDateFilter(dates[i]);
    }

    return dates;
}

var fieldNames = {
    'prd1': 'CPRD1',
    'prd2': 'CPRD2',
    'prd3': 'CPRD3',
    'org1': 'NLIEU',
    'org2': 'CLIEU2',
    'org3': 'CLIEU3',
};

function getFieldName(name) {
    return name in fieldNames ? fieldNames[name] : null;
}

function addFilter(options, prefix, andArray) {
    for (var i = 1; i < 4; i++) {
        var p = prefix + i;
        if (p in options) {
            var o = {};
            o[getFieldName(p)] = options[p];
            andArray.push({term: o});
        }
    }
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function getIndicators(options, callback) {

    var fDates = prepareDateFilters();
    var fAcc = {term: {'CTYPENT': 'co'}};
    var fServ = {term: {'CTYPENT': 'se'}};
    var fOa = {term: {'CTYPENT': 'co'}};
    var fRem = {term: {'CTYPENT': 're'}};
    var fVt = {field: 'NVENTE'};
    var fCa = {field: 'PVTOTAL'};

    var data = {
        size: 0,
        facets: {
            'ca': {facet_filter: {and: [fDates[0]]}, statistical: fCa},
            'ca_1y': {facet_filter: {and: [fDates[2]]}, statistical: fCa},
            'ca_2m': {facet_filter: {and: [fDates[1]]}, statistical: fCa},
            'ca_global_1y': {facet_filter: {and: [fDates[2]]}, statistical: fCa},
            'ca_global_2m': {facet_filter: {and: [fDates[1]]}, statistical: fCa},
            'vt_acc_1y': {facet_filter: {and: [fDates[2], fAcc]}, terms: fVt},
            'vt_acc_2m': {facet_filter: {and: [fDates[1], fAcc]}, terms: fVt},
            'vt_acc_global_2m': {facet_filter: {and: [fDates[1], fAcc]}, terms: fVt},
            'vt_serv_1y': {facet_filter: {and: [fDates[2], fServ]}, terms: fVt},
            'vt_serv_2m': {facet_filter: {and: [fDates[1], fServ]}, terms: fVt},
            'vt_serv_global_2m': {facet_filter: {and: [fDates[1], fServ]}, terms: fVt},
            'vt_oa_1y': {facet_filter: {and: [fDates[2], fOa]}, terms: fVt},
            'vt_oa_2m': {facet_filter: {and: [fDates[1], fOa]}, terms: fVt},
            'vt_oa_global_2m': {facet_filter: {and: [fDates[1], fOa]}, terms: fVt},
            'vt_rem_1y': {facet_filter: {and: [fDates[2], fRem]}, terms: fVt},
            'vt_rem_2m': {facet_filter: {and: [fDates[1], fRem]}, terms: fVt},
            'vt_rem_global_2m': {facet_filter: {and: [fDates[1], fRem]}, terms: fVt},
            'vt_1y': {facet_filter: {and: [fDates[2]]}, terms: fVt},
            'vt_2m': {facet_filter: {and: [fDates[1]]}, terms: fVt},
            'vt_global_1y': {facet_filter: {and: [fDates[2]]}, terms: fVt},
            'vt_global_2m': {facet_filter: {and: [fDates[1]]}, terms: fVt}
        }
    };

    // Ajout des filtres à toutes les facets définies.
    if (options) {
        for (var facet in data.facets) {
            // Pas de filtre org sur les facets globales.
            if (facet.indexOf('global') !== -1) {
                addFilter(options, 'org', data.facets[facet].facet_filter.and);
            }
            addFilter(options, 'prd', data.facets[facet].facet_filter.and);
        }
    }

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
                getBudget().ca);

            o.vt2m = result.facets['vt_2m'].terms.length;
            o.vt1y = result.facets['vt_1y'].terms.length;
            o.vtEvo = 100 * (o.vt2m - o.vt1y) / o.vt1y;
            o.vtPt = getScoreEvol(
                o.vt2m,
                o.vt1y,
                result.facets['vt_global_1y'].terms.length / (result.facets['vt_global_1y'].terms.length - result.facets['vt_global_2m'].terms.length),
                getBudget().vt);

            o.vtPartAcc1y = 100 * result.facets['vt_acc_1y'].terms.length / o.vt1y;
            o.vtPartAcc2m = 100 * result.facets['vt_acc_2m'].terms.length / o.vt2m;
            o.vtAccPt = getScore(
                o.vtPartAcc2m,
                o.vtPartAcc1y,
                result.facets['vt_acc_global_2m'].terms.length,
                getBudget().vtPartAcc);

            o.vtPartServ1y = 100 * result.facets['vt_serv_1y'].terms.length / o.vt1y;
            o.vtPartServ2m = 100 * result.facets['vt_serv_2m'].terms.length / o.vt2m;
            o.vtPartServPt = getScore(
                o.vtPartServ2m,
                o.vtPartServ1y,
                result.facets['vt_serv_global_2m'].terms.length,
                getBudget().vtPartServ);

            o.vtPartOa1y = 100 * result.facets['vt_oa_1y'].terms.length / o.vt1y;
            o.vtPartOa2m = 100 * result.facets['vt_oa_2m'].terms.length / o.vt2m;
            o.vtPartOaPt = getScore(
                o.vtPartOa2m,
                o.vtPartOa1y,
                result.facets['vt_oa_global_2m'].terms.length,
                getBudget().vtPartOa);

            o.vtPartRem1y = 100 * result.facets['vt_rem_1y'].terms.length / o.vt1y;
            o.vtPartRem2m = 100 * result.facets['vt_rem_2m'].terms.length / o.vt2m;
            o.vtPartRemPt = 3 - getScore(
                o.vtPartRem2m,
                o.vtPartRem1y,
                result.facets['vt_rem_global_2m'].terms.length,
                getBudget().vtPartRem);

            // TODO
            o.ent = 15;

            callback(null, o);
        }
    });
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function getDetails(options, callback) {

    var fDates = prepareDateFilters();
    var fAcc = {term: {'CTYPENT': 'co'}};
    var fServ = {term: {'CTYPENT': 'se'}};
    var fOa = {term: {'CTYPENT': 'co'}};
    var fRem = {term: {'CTYPENT': 're'}};

    var fVt = {
        field: getFieldName(options.agg),
        script: 'term + ";" + _source.NVENTE'
    };

    var fCa = {
        key_field: getFieldName(options.agg),
        value_field: 'PVTOTAL'
    };

    var data = {
        size: 0,
        facets: {
            'ca': {facet_filter: {and: [fDates[0]]}, terms_stats: fCa},
            'ca_1y': {facet_filter: {and: [fDates[2]]}, terms_stats: fCa},
            'ca_2m': {facet_filter: {and: [fDates[1]]}, terms_stats: fCa},
            'ca_global_1y': {facet_filter: {and: [fDates[2]]}, terms_stats: fCa},
            'ca_global_2m': {facet_filter: {and: [fDates[1]]}, terms_stats: fCa},
            'vt_acc_1y': {facet_filter: {and: [fDates[2], fAcc]}, terms: fVt},
            'vt_acc_2m': {facet_filter: {and: [fDates[1], fAcc]}, terms: fVt},
            'vt_acc_global_2m': {facet_filter: {and: [fDates[1], fAcc]}, terms: fVt},
            'vt_serv_1y': {facet_filter: {and: [fDates[2], fServ]}, terms: fVt},
            'vt_serv_2m': {facet_filter: {and: [fDates[1], fServ]}, terms: fVt},
            'vt_serv_global_2m': {facet_filter: {and: [fDates[1], fServ]}, terms: fVt},
            'vt_oa_1y': {facet_filter: {and: [fDates[2], fOa]}, terms: fVt},
            'vt_oa_2m': {facet_filter: {and: [fDates[1], fOa]}, terms: fVt},
            'vt_oa_global_2m': {facet_filter: {and: [fDates[1], fOa]}, terms: fVt},
            'vt_rem_1y': {facet_filter: {and: [fDates[2], fRem]}, terms: fVt},
            'vt_rem_2m': {facet_filter: {and: [fDates[1], fRem]}, terms: fVt},
            'vt_rem_global_2m': {facet_filter: {and: [fDates[1], fRem]}, terms: fVt},
            'vt_1y': {facet_filter: {and: [fDates[2]]}, terms: fVt},
            'vt_2m': {facet_filter: {and: [fDates[1]]}, terms: fVt}
        }
    };

    // Ajout des filtres à toutes les facets définies.
    if (options) {
        for (var facet in data.facets) {
            // Pas de filtre org sur les facets globales.
            if (facet.indexOf('global') !== -1) {
                addFilter(options, 'org', data.facets[facet].facet_filter.and);
            }
            addFilter(options, 'prd', data.facets[facet].facet_filter.and);
        }
    }

    postSearch('lv', data, function (error, result) {
        if (error) {
            callback(error);
        } else {

            var o = {};

            var mergeCaList = function (p, terms) {
                for (var i = 0, imax = terms.length; i < imax; i++) {
                    var term = terms[i];
                    if (!o[term.term]) {
                        o[term.term] = {};
                    }
                    o[term.term][p] = term.total;
                }
            }

            var mergeVtList = function (p, terms) {
                for (var i = 0, imax = terms.length; i < imax; i++) {
                    var term = terms[i].term.split(';')[0];
                    if (!o[term]) {
                        o[term] = {};
                    }
                    if (typeof o[term][p] !== 'number') {
                        o[term][p] = 0;
                    }
                    o[term][p]++;
                }
            }

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
                    getBudget().ca);
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
                    getBudget().vtPartAcc);
                delete o[n].vtPartAcc1y;
                delete o[n].vtPartAccGlobal2m;

                o[n].vtPartServ1y = 100 * o[n].vtPartServ1y / o[n].vt1y;
                o[n].vtPartServ2m = 100 * o[n].vtPartServ2m / o[n].vt2m;
                o[n].vtServPt = getScore(
                    o[n].vtPartServ2m,
                    o[n].vtPartServ1y,
                    o[n].vtPartServGlobal2m,
                    getBudget().vtPartServ);
                delete o[n].vtPartServ1y;
                delete o[n].vtPartServGlobal2m;

                o[n].vtPartOa1y = 100 * o[n].vtPartOa1y / o[n].vt1y;
                o[n].vtPartOa2m = 100 * o[n].vtPartOa2m / o[n].vt2m;
                o[n].vtOaPt = getScore(
                    o[n].vtPartOa2m,
                    o[n].vtPartOa1y,
                    o[n].vtPartOaGlobal2m,
                    getBudget().vtPartOa);
                delete o[n].vtPartOa1y;
                delete o[n].vtPartOaGlobal2m;

                o[n].vtPartRem1y = 100 * o[n].vtPartRem1y / o[n].vt1y;
                o[n].vtPartRem2m = 100 * o[n].vtPartRem2m / o[n].vt2m;
                o[n].vtRemPt = getScore(
                    o[n].vtPartRem2m,
                    o[n].vtPartRem1y,
                    o[n].vtPartRemGlobal2m,
                    getBudget().vtPartRem);
                delete o[n].vtPartRem1y;
                delete o[n].vtPartRemGlobal2m;

                o[n].cd = n;
                o[n].lib = 'lib test';

                u.push(o[n]);
            }

            callback(null, u);
        }
    });
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

exports.getIndicators = getIndicators;
exports.getDetails = getDetails;

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
