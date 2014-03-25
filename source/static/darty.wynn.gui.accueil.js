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
	var cumul = 0;
	var ca2minutes;
	var dernierCa;
	var diffCaParDecoupage; 
	var minMax;
	var tableLineNumber = 0;
	var tabModifCa = [];

    function refreshPage() { // controler de la page 
		var counter = 0;
		var data = {};
		
		/* On sette la transition : */
		$('#mainContent div#spin').length === 0 && _w.fromClick ? $('#mainContent').prepend("<div id=\"spin\"></div>") : '';
		$('#mainContent div#spin').length === 1 && _w.fromClick ? $('#mainContent div#spin').prepend(spinner.el) : '';
		typeof sessionStorage.QTE_DAY_LINES !== 'undefined' ? ($('#mainContent div#spin').length === 1 && _w.fromClick ? $('#mainContent div#spin').prepend("<h3>Processing " + sessionStorage.QTE_DAY_LINES + " documents</h3>") : '' ) : ''
		_w.fromClick = true; // On reset la condition de transition

        darty.wynn.data.getIndicateurs(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
        	// Les données arrivent directement depuis data.js du serveur de getIndicators
        	if (error) {
				counter += 1;
            } else { 
				counter += 1;
				data.indicateurs = result;
			}
			if (counter > 1) {
				data.entrees = {};
				doWork(data) // Fct Principal (formatage des données)
			}
		});
		
		darty.wynn.data.getIndicateursEnt(darty.wynn.makeSimpleFiltersClone(), function (error, resultEnt) {
			if (error) { 
				counter += 1;
			} else { 
				counter += 1; 
				data.entrees = resultEnt;
			}
			if (counter > 1) {
				data.entrees = {};
				doWork(data) // Fct Principal (formatage des données)
			}
		});
	}

	function init_modificationCA() {
		// dernierCa = 2880000; // TODO : REMOVE 
		// Cas à régler :
		// marche aléatoire doit être identique à chaque fois ! 
		// tab[0] et tab[n/2-1] recoivent le /2 ! 
		// Addition de ce qu'il manque / le nombre d'élement, a chacun =) 
		// On peut meme faire pareil pour le temps =)
		
		// todo : remove :
		// ca2minutes = 0;
		// dernierCa = 1000;
	
		// console.log(ca2minutes, dernierCa)

		ca = parseFloat(dernierCa.toFixed(0))>=parseFloat(ca2minutes.toFixed(0)) ? (parseInt(dernierCa - ca2minutes)) : (parseInt(ca2minutes - dernierCa));
		var array = [];
    	var freqMoy = parseFloat((darty.wynn.refreshCA.freqMin + (darty.wynn.refreshCA.freqMax - darty.wynn.refreshCA.freqMin) / 2).toFixed(2));
    	// ok

    	var borneInf = (darty.wynn.refreshCA.freqMin / freqMoy);
    	borneInf = parseFloat(borneInf.toFixed(2)); // ok
    	
    	var borneSup = darty.wynn.refreshCA.freqMax / freqMoy;
    	borneSup = parseFloat(borneSup.toFixed(2)); // ok
    	
    	var nbvals = parseFloat((darty.wynn.config.reqInterval/freqMoy).toFixed(2));
    	var caMoy = parseFloat((ca/(darty.wynn.config.reqInterval/1000)).toFixed(2));

    	/* nbValFixed valeurs sont séttés en dur, les autres se répartissent l'aléatoire ! */
    	var nbValFixe = parseInt((nbvals*darty.wynn.refreshCA.nbValFixed/100).toFixed(0)); // 15% de l'ensemble d'origine ! 
    	var ratioTime = parseFloat((90/100 * freqMoy).toFixed(2));
    	var ratioVal = parseFloat((90/100 * caMoy * (ratioTime/1000)).toFixed(2));
    	for (var r = 0; r < nbValFixe; r++)
    	{
    		if (r == 0)
    			var obj = {val : 0, time : ratioTime};
    		else 
    			var obj = {val : ratioVal,time : ratioTime};
    		array.push(obj);
    	}
    	
    	var sumVal = 0;
    	var sumTime = 0;
    	// calculs du reste de l'ensemble
		for (var i = 0; i < nbvals - nbValFixe; i ++) {
			var valeur = Math.floor((ca/nbvals) * (Math.random() * (darty.wynn.refreshCA.seuilMax*10 - darty.wynn.refreshCA.seuilMin*10 + 1) + darty.wynn.refreshCA.seuilMin*10)/10);
			var temps = Math.floor((freqMoy) *(Math.random() * (borneSup*100 - borneInf*100 + 1) + borneInf*100) / 100);
			var obj = {
				val : valeur,
				time : temps
			}	

			array.push(obj);
			
			sumVal += valeur;
			sumTime += temps;
		}
		sumVal += ratioVal; // on ajoute les valeurs de ca précalculés ! 
		sumTime += 2*ratioTime; // on ajoute le temps précalculé
    	
    	var difCa = dernierCa - sumVal - ca2minutes;
    	var difTime = darty.wynn.config.reqInterval - sumTime;
		
		var timeMod = parseFloat((difTime/(nbvals - nbValFixe)).toFixed(3));
    	var caMod = parseFloat((difCa/(nbvals - nbValFixe)).toFixed(3));
    	
		// Should be removed ! 
    	sumVal = 2*ratioVal; // on ajoute les valeurs de ca précalculés ! 
		sumTime = 2*ratioTime; // on ajoute le temps précalculé
    	
    	for (var i = (nbValFixe); i < nbvals; i++) {
			array[i].time += timeMod;
			array[i].val += caMod;
    		sumVal += array[i].val;
    		sumTime += array[i].time;
    	}

    	var tab1 = [];
    	var tab2 = [];
    	for (var e in array) {
    		if (e%2 == 0) {
    			tab1.push(array[e]);
    		}
    		else {
    			tab2.push(array[e]);
    		}
    	}
    	for (var e in tab2) {
    		tab1.push(tab2[e]);
    	}
    	for (var o in tab1) {
    		if(o == 0){
    			tab1[o].val += parseFloat(ca2minutes.toFixed(0));
    		}
    		else 
    			tab1[o].val += parseInt(tab1[o-1].val);
    	}
    	// console.log(tab1);
    	return tab1;
	};

	function setTabModifCa() {
		tabModifCa = null;
		tabModifCa = [];
		tabModifCa = init_modificationCA();
		// console.log(tabModifCa);
	}

	function setCA(lineToDisplay) {
		// console.log(ca2minutes)
		var line = '';
		var timeToNextDisplay = '';
		if (tabModifCa != []) {
			if (lineToDisplay >= tabModifCa.length)
				return;
			if (typeof lineToDisplay === 'undefined') {
				line = 0;
				timeToNextDisplay = tabModifCa[0].time;
			}
			else {
				for (var k = 0; k < tabModifCa.length; k++) {
					if (lineToDisplay == k) {
						line = k;
						timeToNextDisplay = tabModifCa[k].time;
					}
				}
			}
			if (typeof line === 'number' && typeof timeToNextDisplay === 'number') {
				$('#CA_chiffre>p').remove();
				$('#CA_chiffre').html('<p>'+darty.wynn.priceToStr(tabModifCa[line].val)+' € </p>');
				window.setTimeout(function(){
					var display = line + 1;
					setCA(display);
				}, timeToNextDisplay);
			}
			else
				return;
		}
		else {
			if (dernierCa || ca2minutes) {
				$('#CA_chiffre>p').remove();
				$('#CA_chiffre').html('<p>'+darty.wynn.priceToStr(tabModifCa[line].val)+' € </p>');	
			}
		}
	}

	function doWork(data) {
		var result = {};	// Toutes les données envoyées dans la page client se trouvent dans result
		var f= _w.makeSimpleFiltersClone();
		if(typeof data.entrees !== 'undefined') { // On traite les entrées
			result = {
				ent: typeof data.entrees.ent2m != 'undefined' ? data.entrees.ent2m : '-',
				entEvol: darty.wynn.formatEvo(darty.wynn.getEvol(data.entrees.ent2m,data.entrees.ent1y)),
				entCoul: darty.wynn.score2Cls(darty.wynn.data.computeScore(data.entrees.ent2m, data.entrees.ent1y, data.entrees.entGlobal2m), 3)
			};
		}
		/* On prépare les données afin que les calculs soient effectués */
		if(typeof data.indicateurs !== 'undefined') { 
			result.ca = typeof data.indicateurs.ca2m !== 'undefined' ? data.indicateurs.ca2m : '-';
			if (f.org5 && f.agg=='org5') { // PrimeVendeur
				result.caEvol = parseFloat(data.indicateurs.prime).toFixed(2).toString().replace('.',' - ');
				result.caCoul = darty.wynn.score2Cls(3,3);
			} else {
				result.caEvol = darty.wynn.formatEvo(darty.wynn.getEvol(data.indicateurs.ca2m,data.indicateurs.ca1y));
				result.caCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(data.indicateurs.ca2m, data.indicateurs.ca1y, data.indicateurs.caGlobal2m, darty.wynn.pageData.budget.CA), 4);
			}
			result.montantAcc = darty.wynn.formatPrct(darty.wynn.getPrct(data.indicateurs.caPoidsAcc2m, data.indicateurs.ca2m));
			result.montantAccCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(darty.wynn.getPrct(data.indicateurs.caPoidsAcc2m, data.indicateurs.ca2m),
																						darty.wynn.getPrct(data.indicateurs.caPoidsAcc1y, data.indicateurs.ca1y),
																						darty.wynn.getPrct(data.indicateurs.caPoidsAccGlobal2m, data.indicateurs.caGlobal2m),
																						darty.wynn.pageData.budget.ACCESSOIRES), 4);
			
			var totalRemise = {
				_2m : (parseInt(data.indicateurs.ca2m) + parseInt(data.indicateurs.caPoidsRem2m)),
				_1y : (parseInt(data.indicateurs.ca1y) + parseInt(data.indicateurs.caPoidsRem1y)),
				Global2m : (parseInt(data.indicateurs.caGlobal2m) + parseInt(data.indicateurs.caPoidsRemGlobal2m)),
			};

			result.montantRem = darty.wynn.formatPrct(darty.wynn.getPrct(data.indicateurs.caPoidsRem2m, totalRemise._2m)); // TODO : appliquer une formule particulière ? 
			result.montantRemCoul = 3 - darty.wynn.score2Cls(darty.wynn.data.computeScore(darty.wynn.getPrct(data.indicateurs.caPoidsRem2m, totalRemise._2m),
																						darty.wynn.getPrct(data.indicateurs.caPoidsRem1y, totalRemise._1y),
																						darty.wynn.getPrct(data.indicateurs.caPoidsRemGlobal2m, totalRemise.Global2m),
																						darty.wynn.pageData.budget.REMISE), 4);
			
			result.volumeServ = darty.wynn.formatPrct(darty.wynn.getPrct(data.indicateurs.volPoidsServ2m, data.indicateurs.qtePm2m));
			result.volumeServCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(darty.wynn.getPrct(data.indicateurs.volPoidsServ2m, data.indicateurs.qtePm2m),
																						darty.wynn.getPrct(data.indicateurs.volPoidsServ1y, data.indicateurs.qtePm1y),
																						darty.wynn.getPrct(data.indicateurs.volPoidsServGlobal2m, data.indicateurs.qtePmGlobal2m),
																						darty.wynn.pageData.budget.SERVICES), 4);
			
			
			result.volumeOa = darty.wynn.formatPrct(darty.wynn.getPrct(data.indicateurs.volPoidsOa2m, data.indicateurs.qteCodic2m));
			result.volumeOaCoul = darty.wynn.score2Cls(darty.wynn.data.computeScore(darty.wynn.getPrct(data.indicateurs.volPoidsOa2m, data.indicateurs.qteCodic2m),
																						darty.wynn.getPrct(data.indicateurs.volPoidsOa1y, data.indicateurs.qteCodic1y),
																						darty.wynn.getPrct(data.indicateurs.volPoidsOaGlobal2m, data.indicateurs.qteCodicGlobal2m),
																						darty.wynn.pageData.budget.OFFRESACTIVES), 4);
			
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
		refreshTimer = window.setTimeout(refreshPage, darty.wynn.config.reqInterval);
		refreshTimerCa = refreshTimer;
		lastRefresh = new Date();
		nextRefresh = new Date(lastRefresh.getTime() + darty.wynn.config.reqInterval);
		spinner.stop(); 						// On enlève le spinner puisque la page va être chargée
		$('#mainContent div#spin').remove(); 	// on enlève le container et on met à jour la valeur si elle a évoluée.
		typeof data.indicateurs === 'undefined' ? '' : (typeof sessionStorage.QTE_DAY_LINES === 'undefined' ? sessionStorage.QTE_DAY_LINES = data.indicateurs.QTE_LINES : (sessionStorage.QTE_DAY_LINES !== data.indicateurs.QTE_LINES ? sessionStorage.QTE_DAY_LINES = data.indicateurs.QTE_LINES : ''))
		/* Partie qui s'occupe d'envoyer les données vers la page du client - Templating par dot.js*/
		if (!darty.wynn.checkBrowser()) { 							// Pour récupérer les données dans une page Internet Explorer
			var pagefn = doT.template($('#indicateurs').html());
		}
		else {														// Pour récupérer les données dans tous les autres navigateurs
			var pagefn = doT.template($('#indicateurs').text());
		}
		$('#mainContentMiddle_home').html(pagefn(result));			// Une fois les données récupérées, le templating est ok, on display
		/* Partie qui s'occupe de donner une pente au CA */
		setTabModifCa();
		setCA();
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
			$(document).on('click','p#lastUpdate', function () {
	            if (refreshTimer) {
	                window.clearTimeout(refreshTimer);
	                refreshTimer = null;
	                refreshPage();
	            }
	        });
			$(document).on('click', 'span.close', function () { // Suppression d'un filtre 
				darty.wynn.removeFilters('accueil',$(this).parent().parent().attr('class'));
			});
	        $(document).on('click','div#CA_chiffre', function () {
	            var toto = makeDrillUrl();
	            window.location.assign(toto);
	        });
			$(document).on('click', 'span#home', function () {
				window.location.assign("/accueil?agg=prd1");
			});
			$(document).on('click', 'body', function () {
				setTabModifCa();
			});
			darty.wynn.setFilters('accueil');
		});
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
	
	
	function getUrl () { // TODO : utilisé ? 
		var search = window.location.search;
		search.lastIndexOf("prd");
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
		if (param == ""){
			complet = "/details?agg=prd1";	
		}
   		else {
			var split = param.split('&');	
			split[0] = split[0].substring(1, split[0].length);
			var end = "/details";
			
			for (var i in split) {
				if(split[i].substring(0,3) == 'agg') {
					var valAgg = split[i].substring(4,8);
					complet.length == 0 ? complet = end + "?agg=" + valAgg : complet += "agg="+valAgg;
				}
				else if(split[i].substring(0,3) == 'prd' || split[i].substring(0,3) == 'org') {
					complet.length == 0 ? complet = end + "?"+split[i] : complet += "&" + split[i];
				}
				else {
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
