'use strict'; //<= Fab ! 

var _util = require('util');
var _http = require('http');
var _logger = require('winston');
var _moment = require('moment');
var _config = require('./config');
var _errors = require('./errors');

// http://www.elasticsearch.org/guide/

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function postSearch(type, data, callback) {
	console.log('type')
	console.log(type)
    sendRequest({method: 'POST', path: '/' + type + '/_search'}, data, callback);
}

function sendRequest(options, data, callback) {
	console.log('data')
	console.log(data)
	// pour retrouver un libellé en particulier s'il manque
    options.hostname = _config.elasticSearch.host;
    options.port = _config.elasticSearch.port;
    options.path = '/' + _config.elasticSearch.index + options.path;
    // On lance la requête
    var req = _http.request(options, function (response) {
        var content = '';
        response.on('data', function (chunk) {
		//_logger.info('CHUNK : ' + chunk);
		content += chunk;
        });
        response.on('end', function () {
            var result = JSON.parse(content);
            if (result.error) {
                callback(new _errors.Error('2 ElasticSearchError', result.error));
            } else {
               // _logger.info('2 Réponse ElasticSearch ON : ' + _util.inspect(result, {depth: null}));

                callback(null, result);
            }
        });
    }).on('error', function (error) {
        callback(error);
    });
    if (data) {
        _logger.info('Requête ElasticSearch : ' + _util.inspect(data, {depth: null}));
        req.write(JSON.stringify(data));
    }
	//console.log('###### => appel vers req.end()');	
    req.end();
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\ pour récupérer les entrées, a merger avec les précédentes




//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

function round2(n) {
    return Math.round(n * 100) / 100;
}

function dateToString(date) {

    return _moment(date).format('YYYYMMDDHHmm');
}

function makeDateFilter(date) {
	//_logger.info('2 Réponse ElasticSearch : ' + _util.inspect(date, {depth: null}));
	return {
        range: {
            'DATE': {
            	lte: dateToString(date),
                gte: dateToString(date.setHours(0,0,0,0))

               
            }
        }
    };
}

function makeDateFilterLib(date) {
	var tempDate = new Date (date);
	tempDate.setDate(tempDate.getDate() - _config.jour1an);
	tempDate.setHours(0,0,0,0);
    return {
        range: {
            'DATE': {
            	lte: dateToString(date),
                gte: dateToString(tempDate)
            }
        }
    };
}

// permet de retourner le budget pour chaque catégories
function getBudget(callback) {
	callback(null, {ca: 10, vtPartAcc: 15, vtPartServ: 15, vtPartOa: 15, vtPartRem: 15});
	// TODO : var value_of_date = getdate();
	// get date du jour et la mettre dans value_of_date
	/*var value_of_date = '20131030'
	//var f = '{"DATE":'+value_of_date+'}';
	var f = {"DATE":value_of_date};
	var data = {
		size: 1,
		fields: ['CA','ACCESSOIRES', 'OFFRESACTIVES', 'REMISE', 'SERVICES'],
		filter: {term: f}
	}
	
	postSearch('budget', data, function (error, result) {
		if (error) {
			callback(error);
		} else {
			if (result.hits.hits.length) {
				callback(null, result.hits.hits[0].fields);
			} else {
				callback(new _errors.Error('NotFoundError'));
			}
		}
	});	*/
}

function prepareDateFilters(tempsComptSet) {
    var dates = new Array(5);
	dates[0] = new Date(2013, 7, 27, 18, 57, 56);
    dates[0].setMinutes(dates[0].getMinutes() -  _config.tempsChargReel); // 2min
    dates[1] = new Date(dates[0]);
    dates[1].setMinutes(dates[1].getMinutes() -  _config.tempsChargTalend); // 4min
    if (tempsComptSet != null){
    	dates[1] = dates[1].setMinutes(dates[1].getMinutes() -  tempsComptSet); // 19 min
   	}
    dates[2] = new Date(dates[1]); 
    dates[2].setDate(dates[2].getDate() - _config.jourCalcMoyeEnt);  // 26 min

    dates[3] = new Date(dates[1]);
    dates[3].setDate(dates[3].getDate() - _config.jour1an); // 
    dates[4] = new Date(dates[0]);
	
    for (var i = 0; i < 5; i++) {
		if (i != 4){
        	dates[i] = makeDateFilter(dates[i]);
       	}
       	else {
       		dates[4] = makeDateFilterLib (dates[4]);
       	}
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
			// console.log('XXXXXXXXXXXXXXXXXX  Guillaume ! =>>> ' + options[n].toLowerCase())
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
                // _logger.info('2 Réponse test : ' + _util.inspect(filterFields[n], {depth: null}));
                getLib(filterFields[n], options[n], function (error, result) {
                    // En cas d'erreur sur un des codes, on sort en erreur et ignore tous les autres retours.
                    if (error) {
                    	// _logger.info('2 Réponse ERROR : ' + _util.inspect(error, {depth: null}));
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

function getES(context, callback) {
	var data = {
		from: 0,
		size: 1,
		query: {query_string: {query:1}}
	};
	
	postSearch('lv', data, function (error, result) {
		if (error) {
			callback(error);
		} else {
			if (result.hits.hits.length) {
				callback(null, true);
			} else {
				callback(new _errors.Error('NotFoundError'));
			}
		}
	});
}
//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

var libCache = {};

// Récupère un libellé en allant chercher la première ligne qui l'utilise.
function getLib(field, code, callback) {

    if (!libCache[field.cd]) {
        libCache[field.cd] = {};
    }
	// si le nom du libellé est dans le cache ok, sinon on le cherche
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
		
		
		// _logger.info('Réponse ElasticSearch : ' + _util.inspect(data, {depth: null}));
		// pour retrouver un libellé en particulier s'il manque
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
// Accueil
function getIndicators(options, callback) {

    var fDates = prepareDateFilters();
    var fAcc = {term: {'FLAGPM': 'acc'}};		// useless
    var fServ = {term: {'FLAGTYPART': 'p'}};    // useless
    var fOa = {term: {'FLAGOA': 'oa'}};         // useless
    var fRem = {term: {'FLAGREM': 'rem'}};      // useless

    var fVt = {field: 'NVENTE'};
    var fCa = {field: 'PVTOTAL'};
	
	/*
	var fRem = { field: ''}; // Nom_du_field_ou_se_trouve_le_ca_remisé
	var fAcc = { field: ''}; // Nom_du_field_ou_se_trouve_le_ca_des_accessoires
	var fOa = { field: ''};  // Nom_du_field_ou_se_trouve_le_ca_des_offres_actives
	var fServ = { field: ''};// Nom_du_field_ou_se_trouve_le_ca_des_services
	*/
    var fPrd = makeNavFilters(options, 'prd');
    var fOrg = makeNavFilters(options, 'org');
	
    var data = {
        size: 0,
        facets: {
            'ca': {facet_filter: {and: [fDates[0]].concat(fPrd).concat(fOrg)}, statistical: fCa},
            'ca_1y': {facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, statistical: fCa},
            'ca_2m': {facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, statistical: fCa},
            'ca_global_1y': {facet_filter: {and: [fDates[3]].concat(fPrd)}, statistical: fCa},
            'ca_global_2m': {facet_filter: {and: [fDates[1]].concat(fPrd)}, statistical: fCa},
            'vt_acc_1y': {facet_filter: {and: [fDates[3], fAcc].concat(fPrd).concat(fOrg)}, terms: fVt},		// delete
            'vt_acc_2m': {facet_filter: {and: [fDates[1], fAcc].concat(fPrd).concat(fOrg)}, terms: fVt},        // delete
            'vt_acc_global_2m': {facet_filter: {and: [fDates[1], fAcc].concat(fPrd)}, terms: fVt},              // delete
            'vt_serv_1y': {facet_filter: {and: [fDates[3], fServ].concat(fPrd).concat(fOrg)}, terms: fVt},      // delete
            'vt_serv_2m': {facet_filter: {and: [fDates[1], fServ].concat(fPrd).concat(fOrg)}, terms: fVt},      // delete
            'vt_serv_global_2m': {facet_filter: {and: [fDates[1], fServ].concat(fPrd)}, terms: fVt},            // delete
            'vt_oa_1y': {facet_filter: {and: [fDates[3], fOa].concat(fPrd).concat(fOrg)}, terms: fVt},          // delete
            'vt_oa_2m': {facet_filter: {and: [fDates[1], fOa].concat(fPrd).concat(fOrg)}, terms: fVt},          // delete
            'vt_oa_global_2m': {facet_filter: {and: [fDates[1], fOa].concat(fPrd)}, terms: fVt},                // delete
            'ca_rem_1y': {facet_filter: {and: [fDates[3], fRem].concat(fPrd).concat(fOrg)}, terms: fCa},        // delete
            'ca_rem_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd).concat(fOrg)}, terms: fCa},        // delete
            'ca_rem_global_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd)}, terms: fCa},              // delete
            'vt_1y': {facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_2m': {facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_global_1y': {facet_filter: {and: [fDates[3]].concat(fPrd)}, terms: fVt},
            'vt_global_2m': {facet_filter: {and: [fDates[1]].concat(fPrd)}, terms: fVt}
			
			/*
			'ca_poids_acc_2m':{facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, statistical: fAcc},
			'ca_poids_acc_1y':{facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, statistical: fAcc},
            'ca_poids_acc_global_2m':{facet_filter: {and: [fDates[1]].concat(fPrd)}, statistical: fAcc},			
			
			'ca_poids_serv_2m':{facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, statistical: fServ},
			'ca_poids_serv_1y':{facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, statistical: fServ},
            'ca_poids_serv_global_2m':{facet_filter: {and: [fDates[1]].concat(fPrd)}, statistical: fServ},			
			
			'ca_poids_rem_2m':{facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, statistical: fRem},
			'ca_poids_rem_1y':{facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, statistical: fRem},
            'ca_poids_rem_global_2m':{facet_filter: {and: [fDates[1]].concat(fPrd)}, statistical: fRem},			
			
			'ca_poids_oa_2m':{facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, statistical: fOa},
			'ca_poids_oa_1y':{facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, statistical: fOa},
            'ca_poids_oa_global_2m':{facet_filter: {and: [fDates[1]].concat(fPrd)}, statistical: fOa},
			
			+ 
			- evolPoidsOa				<= CA
			- evolPoidsRem				<= CA
			- evolPoidsServ             <= CA
			- evolPoidsAcc				<= CA
			*/
			
		}
    };

	// _logger.info('indicateurs: ' + _util.inspect(data, {depth: null}));

    postSearch('lv', data, function (error, result) {
        if (error) {
            callback(error);
        } else {
			// fonction d'aggreg sur facet
            var getCaFacet = function (name) {
                return result.facets[name].total;
			} // TODO : 309 -> 340 inutile 
			var isValid = function (name) { // confirme la validité d'une valeur (null, nan, undefined)
				//console.log('isValid(value)Accueil => value = ' + name); //contrôle ! 
				if (typeof name === 'undefined') {
					console.log(name +' undef accueil');
					return false;}
				if (name == 'null') {
					console.log(name +' null accueil');
					return false;}
				if (isNaN(name)) {
					console.log(name +' isNan accueil');
					return false;}
				else {
					return true;
				}
            }
			var getCountFacet = function (name) { // comptabilise le nombre d'élements selectionné dans la requête ES pour un nom de facet donné
				return isValid(result.facets[name].total) ? result.facets[name].total : 0;
			}
			var computeRatio = function (name, ensemble) { // retourne le ratio pour la facet donnée (name)
				//console.log('ComputeRatio : '+ name + ' divise : ' + result.facets[name].total + ' / ( ' + result.facets[ensemble].count + ' + ' + result.facets[ensemble].missing + ') + object name : ');
				//console.log(result.facets[ensemble]);
				return (result.facets[name].total) / (result.facets[ensemble].count) * 100;
			}
			// fonction d'aggreg sur facet, permet
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
				evolAcc: getCountFacet('vt_acc_2m') != 0 ? computeRatio('vt_acc_2m', 'ca_2m'): 0, // ratio count(acc)/count(total_lines) DELETE
                vtAcc1y: getVtFacet('vt_acc_1y'),					// delete
                vtAcc2m: getVtFacet('vt_acc_2m'),					// delete
                vtAccGlobal2m: getVtFacet('vt_acc_global_2m'),		// delete
                evolServ: getCountFacet('vt_serv_2m') != 0 ? computeRatio('vt_serv_2m','ca_2m'):0, // ratio count(serv)/count(total_lines) DELETE
                vtServ1y: getVtFacet('vt_serv_1y'),					// delete
                vtServ2m: getVtFacet('vt_serv_2m'),					// delete
                vtServGlobal2m: getVtFacet('vt_serv_global_2m'),	// delete
                evolOa: getCountFacet('vt_oa_2m') != 0 ? computeRatio('vt_oa_2m','ca_2m'): 0, // ratio count(oa)/count(total_lines) DELETE
                vtOa1y: getVtFacet('vt_oa_1y'),						// delete
                vtOa2m: getVtFacet('vt_oa_2m'),						// delete
                vtOaGlobal2m: getVtFacet('vt_oa_global_2m'),		// delete
                evolRem: getCountFacet('ca_rem_2m') != 0 ? computeRatio('ca_rem_2m','ca_2m') : 0, // ratio count(rem)/count(total_lines) DELETE
                caRem1y: getCaFacet('ca_rem_1y'),					// delete
                caRem2m: getCaFacet('ca_rem_2m'),					// delete
                caRemGlobal2m: getCaFacet('ca_rem_global_2m'),		// delete
				
				/*
				caPoidsAcc2m: getCaFacet('ca_poids_acc_2m'),
                caPoidsAcc1y: getCaFacet('ca_poids_acc_1y'),
                caPoidsAccGlobal2m: getCaFacet('ca_poids_acc_global_2m'),
				
				caPoidsServ2m: getCaFacet('ca_poids_serv_2m'),
                caPoidsServ1y: getCaFacet('ca_poids_serv_1y'),
                caPoidsServGlobal2m: getCaFacet('ca_poids_serv_global_2m'),
				
				caPoidsRem2m: getCaFacet('ca_poids_rem_2m'),
                caPoidsRem1y: getCaFacet('ca_poids_rem_1y'),
                caPoidsRemGlobal2m: getCaFacet('ca_poids_rem_global_2m'),
				
				caPoidsOa2m: getCaFacet('ca_poids_oa_2m'),
                caPoidsOa1y: getCaFacet('ca_poids_oa_1y'),
                caPoidsOaGlobal2m: getCaFacet('ca_poids_oa_global_2m'),
				*/

            });
        }
    });
}

function getIndicatorsEnt(options, callback) {

    var fDates = prepareDateFilters(_config.derniereEntrees);
    var fEnt = {field: 'QENTRE'};
	var fDat = {field: 'DATE'};
    var fOrg = makeNavFilters(options, 'org');


    var data = {

        size: 0,
        facets: {
            'ent_2m': {facet_filter: {and: [fDates[1]].concat(fOrg)}, statistical: fEnt},
            'ent_1y': {facet_filter: {and: [fDates[3]].concat(fOrg)}, statistical: fEnt},
            'ent_dat': {facet_filter: {and: [fDates[2]].concat(fOrg)}, statistical: fDat}

        }
    };
    // _logger.info('AFFICHAGE: ' + _util.inspect(data, {depth: null}));
    // _logger.info('AFFICHAGE: ' + _util.inspect(data.facets.ent_2m.facet_filter.and[0].range.DATE.lte, {depth: null}));
// a enlever, car en dur
	data.facets.ent_2m.facet_filter.and[0].range.DATE.lte= 201308120945;
	data.facets.ent_2m.facet_filter.and[0].range.DATE.gte= 201308120000;
	data.facets.ent_dat.facet_filter.and[0].range.DATE.lte= 201308120945;
	data.facets.ent_dat.facet_filter.and[0].range.DATE.gte= 201308120000;


    postSearch('entrees', data, function (error, result) {
        if (error) {
            callback(error);
        } else {
			
			
			// _logger.info('AFFICHAGE: ' + _util.inspect(result, {depth: null}));
            var getEntFacet = function (name) {
                return result.facets[name].total;
            }
            var getMaxDate = function (name) {
                return result.facets[name].max;
            }

            callback(null, {
                ent2m: getEntFacet('ent_2m') ,
                ent1y: getEntFacet('ent_1y'),
				entDat: getMaxDate('ent_dat'),
				
            });
        }
    });
}

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
// Details
function getDetails(options, callback) {

    var aggField = filterFields[options.agg];
    var fDates = prepareDateFilters();
    var fAcc = {term: {'FLAGPM': 'acc'}};		// useless
    var fServ = {term: {'FLAGTYPART': 'p'}};    // useless
    var fOa = {term: {'FLAGOA': 'oa'}};         // useless
    var fRem = {term: {'FLAGREM': 'rem'}};      // useless

    var fLib = {
		size: 999,
        field: aggField.cd,
        script: 'term + ";" + _source.' + aggField.lib
    };
	console.log(aggField.cd + ' - ' + aggField.lib + ' = ' + aggField.cd.substring(5,6))
	
	var fOrd = {
		size: 999,
        //field: aggField.cd,
        field: ('ORDRECAT' + aggField.cd.substring(5,6)),
		script: 'term + ";" + _source.' + aggField.cd
    };
	
    // on concatène le numéro de vente avec l'axe d'aggrégation pour avoir un count de ventes et non de lignes.
    var fVt = {
		size: 999,
        field: aggField.cd,
        script: 'term + ";" + _source.NVENTE'
    };

    var fCa = {
		size: 999,
        key_field: aggField.cd,
        value_field: 'PVTOTAL'
    };
	
	/*
	var fRem = {
		size : 999,
		key_field: aggField.cd,
		value_field: '' 	// Nom_du_field_ou_se_trouve_le_ca_remisé
	};
	var fAcc = {
		size : 999,
		key_field: aggField.cd,
		value_field: '' 	// Nom_du_field_ou_se_trouve_le_ca_des_accessoires
	};
	var fOa = {
		size : 999,
		key_field: aggField.cd,
		value_field: ''		// Nom_du_field_ou_se_trouve_le_ca_des_offres_actives
	};
	var fServ = {
		size : 999,
		key_field: aggField.cd,
		value_field: ''		// Nom_du_field_ou_se_trouve_le_ca_des_services
	};
	
	*/
	
    var fPrd = makeNavFilters(options, 'prd');
    var fOrg = makeNavFilters(options, 'org');

    var data = {
        size: 0,
        facets: {
            'ordre': {facet_filter: {and: [fDates[4]]}, terms: fOrd},
            'lib': {facet_filter: {and: [fDates[4]].concat(fPrd).concat(fOrg)}, terms: fLib},
            'ca': {facet_filter: {and: [fDates[0]].concat(fPrd).concat(fOrg)}, terms_stats: fCa},
            'ca_1y': {facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, terms_stats: fCa},
            'ca_2m': {facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms_stats: fCa},
			'ca_global_2m': {facet_filter: {and: [fDates[1]].concat(fPrd)}, terms_stats: fCa},
			'ca_global_1y': {facet_filter: {and: [fDates[3]].concat(fPrd)}, terms_stats: fCa},
            'vt_acc_1y': {facet_filter: {and: [fDates[3], fAcc].concat(fPrd).concat(fOrg)}, terms: fVt},		// delete
            'vt_acc_2m': {facet_filter: {and: [fDates[1], fAcc].concat(fPrd).concat(fOrg)}, terms: fVt},        // delete
            'vt_acc_global_2m': {facet_filter: {and: [fDates[1], fAcc].concat(fPrd)}, terms: fVt},              // delete
            'vt_serv_1y': {facet_filter: {and: [fDates[3], fServ].concat(fPrd).concat(fOrg)}, terms: fVt},      // delete
            'vt_serv_2m': {facet_filter: {and: [fDates[1], fServ].concat(fPrd).concat(fOrg)}, terms: fVt},      // delete
            'vt_serv_global_2m': {facet_filter: {and: [fDates[1], fServ].concat(fPrd)}, terms: fVt},            // delete
            'vt_oa_1y': {facet_filter: {and: [fDates[3], fOa].concat(fPrd).concat(fOrg)}, terms: fVt},          // delete
            'vt_oa_2m': {facet_filter: {and: [fDates[1], fOa].concat(fPrd).concat(fOrg)}, terms: fVt},          // delete
            'vt_oa_global_2m': {facet_filter: {and: [fDates[1], fOa].concat(fPrd)}, terms: fVt},                // delete
            'ca_rem_1y': {facet_filter: {and: [fDates[3], fRem].concat(fPrd).concat(fOrg)}, terms_stats: fCa},  // delete
            'ca_rem_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd).concat(fOrg)}, terms_stats: fCa},  // delete
            'ca_rem_global_2m': {facet_filter: {and: [fDates[1], fRem].concat(fPrd)}, terms_stats: fCa},        // delete
            'vt_1y': {facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, terms: fVt},
            'vt_2m': {facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms: fVt}
			
			/*
			A récupérer : 
			- PoidsAcc2m 				- PoidsAcc1y 				- PoidsAccGlobal2m
			- PoidsServ2m				- PoidsServ1y				- PoidsServGlobal2m
			- PoidsRem2m				- PoidsRem1y				- PoidsRemGlobal2m
			- PoidsOa2m					- PoidsOa1y 				- PoidsOaGlobal2m
			           
			'ca_poids_acc_2m':{facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms_stats: fAcc},
			'ca_poids_acc_1y':{facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, terms_stats: fAcc},
            'ca_poids_acc_global_2m':{facet_filter: {and: [fDates[1]].concat(fPrd)}, terms_stats: fAcc},			
			
			'ca_poids_serv_2m':{facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms_stats: fServ},
			'ca_poids_serv_1y':{facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, terms_stats: fServ},
            'ca_poids_serv_global_2m':{facet_filter: {and: [fDates[1]].concat(fPrd)}, terms_stats: fServ},			
			
			'ca_poids_rem_2m':{facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms_stats: fRem},
			'ca_poids_rem_1y':{facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, terms_stats: fRem},
            'ca_poids_rem_global_2m':{facet_filter: {and: [fDates[1]].concat(fPrd)}, terms_stats: fRem},			
			
			'ca_poids_oa_2m':{facet_filter: {and: [fDates[1]].concat(fPrd).concat(fOrg)}, terms_stats: fOa},
			'ca_poids_oa_1y':{facet_filter: {and: [fDates[3]].concat(fPrd).concat(fOrg)}, terms_stats: fOa},
            'ca_poids_oa_global_2m':{facet_filter: {and: [fDates[1]].concat(fPrd)}, terms_stats: fOa},			
			
			+ 
			- evolPoidsOa				<= CA
			- evolPoidsRem				<= CA
			- evolPoidsServ             <= CA
			- evolPoidsAcc				<= CA
			*/
        }
    };
	
	// _logger.info('2 Réponse ElasticSearch OOO: ' + _util.inspect(data, {depth: null}));
	// _logger.info('Test des dates : ' + _util.inspect(fDates, {depth: null}));
	
    postSearch('lv', data, function (error, result) {
        if (error) {
            callback(error);
        } else {
            var o = {};
			
			var addOrdo = function (p, terms) { // a garder ! 
				for (var i = 0, imax = terms.length; i < imax; i++) {
					var part = terms[i].term.split(';');
					part[1] = part[1].toLowerCase();
					if (o[part[1]]) {
						if (typeof o[part[1]][p] !== 'number')
							o[part[1]][p] = 0;
						o[part[1]][p] = part[0];
					}
				}
			}
			
			var mergeCaList = function (p, terms) { // TODO : vérifier que l'addition marche bien !
                for (var i = 0, imax = terms.length; i < imax; i++) {
                    var term = terms[i];
					if (!o[term.term]) return; // si on tombe sur un lib qui n'est pas bien renseigné TODO : remove
					if (typeof o[term.term][p] !== 'number')  // permet de tester la valeur associé au lib
                        o[term.term][p] = 0; 
                    o[term.term][p]+= term.total; //  << ici 
                }
				/*console.log(o);*/
            }

            var mergeVtList = function (p, terms) { // récupère les VALEURS des terms 'pem', 'div', 'gem'
				for (var i = 0, imax = terms.length; i < imax; i++) {
				    var term = terms[i].term.split(';')[0];
					if (!o[term]) return; // si on tombe sur un lib qui n'est pas bien renseigné TODO : remove
				    if (typeof o[term][p] !== 'number') // permet de tester la valeur associé au lib
                        o[term][p] = 0; 
				    o[term][p]+= terms[i].count;
                }
            } // TODO : 517 -> 557 inutile (garder valid ? )

			var calcReference = function (p , terms) {
				for (var i = 0, imax = terms.length; i < imax; i++) {
					var term = terms[i].term;
					if (typeof o[term][p] !== 'number') {  
                        o[term][p] = 0; // cast en type number si non number
					}
					o[term][p] = terms[i].count; // addition des counts ! 
					
				}
			}
			var mergeEvolValues = function (p, terms) { // retourne le nombre d'occurence GAR, OA, REM, ACC pour comparer
				for (var i = 0, imax = terms.length; i < imax; i++) {
					var term = terms[i].term.split(';')[0];
					if (typeof o[term][p] !== 'number') {  
                        o[term][p] = 0; // cast en type number si non number
					}
					o[term][p] += terms[i].count / o[term].reference * 100; // addition des % des counts ! 
				}
			}	
			var isValid = function (name) {
				//console.log('isValid(value)Détails => value = ' + name); //contrôle ! 
				if (typeof name === 'undefined') {
					console.log('fail ! undef');
					return false;}
				if (name == 'null') {
					console.log('fail null');
					return false;}
				if (!isNaN(name)){
					console.log('fail isnan');
					return false;}
				else 
					return true;
			}
			var getCountFacet = function (name) {
					return isValid(result.facets[name].total) ? result.facets[name].total : 0;
			}
			var computeRatio = function (name, ensemble) {
				return (result.facets[name].total) / (result.facets[ensemble].total + result.facets[ensemble].missing);
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
				console.log(o[parts[0]]);                               
				// On en profite pour remplir le cache des libellés. 
                if (!libCache[aggField.cd][parts[0]]) {
                    libCache[aggField.cd][parts[0]] = parts[1];
                }
                
            }

            addOrdo('ordre', result.facets['ordre'].terms); // ordonnancement 
			
			calcReference('reference', result.facets['ca_2m'].terms);				// a dégager
            mergeCaList('ca', result.facets['ca'].terms);
            mergeCaList('ca2m', result.facets['ca_2m'].terms);
            mergeCaList('ca1y', result.facets['ca_1y'].terms);
            mergeCaList('caGlobal1y', result.facets['ca_global_1y'].terms);
            mergeCaList('caGlobal2m', result.facets['ca_global_2m'].terms);
            mergeVtList('vt2m', result.facets['vt_2m'].terms);
            mergeVtList('vt1y', result.facets['vt_1y'].terms);
            mergeVtList('vtAcc1y', result.facets['vt_acc_1y'].terms);
            mergeVtList('vtAcc2m', result.facets['vt_acc_2m'].terms);
            // console.log(result.facets['vt_acc_2m'].terms);
			mergeEvolValues('evolAcc', result.facets['vt_acc_2m'].terms); // A voir si on garde ... peut etre pas ... 
			mergeVtList('vtAccGlobal2m', result.facets['vt_acc_global_2m'].terms);
            mergeVtList('vtServ1y', result.facets['vt_serv_1y'].terms);
            mergeVtList('vtServ2m', result.facets['vt_serv_2m'].terms);
            mergeEvolValues('evolServ', result.facets['vt_serv_2m'].terms);			// a dégager
			mergeVtList('vtServGlobal2m', result.facets['vt_serv_global_2m'].terms);
            mergeVtList('vtOa1y', result.facets['vt_oa_1y'].terms);
            mergeVtList('vtOa2m', result.facets['vt_oa_2m'].terms);
            mergeEvolValues('evolOa', result.facets['vt_oa_2m'].terms);				// a dégager
            mergeVtList('vtOaGlobal2m', result.facets['vt_oa_global_2m'].terms);
            mergeCaList('caRem1y', result.facets['ca_rem_1y'].terms);
            mergeCaList('caRem2m', result.facets['ca_rem_2m'].terms);
            mergeCaList('caRemGlobal2m', result.facets['ca_rem_global_2m'].terms);
            // console.log('Evol REM : ');	
			mergeEvolValues('evolRem', result.facets['ca_rem_2m'].terms);			// a dégager
			

			
			console.log('Objet O : ');
			console.log(o);
			/*
			A faire : 
			mergeCaList('evolPoidsOa', result.facets['ca_poids_oa_2m'].terms);	
			mergeCaList('evolPoidsRem', result.facets['ca_poids_rem_2m'].terms);	
			mergeCaList('evolPoidsAcc', result.facets['ca_poids_acc_2m'].terms);	
			mergeCaList('evolPoidsServ', result.facets['ca_poids_serv_2m'].terms);	
			
			mergeCaList('caPoidsOaGlobal2m', result.facets['ca_poids_oa_global_2m'].terms);	
			mergeCaList('caPoidsRemGlobal2m', result.facets['ca_poids_rem_global_2m'].terms);	
			mergeCaList('caPoidsAccGlobal2m', result.facets['ca_poids_acc_global_2m'].terms);	
			mergeCaList('caPoidsServGlobal2m', result.facets['ca_poids_serv_global_2m'].terms);
			
			mergeCaList('caPoidsOa1y', result.facets['ca_poids_oa_1y'].terms);	
			mergeCaList('caPoidsRem1y', result.facets['ca_poids_rem_1y'].terms);	
			mergeCaList('caPoidsAcc1y', result.facets['ca_poids_acc_1y'].terms);	
			mergeCaList('caPoidsServ1y', result.facets['ca_poids_serv_1y'].terms);
			
			mergeCaList('caPoidsOa2m', result.facets['ca_poids_oa_2m'].terms);	
			mergeCaList('caPoidsRem2m', result.facets['ca_poids_rem_2m'].terms);	
			mergeCaList('caPoidsAcc2m', result.facets['ca_poids_acc_2m'].terms);	
			mergeCaList('caPoidsServ2m', result.facets['ca_poids_serv_2m'].terms);
			
			*/
			
			/*console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
			console.log('XXXXXXXXXXXXXXX avant de faire les merge CA/vt List XXXXXXXXXXXXXXXXX');
			console.log(o);*/
			var totalLines = 0;
			
            var u = [];

            for (var n in o) {
                u.push(o[n]);
            }
            // console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
			// console.log('XXXXXXXXXXXXXXX après de faire les merge CA/vt List XXXXXXXXXXXXXXXXX');
			//console.log(u);
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
exports.getES = getES;

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
