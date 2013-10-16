
darty.wynn.gui.accueil = (function () {

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
	
	
	
	
    function refreshPage() {
        darty.wynn.data.getIndicateurs(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
            	
            	darty.wynn.data.getIndicateursEnt(darty.wynn.makeSimpleFiltersClone(), function (error, resultEnt) {
            	if (error) {
            	} else {
            		
            		console.log(resultEnt);
            		result.ent2m = resultEnt.ent2m;
            		result.ent1y = resultEnt.ent1y;
            		ca2minutes =result.ca2m;
            		dernierCa =result.ca;
	            	result.caEvol=darty.wynn.formatEvo(100 * (result.ca2m - result.ca1y) / result.ca1y);
            		
            		result.concret= darty.wynn.formatConcret(result.vt2m / result.ent2m * 100 );
	            	pagefn = doT.template($('#indicateurs').text());
	                $('#mainContent').html(pagefn(result));
	                console.log('partie gauche chargee');
        		}});
            	
                var pagefn = doT.template($('#navigation-bar').text());
                $('#content-header').html(pagefn(result));
                console.log('Menu de navigation chargee');


                pagefn = doT.template($('#load-ranking').text());
                $('#blueContent').html(pagefn(result));
                console.log('partie droite chargee');

                
                console.log(result);

                refreshTimer = window.setTimeout(refreshPage, darty.wynn.config.reqInterval);
                refreshTimerCa = window.setTimeout(refreshPage, darty.wynn.config.reqInterval);
                lastRefresh = new Date();
                nextRefresh = new Date(lastRefresh.getTime() + darty.wynn.config.reqInterval);
            }
        });
    }

    function start() {

        $(document).ready(function () {
        refreshPage();
            
		
		makeDrillUrl();
		var ndate= new Date();
  		var m = (((ndate.getMinutes() )/15 | 0) * 15) % 60;
		var h = (((ndate.getMinutes()/105 + .5) | 0) + ndate.getHours()) % 24;

        window.setInterval(function () {
			var tex = {};
			tex.un = 'date des données ';
			tex.deux = ' prochaine récupération dans ';
            if (refreshTimer) {
                $('#refreshTimer').text(darty.wynn.formatTime(lastRefresh) + ' ( ' + Math.ceil((nextRefresh - new Date()) / 1000) + ' s)');
            } else {
                $('#refreshTimer').text('');
            }
            refreshTimerDisplay = Math.ceil((nextRefresh - new Date()) / 1000);
        }, darty.wynn.config.refreshInfo);
        
        window.setInterval(function () {
            if (refreshTimerCa) {
            	modificationCA();	
            } else {
            }
        }, darty.wynn.config.refreshCa);
        
        
        $(document).on('click','#refreshTimer', function () {
            if (refreshTimer) {
                window.clearTimeout(refreshTimer);
                refreshTimer = null;
                refreshPage();
            }
        });
        
        $(document).on('click','#affichageCa span', function () {
            window.location.assign(makeDrillUrl() );
        });
        
		// Gestion de l'affichage du menu click, mouse Over/out
		$(document).on('mouseenter','div#zone', function () {
			$('div.menu').show("slow", function() {
				//console.log('affichage'); // A retirer, ainsi que le callback inutile
			})
		}).on('mouseleave','div#zone', function () {
			$('div.menu').hide("fast", function() {
				//console.log('Masquage');// A retirer, ainsi que le callback inutile
			});
		}).on('click','div#zone',function(){
			if ($('div.menu').is(':hidden')) {
				$('div.menu').show("slow", function() { })
			}
			else {
				$('div.menu').hide("fast", function() {	})
			}
		});
		// Gestion du clic sur le menu déroulant
		$(document).on('click','div.btn-menu',function(){
			//console.log($(this).attr('id'));
			alert($(this).text());
		});
		
        
        
        });
    }
    
    
    function modificationCA (){
    	diffCaDebut= calcDiffCa();
    	
    	diffCaParDecoupage = Math.floor (diffCaDebut / decoupage);
    	minMax = returnMinMax (diffCaParDecoupage);
    	recalculCaDecoupage (minMax);
    }
    
	
	function getAleaNomb (min, max) {
    	return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function calcDiffCa (){
		return dernierCa - ca2minutes;
	}
	
	function recalculCaDecoupage ( aTester) {
		
		switch (Math.ceil((nextRefresh - new Date()) / 1000))
	{
		case 120:
		var vraiCA = darty.wynn.priceToStr(ca2minutes);
		cumul=0;
		$('#affichageCa').remove();	
		$("#ligneARajouter").append("<th class=\"color_X fixe\" id=\"affichageCa\"><span>"+vraiCA+" €</span></th>");
		
		break;
		
		default :
		var aleaNumb = getAleaNomb (minMax.min, minMax.max);
		cumul += aleaNumb;
		var aAfficher= darty.wynn.priceToStr(ca2minutes + cumul);
		 
		$('#affichageCa').remove();
		$("#ligneARajouter").append("<th class=\"color_X fixe \" id=\"affichageCa\"><span>"+aAfficher+" €</span></th>");		
	}}
	
	
	function getUrl () {
		var search = window.location.search;
		search.lastIndexOf ("prd")
		
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
	
	function getScoreEvol(val, histo, moyenne, budget) {
    var score = 0;
    (val > histo) && score++;
    (val > histo + (histo * moyenne) / 100) && score++;
    (val > histo + (histo * budget) / 100) && score++;
    console.log (val, histo, moyenne, budget);
    console.log (score);
    return score;
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
   			var agg= param.lastIndexOf("prd")
   			var url = param.split("?");
   			prd=parseInt( param.charAt(agg+3)) +1;
   			return "http://" + window.location.host + "/details?agg=prd" +prd+"&"+ url[1];
   			}
	
	
    }
	
	

    return {
        start: start,
        calcEvol: calcEvol,
        getScoreEvol: getScoreEvol
    };
})();
