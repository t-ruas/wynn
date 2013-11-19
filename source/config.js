'use strict';

var _keygrip = require('keygrip');

module.exports = {
    port: 8090,
    staticRoot: './static',
    tempsChargReel:60,
    tempsChargTalend:2,
    tempsComptSet:5,
    jourCalcMoyeEnt:7,
    jour1an:364,
    authCookieName: 'darty_wynn_auth',
    keys: _keygrip(['azertyuiop', 'qsdfghjklm', 'wxcvbn'], 'sha256', 'hex'),
    elasticSearch: {
        host: 'localhost',													// adresse de la machine sur laquelle est stockée le LB ES
        port: 9200,
        index: 'wynn', 														// nom de l'index 
        typeEnt: 'entrees', 													// nom du type pour les entrées
		typeBud: 'budget', 													// nom du type pour les budgets
		typeLv: 'lv',
		chunk_size : {
			DETAILS_CHUNK_SIZE : 10000,
			INDICATEURS_CHUNK_SIZE : 999, // non utilisé, inutile ! 
			ENTREES_CHUNK_SIZE : 999, // non utilisé, inutile ! 
		}		// nom du type pour les lignes de vente
    },
};
