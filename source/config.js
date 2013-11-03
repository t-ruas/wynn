'use strict';

var _keygrip = require('keygrip');

module.exports = {
    port: 8081,
    staticRoot: './static',
    tempsChargReel:2,
    tempsChargTalend:2,
    tempsComptSet:15,
    jourCalcMoyeEnt:7,
    jour1an:364,
    authCookieName: 'darty_wynn_auth',
    keys: _keygrip(['azertyuiop', 'qsdfghjklm', 'wxcvbn'], 'sha256', 'hex'),
    elasticSearch: {
        host: 'localhost',
        port: 9200,
        index: 'wynn',
        indexEnt: 'entrees_mag'
    },
};
