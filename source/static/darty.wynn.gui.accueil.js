
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
	
    function refreshPage() {

        darty.wynn.data.getIndicateurs(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
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
                
                console.log(result);
                for (var i = 0, imax = result.length; i < imax; i++) {
                	var u = result[i];
                	
                }

                refreshTimer = window.setTimeout(refreshPage, darty.wynn.config.reqInterval);
                lastRefresh = new Date();
                nextRefresh = new Date(lastRefresh.getTime() + darty.wynn.config.reqInterval);
            }
        });
    }

    function start() {
        $(document).ready(function () {
        refreshPage();
            
		caAFficher();
        
        window.setInterval(function(){
				modificationCA(1000,2000);
		},darty.wynn.config.refreshCa); 

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
        
        });
    }
    
    function caAFficher () {
        $(document).ready(function () {
        setInterval(function(){
				modificationCA(1000,2000);
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
		$("#ligneARajouter").append("<th class=\"fixe\" id=\"affichageCa\">"+ca2m  +" €</th>");
		cumul=0;
		break;
		
		default :
		var aleaNumb = getAleaNomb (minMax.min, minMax.max);
		cumul += aleaNumb;
		var aAfficher= darty.wynn.priceToStr(ca2m + cumul);
		 
		$('#affichageCa').remove();
		$("#ligneARajouter").append("<th class=\"fixe\" id=\"affichageCa\">"+aAfficher +" €</th>");		
	}}
	
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
	
	
	

    return {
        start: start,
        calcEvol: calcEvol,
    };
})();
