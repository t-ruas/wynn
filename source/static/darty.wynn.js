// fab
var darty = {
    wynn: {
        gui: {},
        config: {
            reqInterval: 2 * 60 * 1000,
			reqTimeout: 30 * 1000,
            refreshInfo: 1 * 1000,
            refreshCa: 5 * 1000,
			quartdheure: 15 * 60 * 1000,
            // timeDiff : 0,
            timeDiff : 2*60*1000,
			linePerPage : 100,
			requestAccueil : 'indicateurs',
			requestDetails : 'details',
			requestEntrees : 'indicateursEnt'
        },
        QTE_DAY_LINES : 0, 
        fromClick : true, 
        fields : ['ca', 'ca2m', 'ca1y', 'caGlobal1y', 'caGlobal2m', 'vt2m', 'vt1y',
		'caPoidsOaGlobal2m', 'caPoidsRemGlobal2m', 'caPoidsAccGlobal2m',
		'caPoidsServGlobal2m', 'caPoidsOa1y','caPoidsRem1y','caPoidsAcc1y','caPoidsServ1y',
		'caPoidsOa2m','caPoidsRem2m','caPoidsAcc2m','caPoidsServ2m', 'qtePm', 'qtePm1y', 'qtePmGlobal2m']
    }
};
// var 
    
var opts = {
  lines: 12, // The number of lines to draw
  length: 50, // The length of each line
  width: 17, // The line thickness
  radius: 50, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 17, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: 'red', // #rgb or #rrggbb or array of colors
  speed: 1.0, // Rounds per second
  trail: 64, // Afterglow percentage
  shadow: true, // Whether to render a shadow
  hwaccel: true, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: 'auto', // Top position relative to parent in px
  left: 'auto' // Left position relative to parent in px
};
var spinner = new Spinner(opts).spin();
var target = $('#mainContent div#spin');

darty.wynn.clone = function(x) { // USELESS ?! 
	try {
		var copy = JSON.parse(JSON.stringify(x));
	} catch (e) {
	}
	return copy;
}

darty.wynn.priceToStr = function (n) {
	var a = Math.abs(n).toFixed(0).toString().split('.');
	a[0] = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	a.join(','); 
	return a;
};

darty.wynn.getPrct = function (a, b) {
	// console.log('Poids Acc : '  + a + ' CA2M : ' + b + 'results : ' + a/(a+b)*100);
    return isNaN(a) || isNaN(b) || (b) == 0 ? 0 : a/b*100;
}

darty.wynn.getEvol = function (a, b) { // b : 1y, a : 2m 
	// console.log('getEvol - b : ' + b + ' a != 0 : ' + a);
	if(b > 0 && a == 0) {
		return -100;
	} else {
		return typeof (100 * (a - b) / b) === 'number' ? 100 * (a - b) / b : '-';
	}
}

darty.wynn.formatPrice = function (n) {
    return isNaN(n) ? 0 + ' €': (darty.wynn.priceToStr(n)) + ' €';
};

darty.wynn.formatEvo = function (n) { // pour maquille le pourcentage d'evo 
	if (n == 'Infinity' || isNaN(n)){
		// console.log('Format Evo :',isNaN(n), isFinite(n));
		return '- %';}
	else {
		// console.log('Format Evo :',isNaN(n), isFinite(n));
		return ((n < 0 ? '-' : '') + Math.abs(n).toFixed(1) + ' %');
	}
};

darty.wynn.formatPrct = function (n) { // pour maquiller le pourcentage 
	if (n == 'Infinity' || isNaN(n))
		return '- %';
	else 
		return ((n < 0 ? '-' : '') + Math.abs(n).toFixed(1) + ' %');
};

darty.wynn.formatConcret = function (n) {
    return isNaN(n) ? 'x' : (n.toFixed(1) + ' %');
};

darty.wynn.formatTime = function (d) {
    return darty.wynn.pad(d.getHours(), 2) + ':' + darty.wynn.pad(d.getMinutes(), 2) + ':' + darty.wynn.pad(d.getSeconds(), 2);
};

