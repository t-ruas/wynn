
var darty = {
    wynn: {
        gui: {},
        config: {
            reqInterval: 2 * 60 * 1000,
            reqTimeout: 30 * 1000,
        },
    }
};

darty.wynn.priceToStr = function (n) {
    var a = n.toString().split('.');
    a[0] = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return a.join(',');
};

darty.wynn.formatEvo = function (n) {
    return isNaN(n) ? 'x' : n < 0 ? '- ' : '+ ' + n + ' %';
};

darty.wynn.formatPrct = function (n) {
    return isNaN(n) ? 'x' : (n + ' %');
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
}

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
