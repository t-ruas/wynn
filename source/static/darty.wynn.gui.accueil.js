
darty.wynn.gui.accueil = (function () {

    var refreshTimer = null;
    var timer = 120;
	var derniereSync;
	var dernierTimer;
	var diffCaDebut;
	var decoupage = 240;
	var cumul = 0;
	var diffCaParDecoupage; 
	var minMax;
	
    function refreshPage() {

        refreshTimer = null;

        darty.wynn.data.getIndicateurs(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
            	
            	setLastLoad();
            	
            	
            	timer=120;
            	
                var pagefn = doT.template($('#navigation-bar').text());
                $('#content-header').html(pagefn(result));
                console.log('Menu de navigation chargee');

                pagefn = doT.template($('#indicateurs').text());
                $('#content-left').html(pagefn(result));
                console.log('partie gauche chargee');

                pagefn = doT.template($('#load-ranking').text());
                $('#content-right').html(pagefn(result));
                console.log('partie droite chargee');

                refreshTimer = window.setTimeout(refreshPage, darty.wynn.config.reqInterval);
            }
        });
    }

    function start() {
        $(document).ready(function () {
        refreshPage();
            
		caAFficher();
        
        setInterval(function(){
				modifyHTML();
				},darty.wynn.config.refreshInfo);    
        
        		
        
        $(document).click("#info", function () {
            refreshPage();
            return false;
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
    
    function setLastLoad () {
		var dateActuelle = new Date ; 
		var seconde;
		var minutes;
		
		derniereSync = " Dernier chargement : " + testTemps(dateActuelle.getHours()) + " : " + testTemps(dateActuelle.getMinutes()) + " : "+testTemps(dateActuelle.getSeconds());
	}
	
	function testTemps (num) {
		var chiffre;
		if (num<10){
			chiffre= "0"+num;
		}
		else {
			chiffre = num;
		}
		return chiffre;
	}
    
    // fabien
    function setIncTimer () {
		if (timer > 0 ){
		timer =timer - 1;	
		console.log(refreshTimer);
		}
		else 
		{
			timer=120;
			
		}
		dernierTimer =" (" + timer +")";
	}
	
	function modifyHTML () {
		setIncTimer();
		$("#sync").remove();
		$("#compteur").remove();
		$("#info").append("<span id=\"sync\" > " + derniereSync + "</span>");
		$("#info").append("<span id=\"compteur\">" + dernierTimer + "</span>")
	}
			
	function getdata(data) {
		var pagefn = doT.template($('#navigation-bar').text(), undefined, def);
		$('#content-header').html('dddddddddd');
		console.log('Menu de navigation chargee');
		
		pagefn  = doT.template($('#indicateurs').text(), undefined, def);
		$('#content-left').html(pagefn(data));
		console.log('partie gauche chargee');
				

	}
	
		function getAleaNomb (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function calcDiffCa (avant, apres){
		return apres - avant;
	}
	
	function recalculCaDecoupage (ca2m, aTester) {
		
		switch (timer)
	{
		
		case 120:
		$('#affichageCa').remove();
		$("#ligneARajouter").append("<th class=\"fixe\" id=\"affichageCa\">"+ca2m  +" €</th>");
		cumul=0;
		break;
		
		default :
		var aleaNumb = getAleaNomb (minMax.min, minMax.max);
		cumul += aleaNumb;
		var aAfficher= separateur(ca2m + cumul);
		 
		$('#affichageCa').remove();
		$("#ligneARajouter").append("<th class=\"fixe\" id=\"affichageCa\">"+aAfficher +" €</th>");		
	}}
	
	function returnMinMax (num) {
		var minVal = Math.floor(num *0.9);
		var maxVal = Math.floor(num *1.1);
		return {min:  minVal, max: maxVal};
	}
    
	
	function getConcret (ventes, entree) {
		num = ventes/entree *100;
		num= num.toFixed(2);
		return num; 
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
	
	function separateur(number){
		console.log(number.length);
		var nbFormat = '';
		var count=0;
		for(var i=number.length-1 ; i>=0 ; i--)
		{
			if(count!=0 && count % 3 == 0)
				nbFormat = number[i]+' '+nbFormat ;
			else
				nbFormat = number[i]+nbFormat ;
			count++;
		}
		return nbFormat;
	}
	
	

    return {
        start: start,
        calcEvol: calcEvol,
        getConcret: getConcret,
    };
})();
