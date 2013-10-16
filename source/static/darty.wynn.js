
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
	a.join(','); 
	a=parseInt(a)
    return a;
};

darty.wynn.getPrct = function (a, b) {
    return 100 * a / b;
}

darty.wynn.getEvol = function (a, b) {
    return 100 * (a - b) / b;
}

darty.wynn.formatPrice = function (n) {
    return isNaN(n) ? 0 + ' €': (darty.wynn.priceToStr(n) + ' €');
};

darty.wynn.formatEvo = function (n) {
    return isNaN(n) ? 'n/a' : ((n < 0 ? '- ' : '+ ') + Math.abs(n).toFixed(1) + '%');
};

darty.wynn.formatPrct = function (n) {
    return isNaN(n) ? 'n/a' : (n + '%');
};

darty.wynn.formatConcret = function (n) {
    return isNaN(n) ? 'x' : (n.toFixed(1) + ' %');
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
}

darty.wynn.removeFilters = function(type, dim) {
	obj = darty.wynn.pageData;
		// on récupère le niveau de filtre à enlever 
		var cpt = 0;
		for (var u in obj.filtres) {
			if (u.substring(0,3) == dim)
				cpt=u.substring(3,4);
		} 
		
		// on construit l'url a renvoyer 
		var result = '' 
		var symbol = false;
		for (var n in obj.filtres) {
			if(n.substring(0,3) == 'agg') {
				result += n + '=' +obj.filtres[n]; // pour ne pas mettre l'&
				symbol = true;
			}
			else if (n.substring(0,3) == dim && n.substring(3,4) == cpt) {
				// on exclue de l'url le filtre que l'on enlève
			}
			else {
				if (symbol)
					result+= '&'; 
				result += n + '=' +obj.filtres[n].cd;
				symbol = true;
			}
		}
		
		// on selectionne la redirection logique
		if (result != '' && type == "accueil")
			window.location.assign("http://" + window.location.host + "/accueil?" + result);
		else if (result != '' && type == "details")
			window.location.assign("http://" + window.location.host + "/details?" + result);
		else
			window.location.assign("http://" + window.location.host + "/accueil");
};
