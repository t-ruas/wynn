'use strict';

var _keygrip = require('keygrip');

module.exports = {
    port: 8090,
    staticRoot: './static',
    authCookieName: 'darty_wynn_auth',
    keys: _keygrip(['azertyuiop', 'qsdfghjklm', 'wxcvbn'], 'sha256', 'hex'),
    elasticSearch: {
        host: 'localhost',
        port: 9200,
        index: 'wynn'
    },
};