darty.wynn.formatTimeSecondLess = function (d) {
    return darty.wynn.pad(d.getHours(), 2) + ':' + darty.wynn.pad(d.getMinutes(), 2);
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
        case 0: return '0';
        case 1: return max === 4 ? '1' : '2';
        case 2: return max === 4 ? '2' : '3';
        case 3: return '3';
		default: return '0';
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

darty.wynn.checkBrowser = function () { // fonctionne ! 
	var browser = navigator.appName;
	var search_code = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
	var version = parseFloat(RegExp.$1);
	if (browser == 'Microsoft Internet Explorer' || browser == 'Internet Explorer')
		return false;
	else 
		return true;
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
}

darty.wynn.getMaxFilter = function(dim) { // retourne chaine vide ou indice max ! 
	var max = 0 , flag = false;
	var f = darty.wynn.makeSimpleFiltersClone();
	// console.log(f, max, flag);
	if (typeof dim != 'undefined') {
		for (var u in f) {
			// console.log('test getMaxFilter', u, 'dimension : ', dim)
			if (u.substring(0,3) == dim) {
				max = max > parseInt(u.substring(3,4)) ? max : u.substring(3,4);
				// console.log('test getMaxFilter', u.substring(3,4), 'Max : ', max)
				flag = true;
			}
		}
	}
	else
		for (var h in f) {
			if (h.substring(0,3) != 'agg') {
				max = max > parseInt(u.substring(3,4)) ? max : u.substring(3,4);
				// console.log('test getMaxFilter', u.substring(3,4), 'Max : ', max)
				flag = true;
			}
		}
	max = parseInt(max);
	// console.log('typeof max :', typeof max, 'val de max : ', max, 'Dimension : ', dim)
	// console.log("Réussite de getMaxFilter ? ",flag);
	return flag ? parseInt(max) : '';
}

darty.wynn.setFilters = function(type) {
	var cont = {};
	cont.prdRep = 'Tous Produits';
	cont.orgRep = 'Darty France';
	cont.prd = '';
	cont.org = '';
	cont.intro1 = '<div id="ariane';
	cont.intro2 = '>'
	cont.endReq = '</div>'
	cont.org_close = '<a><span id="close_org" class="close"><</span></a>';
	cont.prd_close = '<a><span id="close_prd" class="close"><</span></a>';
	var obj = darty.wynn.pageData;
	var val = 0;
	var rendu='';
	for(var index in obj.filtres) { 
		if (index.substring(0,3) == 'org' && parseInt(index.substring(3,4)) == darty.wynn.getMaxFilter('org')) {
			cont.org = '<span id="" class="org"> ';
			cont.org += obj.filtres[index].lib.length > 0 ? obj.filtres[index].lib +' </span>': obj.filtres[index].cd +' </span>';
		}
		if (index.substring(0,3) == 'prd' && parseInt(index.substring(3,4)) == darty.wynn.getMaxFilter('prd')) {
			cont.prd = '<span id="" class="prd"> ';
			cont.prd += obj.filtres[index].lib.length > 0 ? obj.filtres[index].lib +' </span>': obj.filtres[index].cd + ' </span>';
		}
	}
	// rendu = '<div id='blueContentTop'><p id='lastUpdate'></p></div>'
	rendu = "<a><span id='home'>Accueil</span></a><div id='ariane'>";
	rendu += (cont.org != '') ? '<div id="ariane1" class="org"><a><span id="close_org" class="close"><</span></a><div id="ariane_org">'+cont.org+'</div></div>': 
	'<div id="ariane1" class="org"><div id="ariane_org"><span id="" class="org">'+cont.orgRep+'</span></div></div>';
	rendu += (cont.prd != '') ? '<div id="ariane2" class="prd"><a><span id="close_prd" class="close"><</span></a><div id="ariane_prd">'+cont.prd+'</div></div></div>' : 
	'<div id="ariane2" class="prd"><div id="ariane_prd"><span id="" class="prd">'+cont.prdRep+'</span></div></div></div>';
	
	$('#bouton-home').append(rendu);
	if (type == 'details') {
		var agg = 'span#'+obj.filtres.agg.substring(0,3);
		$(agg).removeClass().addClass('noActive');
	}
};