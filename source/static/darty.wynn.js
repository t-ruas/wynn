// fab
var darty = {
    wynn: {
        gui: {},
        config: {
            reqInterval: 2 * 60 * 1000,
			reqTimeout: 30 * 1000,
            refreshInfo: 1 * 1000,
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
		'caPoidsOa2m','caPoidsRem2m','caPoidsAcc2m','caPoidsServ2m', 'qtePm2m', 'qtePm1y', 'qtePmGlobal2m', 
		'qteCodic2m', 'qteCodic1y', 'qteCodicGlobal2m'],
		refreshCA : {
		   	freqMax : 6000, // en ms
	    	freqMin : 4000, // en ms
	    	seuilMin : 0.7,
	    	seuilMax : 1.3,
	    	nbValFixed : 9, //en pourcent pour fixer la pente 
	    	/* NbValFIxed doit correspondre à 2 élements en % :
	    	6000-4000+4000 = 5000 
	    	120 / 5 = 24 
	    	24 * 9 / 100 ~= 2
	    	*/
    	}
    }
};
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

darty.wynn.orderResult =function (data) { // a dégager pour être putté sur la requete ES ! 
		var echange = false;
		do {
			echange = false;
			for (var i = 0; i < data.length -1; i++)
			{
				if (data[i].ca2m < data[i+1].ca2m)
				{
					var variable1234 = data[i];
					data[i] = data[i+1];
					data[i+1] = variable1234;
					echange = true;
				}
			}
		} while (echange)
		return data;
    }

darty.wynn.clone = function(x) { // USELESS ?! 
	try {
		var copy = JSON.parse(JSON.stringify(x));
	} catch (e) {
	}
	return copy;
}

darty.wynn.priceToStr = function (n) {
	var neg = n < 0 ? true : false;
	var a = Math.abs(n).toFixed(0).toString().split('.');
	a[0] = neg ? '-'+a[0] : a[0];
	a[0] = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	a.join(',');
	return a;
}
darty.wynn.getPrct = function (a, b) {
	return isNaN(a) || isNaN(b) || (b) == 0 ? 0 : a/b*100;
}
darty.wynn.getEvol = function (a, b) { // b : 1y, a : 2m 
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
	if (darty.wynn.pageData.filtres.agg === 'org5') {
		if (n === "NaN")
			return "n/c"
		else 
			return n;
	}
	if (n == 'Infinity' || isNaN(n)){
		return '- %';}
	else {
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
	var h = darty.wynn.pageData;
	var result = [];
	var cpt = -1;
	for (var u in h.filtres) { // on récupère le niveau de filtre à enlever 
		if (u.substring(0,3) == dim)
			cpt=u.substring(3,4);
	} 
	if (cpt != -1) { // un filtre peut être enlevé
		// on delete le filtre 
		delete h.filtres[dim+cpt]
		for (var m in h.filtres) {
			data = {};
			if (m === 'agg')
				data[m] = h.filtres[m].substring(3,4) == 1 ? h.filtres[m] : h.filtres[m].substring(0,3)+''+(parseInt(h.filtres[m].substring(3,4))-1);
			else
				data[m] = h.filtres[m].cd
			result.push(m+'='+data[m])
		}
	}
	if (type == "accueil")
		window.location.assign("/accueil?" + result.join('&'));
	else
		window.location.assign("/details?" + result.join('&'));
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
				flag = true;
			}
		}
	max = parseInt(max);
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
	var c = darty.wynn.pageData;
	var val = 0;
	var rendu='';
	for(var index in c.filtres) { 
		if (index.substring(0,3) == 'org' && parseInt(index.substring(3,4)) == darty.wynn.getMaxFilter('org')) {
			cont.org = '<span id="" class="org"><acronym title="'+c.filtres[index].cd+'"> ';
			cont.org += c.filtres[index].lib.length > 0 ? c.filtres[index].lib +' </acronym></span>': c.filtres[index].cd +' </acronym></span>';
		}
		if (index.substring(0,3) == 'prd' && parseInt(index.substring(3,4)) == darty.wynn.getMaxFilter('prd')) {
			cont.prd = '<span id="" class="prd"><acronym title="'+c.filtres[index].cd+'"> ';
			cont.prd += c.filtres[index].lib.length > 0 ? c.filtres[index].lib +' </acronym></span>': c.filtres[index].cd +' </acronym></span>';
		}
	}
	rendu = "<a><span id='home'>Accueil</span></a><div id='ariane'>";
	rendu += (cont.org != '') ? '<div id="ariane1" class="org"><a><span id="close_org" class="close"><</span></a><div id="ariane_org">'+cont.org+'</div></div>': 
	'<div id="ariane1" class="org"><div id="ariane_org"><span id="" class="org">'+cont.orgRep+'</span></div></div>';
	rendu += (cont.prd != '') ? '<div id="ariane2" class="prd"><a><span id="close_prd" class="close"><</span></a><div id="ariane_prd">'+cont.prd+'</div></div></div>' : 
	'<div id="ariane2" class="prd"><div id="ariane_prd"><span id="" class="prd">'+cont.prdRep+'</span></div></div></div>';
	
	$('#bouton-home').append(rendu);
	if (type == 'details') {
		var agg = 'span#'+c.filtres.agg.substring(0,3);
		$(agg).removeClass().addClass('noActive');
	}
};

jQuery.fn.extend({
   findPos : function() {
       o = jQuery(this).get(0);
       var curleft = o.offsetLeft || 0;
       var curtop = o.offsetTop || 0;
       while (o = o.offsetParent) {
                curleft += o.offsetLeft
                curtop += o.offsetTop
       }
       return {x:curleft,y:curtop};
   }
});