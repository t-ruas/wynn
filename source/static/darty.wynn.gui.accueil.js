
darty.wynn.gui.accueil = (function () {

    var refreshTimer = null;
    var lastRefresh = null;
    var nextRefresh = null;
    var timer = 120;
	var derniereSync;
	var dernierTimer;
	var diffCaDebut;
	var decoupage = 240;
	var cumul = 0;
	var diffCaParDecoupage; 
	var minMax;
	var ca2minutes;
	var dernierCa;
	
    function refreshPage() {
	
        darty.wynn.data.getIndicateurs(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
            	ca2minutes=result.ca2m;
            	dernierCa= result.ca;
            	result.caEvol=darty.wynn.formatEvo(100 * (result.ca2m - result.ca1y) / result.ca1y);
            	result.concret= darty.wynn.formatConcret(result.vt2m / result.ent2m * 100 );
            	
                var pagefn = doT.template($('#navigation-bar').text());
                $('#content-header').html(pagefn(result));
                console.log('Menu de navigation chargee');

                pagefn = doT.template($('#indicateurs').text());
                $('#content-left').html(pagefn(result));
                console.log('partie gauche chargee');

                pagefn = doT.template($('#load-ranking').text());
                $('#content-right').html(pagefn(result));
                console.log('partie droite chargee');

                
                console.log(result);
                for (var i = 0, imax = result.length; i < imax; i++) {
                	var u = result[i];
                	
                }

                refreshTimer = window.setTimeout(refreshPage, darty.wynn.config.reqInterval);
                lastRefresh = new Date();
                nextRefresh = new Date(lastRefresh.getTime() + darty.wynn.config.reqInterval);
            }
        });
              darty.wynn.data.getIndicateursEnt(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
        console.log(result);
        }});
    }

    function start() {
        $(document).ready(function () {
        refreshPage();
            
		caAFficher();
		makeDrillUrl();
		var ndate= new Date();
  		var m = (((ndate.getMinutes() )/15 | 0) * 15) % 60;
		var h = (((ndate.getMinutes()/105 + .5) | 0) + ndate.getHours()) % 24;

        window.setInterval(function () {
            if (refreshTimer) {
                $('#refreshTimer').text('date des données ' + darty.wynn.formatTime(lastRefresh) + ' prochaine récupération dans ' + Math.ceil((nextRefresh - new Date()) / 1000) + 's.');
            } else {
                $('#refreshTimer').text('');
            }
        }, darty.wynn.config.refreshInfo);		    
        
        		
        
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
    
    function caAFficher () {
        $(document).ready(function () {
        setInterval(function(){
				modificationCA(ca2minutes ,dernierCa);
				},darty.wynn.config.refreshCa); 
		return false;
		});		
		}
    
    function modificationCA (ca2min, caActu){
    	diffCaDebut= calcDiffCa(ca2min,caActu);
    	
    	diffCaParDecoupage = Math.floor (diffCaDebut / decoupage);
    	minMax = returnMinMax (diffCaParDecoupage);
    	recalculCaDecoupage (ca2min, minMax);
    }
    
			
	
		function getAleaNomb (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function calcDiffCa (avant, apres){
		return apres - avant;
	}
	
	function recalculCaDecoupage (ca2m, aTester) {
		
		switch (nextRefresh)
	{
		case 120:
		$('#affichageCa').remove();	
		$("#ligneARajouter").append("<th class=\"color_X fixe\" id=\"affichageCa\"><span>"+ca2m+" €</span></th>");
		cumul=0;
		break;
		
		default :
		var aleaNumb = getAleaNomb (minMax.min, minMax.max);
		cumul += aleaNumb;
		var aAfficher= darty.wynn.priceToStr(ca2m + cumul);
		 
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
	
	function getTimer () {
		return timer;
	}
	
	function getScoreEvol(val, histo, moyenne, budget) {
    var score = 0;
    (val > histo) && score++;
    (val > histo + (histo * moyenne) / 100) && score++;
    (val > histo + (histo * budget) / 100) && score++;
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
   		
   	/*var ancienLien = window.document.referrer;
   	console.log(ancienLien);
   	var url;
   	if (ancienLien==""){
   		url ="http://localhost:8090/details?agg=prd1"
   	}else {
   		url = ancienLien;
   	} 	
	return url;*/
	
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
