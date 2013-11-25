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
		var counter = 0;
		var data = {};
        darty.wynn.data.getIndicateurs(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
				// console.log('Erreur lors du chargement des valeurs : page accueil ');
				counter += 1;
            } else { 
				console.log('result : ');
				console.log(result.ca1y);// SUCCESS
				counter += 1; // TODO :  sécurisé ?! 
				data.indicateurs = result;
			}
			if (counter > 1) {
				data.entrees = {};
				doWork(data);
			}
		});
		console.log('RefreshPage() --- entre indicateurs et indicateurs ENT ! ')
		darty.wynn.data.getIndicateursEnt(darty.wynn.makeSimpleFiltersClone(), function (error, resultEnt) {
			if (error) { 
				console.log('Erreur lors du chargement des valeurs : page accueil - entrées');
				counter += 1;
			} else { // SUCCESS
				counter += 1; // TODO :  sécurisé ?! 
				data.entrees = resultEnt;
			}
			if (counter > 1) {
				data.entrees = {};
				doWork(data); // cas non normal mais il faut continuer le traitement
			}
		});
		
		
							/*var pagefn = doT.template($('#navigation-bar').text());
							$('#content-header').html(pagefn(result));
							// console.log('Menu de navigation chargee');

							pagefn = doT.template($('#top-blue-part').text());
							$('#blueContentTop').html(pagefn(result));
							// console.log('partie droite chargee');
							
							// console.log('result :');
							// console.log(result);*/
				
	}
	
	function doWork(data) {
		var result = {};
		if(typeof data.entrees !== 'undefined') {
			result.ent2m = data.entrees.ent2m;
			result.ent1y = data.entrees.ent1y;
			result.entDat = data.entrees.entDat;
		}
		if(typeof data.indicateurs !== 'undefined') {
			ca2minutes = data.indicateurs.ca2m;
			dernierCa = data.indicateurs.ca;
			result = data.indicateurs;
			result.caEvol=darty.wynn.formatEvo(100 * (data.indicateurs.ca2m - data.indicateurs.ca1y) / data.indicateurs.ca1y);
			result.concret= darty.wynn.formatConcret(data.indicateurs.vt2m / result.ent2m * 100 );
		}
		console.log('Dowork : data :');
		console.log(data);
		console.log('Dowork : result : ');
		console.log(result);
		refreshTimer = window.setTimeout(refreshPage, darty.wynn.config.reqInterval); // TODO : VERIFIER pas de récursivité ! 
		refreshTimerCa = refreshTimer;
		//refreshTimerCa = window.setTimeout(refreshPage, darty.wynn.config.reqInterval); // TODO : VERIFIER pas de récursivité ! 
		lastRefresh = new Date();
		nextRefresh = new Date(lastRefresh.getTime() + darty.wynn.config.reqInterval);
		
		checkEnt(result);
		
		if (!darty.wynn.checkBrowser()) {// false = IE8 ! 
			var pagefn = doT.template($('#indicateurs').html());
		}
		else {
			var pagefn = doT.template($('#indicateurs').text());
		}
			
		$('#mainContentMiddle_home').html(pagefn(result));
	}
	
    function start() {

        $(document).ready(function () {
        refreshPage();  
		
		//makeDrillUrl();
		/*var ndate= new Date();
  		var m = (((ndate.getMinutes() )/15 | 0) * 15) % 60;
		var h = (((ndate.getMinutes()/105 + .5) | 0) + ndate.getHours()) % 24;*/

        window.setInterval(function () { 
			var jour = new Date();
			var text = parseInt(jour.getDate()) + '/'+parseInt(jour.getMonth()) + '/'+parseInt(jour.getYear()%100)
			if (refreshTimer) {
				$('#lastUpdate').remove();
                $('#blueContentTop').prepend('<p id="lastUpdate">Dernière Mise à jour le : '+text+' à '+darty.wynn.formatTimeSecondLess(new Date(lastRefresh.getTime() - darty.wynn.config.timeDiff)) + ' <br />Prochaine mise à jour dans: ' + Math.ceil((nextRefresh - new Date()) / 1000) + 's</p>');
			}
			else {
				$('#lastUpdate').remove();
                $('#blueContentTop').prepend('<p id="lastUpdate"></p>');
			}
            refreshTimerDisplay = Math.ceil((nextRefresh - new Date()) / 1000);
        }, darty.wynn.config.refreshInfo);
		
        // console.log('chargé ! ');
        window.setInterval(function () {
            if (refreshTimerCa) {
            	modificationCA();	
            } else {
            }
        }, darty.wynn.config.refreshCa);
        
		$(document).on('click','#blueContentTop', function () {
            if (refreshTimer) {
                window.clearTimeout(refreshTimer);
                refreshTimer = null;
                refreshPage();
            }
        });
        
		$(document).on('click', 'span.close', function () { 
			darty.wynn.removeFilters('accueil',$(this).parent().parent().attr('class'));
		});
		
        $(document).on('click','div#CA_chiffre p', function () {
            window.location.assign(makeDrillUrl() );
			// makeDrillUrl();
        });
        
		$(document).on('click', 'span#home', function () {
			window.location.assign("http://" + window.location.host + "/accueil");
		});
        
		darty.wynn.setFilters('accueil');
	});
	console.log('end of start');
}
    	
    function modificationCA (){
    	diffCaDebut= calcDiffCa();
    	
    	diffCaParDecoupage = Math.floor (diffCaDebut / decoupage);
    	minMax = returnMinMax (diffCaParDecoupage);
    	recalculCaDecoupage (minMax);
		// console.log('end of modifCA');
    }
    
    function checkEnt(statEntrees){
		if(typeof statEntrees.entDat === 'undefined')
			return false;
    	var entrees = statEntrees.entDat.toString();
		var lastRefresh15m = new Date();
		lastRefresh15m.setTime(lastRefresh);
		lastRefresh15m.setTime(lastRefresh15m.getTime() - darty.wynn.config.quartdheure);
		var dernierChargEnt = new Date (entrees.slice (0,4), entrees.slice (4,6) -1, entrees.slice (6,8), entrees.slice (6,8), entrees.slice (8,10), 0);
		//$("#probErreurEnt").html("");
		
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
			// console.log('aAfficher : '+ aAfficher)
			 
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
   		if (param == ""){
			return "http://" + window.location.host + "/details?agg=prd1";	
   		}
   		else {
   			var agg = param.lastIndexOf("prd"); // bug s'il n'y en a pas ! 
   			var url = param.split("?");
			console.log('typeof agg : '+ typeof agg + ' agg : ' + agg);
			if(typeof agg === 'number' && agg > 0) {
				prd=parseInt( param.charAt(agg+3)) +1;
				return "http://" + window.location.host + "/details?agg=prd" +prd+"&"+ url[1];
			}
			else {
				return "http://" + window.location.host + "/details?agg=prd1";	
			}
   		}
    }
	
    return {
        start: start,
        calcEvol: calcEvol
    };
})();
