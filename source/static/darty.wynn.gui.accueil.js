darty.wynn.gui.accueil = (function () { // fab

	// tablesorter doc : http://tablesorter.com/docs

	var _w = darty.wynn; 
    var refreshTimer = null;
    var refreshTimerCa = null;
    var lastRefresh = null;
    var nextRefresh = null;
    var timer = 120;
	var derniereSync;
	var dernierTimer;
	var diffCaDebut;
	var decoupage = 240;
	var cumul = 0;
	var ca2minutes;
	var dernierCa;
	var diffCaParDecoupage; 
	var minMax;
	
    function refreshPage() { // controler de la page 
		// console.log('RefreshPage : ', new Date().getTime());
		var counter = 0;
		var data = {};
		
		/* On sette la transition : */
		$('#mainContent div#spin').length === 0 && _w.fromClick ? $('#mainContent').prepend("<div id=\"spin\"></div>") : '';
		$('#mainContent div#spin').length === 1 && _w.fromClick ? $('#mainContent div#spin').prepend(spinner.el) : '';
		typeof sessionStorage.QTE_DAY_LINES !== 'undefined' ? ($('#mainContent div#spin').length === 1 && _w.fromClick ? $('#mainContent div#spin').prepend("<h3>Processing " + sessionStorage.QTE_DAY_LINES + " documents</h3>") : '' ) : ''
		_w.fromClick = true; // On reset la condition

        darty.wynn.data.getIndicateurs(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
        	// console.log('getIndicateurs : ', new Date().getTime());
        	if (error) {
				counter += 1;
            } else { 
				counter += 1; // TODO :  sécurisé ?! 
				data.indicateurs = result;
			}
			if (counter > 1) {
				data.entrees = {};
				doWork(data)
				// spinner.stop();
			}
		});
		
		darty.wynn.data.getIndicateursEnt(darty.wynn.makeSimpleFiltersClone(), function (error, resultEnt) {
			// console.log('getIndicateursEnt : ', new Date().getTime());
			if (error) { 
				// console.log('Erreur lors du chargement des valeurs : page accueil - entrées');
				counter += 1;
			} else { // SUCCESS
				counter += 1; // TODO :  sécurisé ?! 
				data.entrees = resultEnt;
			}
			if (counter > 1) {
				data.entrees = {};
				doWork(data)
			}
		});
	}
	
	function doWork(data) {
		var result = {};
		var f= _w.makeSimpleFiltersClone();
		if(typeof data.entrees !== 'undefined') {
			result = {
				ent: typeof data.entrees.ent2m != 'undefined' ? data.entrees.ent2m : '-',
				entEvol: darty.wynn.formatEvo(darty.wynn.getEvol(data.entrees.ent2m,data.entrees.ent1y)),
				entCoul: darty.wynn.score2Cls(darty.wynn.data.computeScore(data.entrees.ent2m, data.entrees.ent1y, data.entrees.entGlobal2m), 3)
			};
		}
		// console.log('Result avec seulement les entrees',result);
		if(typeof data.indicateurs !== 'undefined') {
			result.ca = typeof data.indicateurs.ca2m != 'undefined' ? data.indicateurs.ca2m : '-';
			if (f.org4 && f.agg=='org4') {
				result.caEvol = parseFloat(data.indicateurs.prime).toFixed(2).toString().replace('.',' - ');
				// console.log('BYPASS Prime', typeof result.caEvol);
				result.caCoul = darty.wynn.score2Cls(3,3);
			} else {
				result.caEvol = darty.wynn.formatEvo(darty.wynn.getEvol(data.indicateurs.ca2m,data.indicateurs.ca1y));
				result.caCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(data.indicateurs.ca2m, data.indicateurs.ca1y, data.indicateurs.caGlobal2m, darty.wynn.pageData.budget.CA), 4);
			}
			result.poidsAcc = darty.wynn.formatPrct(darty.wynn.getPrct(data.indicateurs.caPoidsAcc2m, data.indicateurs.ca2m));
			result.poidsAccCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(darty.wynn.getPrct(data.indicateurs.caPoidsAcc2m, data.indicateurs.ca2m),
																						darty.wynn.getPrct(data.indicateurs.caPoidsAcc1y, data.indicateurs.ca1y),
																						darty.wynn.getPrct(data.indicateurs.caPoidsAccGlobal2m, data.indicateurs.caGlobal2m),
																						darty.wynn.pageData.budget.ACCESSOIRES), 4);
			
			result.poidsServ = darty.wynn.formatPrct(darty.wynn.getPrct(data.indicateurs.caPoidsServ2m, data.indicateurs.ca2m));
			result.poidsServCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(darty.wynn.getPrct(data.indicateurs.caPoidsServ2m, data.indicateurs.ca2m),
																						darty.wynn.getPrct(data.indicateurs.caPoidsServ1y, data.indicateurs.ca1y),
																						darty.wynn.getPrct(data.indicateurs.caPoidsServGlobal2m, data.indicateurs.caGlobal2m),
																						darty.wynn.pageData.budget.SERVICES), 4);
			
			result.poidsRem = darty.wynn.formatPrct(darty.wynn.getPrct(data.indicateurs.caPoidsRem2m, data.indicateurs.ca2m)); // TODO : appliquer une formule particulière ? 
			result.poidsRemCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(darty.wynn.getPrct(data.indicateurs.caPoidsRem2m, data.indicateurs.ca2m),
																						darty.wynn.getPrct(data.indicateurs.caPoidsRem1y, data.indicateurs.ca1y),
																						darty.wynn.getPrct(data.indicateurs.caPoidsRemGlobal2m, data.indicateurs.caGlobal2m),
																						darty.wynn.pageData.budget.REMISE), 4);
			
			result.poidsOa = darty.wynn.formatPrct(darty.wynn.getPrct(data.indicateurs.caPoidsOa2m, data.indicateurs.qtePm));
			result.poidsOaCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(darty.wynn.getPrct(data.indicateurs.caPoidsOa2m, data.indicateurs.qtePm),
																						darty.wynn.getPrct(data.indicateurs.caPoidsOa1y, data.indicateurs.qtePm1y),
																						darty.wynn.getPrct(data.indicateurs.caPoidsOaGlobal2m, data.indicateurs.qtePmGlobal2m),
																						darty.wynn.pageData.budget.OFFRESACTIVES), 4);
			

			/*result.poidsOa = darty.wynn.formatPrct(darty.wynn.getPrct(data.indicateurs.caPoidsOa2m, data.indicateurs.ca2m));
			result.poidsOaCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(darty.wynn.getPrct(data.indicateurs.caPoidsOa2m, data.indicateurs.ca2m),
																						darty.wynn.getPrct(data.indicateurs.caPoidsOa1y, data.indicateurs.ca1y),
																						darty.wynn.getPrct(data.indicateurs.caPoidsOaGlobal2m, data.indicateurs.caGlobal2m),
																						darty.wynn.pageData.budget.OFFRESACTIVES), 4);
			*/
			result.vt = typeof data.indicateurs.vt2m != 'undefined' ? data.indicateurs.vt2m : '-';
			result.vtEvol = darty.wynn.formatEvo(darty.wynn.getEvol(data.indicateurs.vt2m,data.indicateurs.vt1y));
			result.vtCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(data.indicateurs.vt2m, data.indicateurs.vt1y, data.indicateurs.vtGlobal2m), 3);
			
			result.concret = darty.wynn.formatPrct(data.indicateurs.vt2m / result.ent2m);
			result.concretEvol = darty.wynn.formatEvo(darty.wynn.getEvol(data.indicateurs.vt2m / result.ent2m, data.indicateurs.vt1y / result.ent1y));
			result.concretCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(data.indicateurs.vt2m / result.ent2m, data.indicateurs.vt1y / result.ent1y, data.indicateurs.vtGlobal2m / result.entGlobal2m), 3);
			
			dernierCa = typeof data.indicateurs.ca != 'undefined' ? data.indicateurs.ca : 0;
			ca2minutes = typeof data.indicateurs.ca2m != 'undefined' ? data.indicateurs.ca2m : 0;
		}
		_w.fromClick = false;
		refreshTimer = window.setTimeout(refreshPage, darty.wynn.config.reqInterval); // TODO : VERIFIER pas de récursivité ! 
		refreshTimerCa = refreshTimer;
		lastRefresh = new Date();
		nextRefresh = new Date(lastRefresh.getTime() + darty.wynn.config.reqInterval);
		
		spinner.stop(); // On enlève le spinner
		$('#mainContent div#spin').remove(); // on enlève le container et on met à jour la valeur si elle a évoluée.
		typeof data.indicateurs === 'undefined' ? '' : (typeof sessionStorage.QTE_DAY_LINES === 'undefined' ? sessionStorage.QTE_DAY_LINES = data.indicateurs.QTE_LINES : (sessionStorage.QTE_DAY_LINES !== data.indicateurs.QTE_LINES ? sessionStorage.QTE_DAY_LINES = data.indicateurs.QTE_LINES : ''))
		

		if (!darty.wynn.checkBrowser()) {// false = IE8 ! 
			var pagefn = doT.template($('#indicateurs').html());
		}
		else {
			var pagefn = doT.template($('#indicateurs').text());
		}
		$('#mainContentMiddle_home').html(pagefn(result));
		// console.log('Data formattées pour Dashboard ', result)
		modificationCA();
	}
	
    function start() {

        $(document).ready(function () {
        refreshPage();  
		
        window.setInterval(function () { 
			var jour = new Date();
			var text = parseInt(jour.getDate()) + '/'+(parseInt(jour.getMonth())+1) + '/'+parseInt(jour.getYear()%100)
			if (refreshTimer) {
				$('#lastUpdate').remove();
                $('#blueContentTop').prepend('<p id="lastUpdate">Dernière Màj: '+text+' à '+darty.wynn.formatTimeSecondLess(new Date(lastRefresh.getTime() - darty.wynn.config.timeDiff)) + '<br />Prochaine Màj: ' + Math.ceil((nextRefresh - new Date()) / 1000) + 's</p>');
			}
			else {
				$('#lastUpdate').remove();
                $('#blueContentTop').prepend('<p id="lastUpdate"></p>');
			}
            refreshTimerDisplay = Math.ceil((nextRefresh - new Date()) / 1000);
        }, darty.wynn.config.refreshInfo);
		
        window.setInterval(function () {
            if (refreshTimerCa) {
            	modificationCA();	
            } else {
            }
        }, darty.wynn.config.refreshCa);
        
		$(document).on('click','p#lastUpdate', function () {
            if (refreshTimer) {
                window.clearTimeout(refreshTimer);
                refreshTimer = null;
                refreshPage();
            }
        });
        
		$(document).on('click', 'span.close', function () { 
			darty.wynn.removeFilters('accueil',$(this).parent().parent().attr('class'));
		});
		
        $(document).on('click','div#CA_chiffre', function () {
            var toto = makeDrillUrl();
			window.location.assign(toto);
        });
        
		$(document).on('click', 'span#home', function () {
			window.location.assign("http://" + window.location.host + "/accueil?agg=prd1");
		});
        
		darty.wynn.setFilters('accueil');
		// console.log('End Loading : ', new Date().getTime());
	});
}
    	
    function modificationCA (){
    	diffCaDebut= calcDiffCa();
    	
    	diffCaParDecoupage = Math.floor (diffCaDebut / decoupage);
    	minMax = returnMinMax (diffCaParDecoupage);
    	recalculCaDecoupage (minMax);
	}
    
    function checkEntrees(statEntrees){
		if(typeof statEntrees.entDat === 'undefined')
			return false;
    	var entrees = statEntrees.entDat.toString();
		var lastRefresh15m = new Date();
		lastRefresh15m.setTime(lastRefresh);
		lastRefresh15m.setTime(lastRefresh15m.getTime() - darty.wynn.config.quartdheure);
		var dernierChargEnt = new Date (entrees.slice (0,4), entrees.slice (4,6) -1, entrees.slice (6,8), entrees.slice (6,8), entrees.slice (8,10), 0);
		
    	if (darty.wynn.getEvol(entrees.ent2m, entrees.ent1y)   > 100 
			|| darty.wynn.getEvol(entrees.ent2m, entrees.ent1y)   < -100 
			|| isNaN(darty.wynn.getEvol(entrees.ent2m, entrees.ent1y)) ){
			$("div#blueContentTop").append ("<p id='msg'>Evolution d'entrée incohérente.</p>");    		
    	}
    	if  (dernierChargEnt.getTime() < lastRefresh15m.getTime()){
    		$("div#blueContentTop").append ("<p id='msg'>Pas d'entrées depuis : " + darty.wynn.formatTime(dernierChargEnt) + "</p>");    
    	}
    }
    	
	function getAleaNomb (min, max) {
    	return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function calcDiffCa (){
		return dernierCa - ca2minutes;
	}
	
	function recalculCaDecoupage ( aTester) {
		
		switch (Math.ceil((nextRefresh - new Date()) / 1000))  // accueil.html modifier le prepend pour qu'il colle au template ! 
		{
			case 120:
			var vraiCA = darty.wynn.priceToStr(ca2minutes);
			cumul=0;
			$('#CA_chiffre').remove();	
			$("#CA_content").prepend('<div id="CA_chiffre"><p>'+vraiCA+' €</p></div>');
			break;
			
			default :
			var aleaNumb = getAleaNomb (minMax.min, minMax.max);
			cumul += aleaNumb;
			var aAfficher= darty.wynn.priceToStr(ca2minutes + cumul);
			 
			$('#CA_chiffre').remove();
			$("#CA_content").prepend('<div id="CA_chiffre"><p>'+aAfficher+" €</p></div>");		
		}
	}
	
	function getUrl () { // TODO : utilisé ? 
		var search = window.location.search;
		search.lastIndexOf("prd");
	}
	
	function returnMinMax (num) {
		var minVal = Math.floor(num *0.9);
		var maxVal = Math.floor(num *1.1);
		return {min:  minVal, max: maxVal};
	}
	
	function setTableauCorres () {
		var tableCorresp = [
			 {id : ca, couleur : data.caPT}
			,{id : acc, couleur : data.caPT}
			,{id : ca, couleur : data.caPT}
			,{id : ca, couleur : data.caPT}  
			]
	}
	
	function calcEvol (_1y, _2m) {
		switch (_2m)
		{
		case 0:
		return 	0;
		break; 
		
		default :
		return  Math.floor((_2m / _1y -1) *100);
		}
	}
	
	function makeDrillUrl() {	
		var param = window.location.search;
		var complet = "";
		// console.log('makeDrillUrl ! ');
		if (param == ""){
			// console.log('Param is empty ! ');
			complet = "http://" + window.location.host + "/details?agg=prd1";	
		}
   		else {
			var split = param.split('&');	
			split[0] = split[0].substring(1, split[0].length);
			var end = "http://" + window.location.host + "/details";
			
			for (var i in split) {
				if(split[i].substring(0,3) == 'agg') {
					var valAgg = split[i].substring(4,8);
					complet.length == 0 ? complet = end + "?agg=" + valAgg : complet += "agg="+valAgg;
				}
				else if(split[i].substring(0,3) == 'prd' || split[i].substring(0,3) == 'org') {
					complet.length == 0 ? complet = end + "?"+split[i] : complet += "&" + split[i];
				}
				else {
					// console.log('split[i]');
				}
			}
   		}
		return complet;
    }
	
    return {
        start: start,
        calcEvol: calcEvol
    };
})();
