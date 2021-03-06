'use strict';

var _keygrip = require('keygrip');

module.exports = {
    version : 1.12,
	updateLogs : 5000,
	nbEsQueries: 0,
	DED_year: 0, 
	// à partir de l'an 2000, donc pour 2013 : 13
	DED_month: 0, 
	DED_day: 0,  
	port: 8090,
    staticRoot: './static',
    tempsChargReel:0,
    tempsChargTalend:2,
    tempsComptSet:5,
    jourCalcMoyeEnt:7,
    jour1an: 364,
	jour1week: 2,
    authCookieName: 'darty_wynn_auth',
    keys: _keygrip(['azertyuiop', 'qsdfghjklm', 'wxcvbn'], 'sha256', 'hex'),
    elasticSearch: {
        host: 'hdpesprd1', //.intranet.darty.fr',											// adresse de la machine sur laquelle est stockée le LB ES
        // host: '10.132.20.115',											// adresse de la machine sur laquelle est stockée le LB ES
        // host: 'localhost',											// adresse de la machine sur laquelle est stockée le LB ES
        port: 9200,
        index: 'wynn_idx', 										        // nom de l'index 
        typeEnt: 'entrees', 											// nom du type pour les entrées
		typeBud: 'budget', 												// nom du type pour les budgets
		typeLv: 'lv',
		chunk_size : {
			DETAILS_CHUNK_SIZE : 10000,
			INDICATEURS_CHUNK_SIZE : 999, // non utilisé, inutile ! 
			ENTREES_CHUNK_SIZE : 999, // non utilisé, inutile ! 
			VENTES_CHUNK_SIZE : 10000000, // non utilisé, inutile ! 
		}
    },
    metrics : {
    	port : 9091
    }
};
