// fab
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
	//var b = 
    var a = Math.abs(n).toFixed(0).toString().split('.');
	
	// console.log(a);
    a[0] = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	// console.log('a de 0 vaut : ' + a[0]);
	a.join(','); 
	//a=parseInt(a)
	// console.log( 'voici a  : ' + a + ' b : ' );
    return a;
};

darty.wynn.getPrct = function (a, b) {
    return 100 * a / b;
}

darty.wynn.getEvol = function (a, b) {
    return 100 * (a - b) / b;
}

darty.wynn.formatPrice = function (n) {
    return isNaN(n) ? 0 + ' €': (darty.wynn.priceToStr(n)) + ' €';
};

darty.wynn.formatEvo = function (n) {
	//console.log(n);
    return isNaN(n) ? '- %' : ((n < 0 ? '-' : '') + Math.abs(n).toFixed(1) + '%');
};

darty.wynn.formatPrct = function (n) {
	// console.log('Valeur n : ' + n );
    return isNaN(n) ? ' 0 %' : (Math.abs(n).toFixed(1) + ' %');
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
        case 0: return '0';
        case 1: return max === 4 ? '1' : '2';
        case 2: return max === 4 ? '2' : '3';
        case 3: return '3';
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
}

darty.wynn.setFilters = function(type) {
	var text = {};
	text.prdRep = 'Tous Produits';
	text.orgRep = 'Darty France';
	text.prd = '';
	text.org = '';
	text.intro1 = '<div id="ariane';
	text.intro2 = '>'
	text.endReq = '</div>'
	text.org_close = '<a><span id="close_org" class="close"><</span></a>';
	text.prd_close = '<a><span id="close_prod" class="close"><</span></a>';
	var obj = darty.wynn.pageData;
	for(var index in obj.filtres) { 
		if (index.substring(0,3) == 'org')
			text.org = '<span id="'+obj.filtres[index].lib+'" class="org"> '+obj.filtres[index].lib +' </span>'+'</div>'
		else if (index.substring(0,3) == 'prd')
			text.prd = '<span id="'+obj.filtres[index].lib+'" class="prd"> '+obj.filtres[index].lib +' </span>'+'</div>';
	}
	// on enlève les 2 blocs à refaire ariane1 => Produits, ariane2 => Lieux
							
	$('#bouton-home').append("<a><span id='home'>Accueil</span></a><div id='ariane'></div>").each(function(){
		if (text.org != '') // si pas de filtre org 
			$("#ariane").append(text.intro1+'2" class="org">'+text.org_close+'<div id="ariane_org"'+text.intro2+text.org+'</div>'+text.endReq);
		else   // si filtre org 
			$("#ariane").append(text.intro1+'2" class="org"><div id="ariane_org"'+text.intro2+text.orgRep+'</div>'+text.endReq); 
		if (text.prd != '')  // si pas de filtre prd
			$("#ariane").append(text.intro1+'1" class="prd">'+text.prd_close+'<div id="ariane_prod"'+text.intro2+text.prd+'</div>'+text.endReq); 
		else  // si filtre prd
			$("#ariane").append(text.intro1+'1" class="prd"><div id="ariane_prod"'+text.intro2+text.prdRep+'</div>'+text.endReq); 
		if (type == 'details') {
			var agg = 'span#'+obj.filtres.agg.substring(0,3);
			$(agg).removeClass().addClass('noActive');
			
		}
	});
};