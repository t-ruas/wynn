
var darty = {
    wynn: {
        gui: {},
        config: {
            reqInterval: 2 * 60 * 1000,
            reqTimeout: 30 * 1000,
            refreshInfo: 1 * 1000,
            refreshCa: 0.5 * 1000,
        },
    }
};

darty.wynn.priceToStr = function (n) {
    var a = n.toString().split('.');
    a[0] = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return a.join(',');
};

darty.wynn.getPrct = function (a, b) {
    return 100 * a / b;
}

darty.wynn.getEvol = function (a, b) {
    return 100 * (a - b) / b;
}

darty.wynn.formatPrice = function (n) {
    return isNaN(n) ? 'n/a' : (darty.wynn.priceToStr(n) + '€');
};

darty.wynn.formatEvo = function (n) {
    return isNaN(n) ? 'n/a' : ((n < 0 ? '- ' : '+ ') + n + '%');
};

darty.wynn.formatPrct = function (n) {
    return isNaN(n) ? 'n/a' : (n + '%');
};

darty.wynn.formatConcret = function (n) {
    return isNaN(n) ? 'x' : (n.toFixed(2) + ' %');
};

darty.wynn.formatTime = function (d) {
    return darty.wynn.pad(d.getHours(), 2) + ':' + darty.wynn.pad(d.getMinutes(), 2) + ':' + darty.wynn.pad(d.getSeconds(), 2);
};

darty.wynn.pad = function (str, n, c) {
    str += '';
    while (str.length < n) {
        str = (c || '0') + str;
    }
    return str;
};

// Associe une class css à un score, selon le score maximal possible sur l'indicateur.
darty.wynn.score2Cls = function (score, max) {
    switch (score) {
        case 0: return 'score_0';
        case 1: return max === 4 ? 'score_1' : 'score_2';
        case 2: return max === 4 ? 'score_2' : 'score_3';
        case 3: return 'score_3';
    }
};

// Retourne une version de la liste des filtres sans les libellés.
darty.wynn.makeSimpleFiltersClone = function () {
    var f = darty.wynn.pageData.filtres;
    var o = {};
    for (var n in f) {
        o[n] = typeof f[n] === 'string' ? f[n] : f[n].cd;
    }
    return o;
}

darty.wynn.makeQuery = function (o) {
    var args = [];
    for (var n in o) {
        args.push(n + '=' + o[n]);
    }
    return args.join('&');
};
