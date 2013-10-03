
darty.wynn.gui.accueil = (function () {

    var refreshTimer = null;
    var timer = 120;
	var derniereSync;
	var dernierTimer;

    function refreshPage() {

        refreshTimer = null;

        darty.wynn.data.getIndicateurs(darty.wynn.pageData.filtres, function (error, result) {
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

        
        setInterval(function(){
				modifyHTML();
				},1000);    
        
        
        $(document).click("#info", function () {
            refreshPage();
            return false;
        });
        
        });
    }
    
    function setLastLoad () {
		var dateActuelle = new Date ;
		derniereSync = " Dernier chargement : " + dateActuelle.getHours() + " : " + dateActuelle.getMinutes() + " : "+dateActuelle.getSeconds();
	}
    
    // fabien
    function setIncTimer () {
		if (timer > 0 ){
		timer =timer - 1;	
		}
		else 
		{
			timer=120;
		}
		dernierTimer =" (" + timer +")";
	};
	
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
				
		
		pagefn = doT.template($('#load-ranking').text(), undefined, def);
		$('#content-right').html(pagefn(data));	
		console.log('partie droite chargee');
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

    return {
        start: start,
        calcEvol: calcEvol,
    };
})();
