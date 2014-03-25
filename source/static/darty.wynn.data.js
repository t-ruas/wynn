// v fabien
darty.wynn.data = (function () {
 
    var _w = darty.wynn;

    function getIndicateurs(options, callback) {
        // console.log(options);
        postRequest(_w.config.requestAccueil, options, callback);
    }
    
    function getIndicateursEnt(options, callback) {
        postRequest(_w.config.requestEntrees, options, callback);
    }

    function getDetails(options, callback) {
        postRequest(_w.config.requestDetails, options, callback);
    }

    function postRequest(action, options, callback) {
		$.ajax({
            url: 'service/' + action,
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(options),
            timeout: darty.wynn.config.reqTimeout,
            success: function (data){
				callback(null, data);
            },
            error : function (xhr) {
                logError(xhr);
                callback('Error');
            }
        });
    };

    function logError(xhr) {

    }

    // Calcul de valeurs supplémentaires sur une ligne aggrégée.
    function computeLineValues(data) { // from : createLineModel => from : prepareModel -> Utilisé par getDetails ! 
		var result = {};
        var f = darty.wynn.pageData.filtres;
		result.ca2m = data.ca2m;
		result.ca1y = data.ca1y;
		
        if (f.agg == 'org5') { // PrimeVendeur
            result.caEvo2m = parseFloat(data.primevendeur).toFixed(2).toString().replace('.',' - ');
        } else {
            result.caEvo2m = _w.getEvol(data.ca2m, data.ca1y);
        }

        result.caEvoGlobal2m = _w.getEvol(data.caGlobal2m, data.caGlobal1y);

		result.caPartAcc2m = _w.getPrct(data.caPoidsAcc2m, data.ca2m); 					// le calcul de ratio se fait ici ! 
		result.caPartAcc1y = _w.getPrct(data.caPoidsAcc1y, data.ca1y);
		result.caPartAccGlobal2m = _w.getPrct(data.caPoidsAccGlobal2m, data.caGlobal2m);
		
        var val = {
            _2m : parseFloat(data.ca2m) + parseFloat(data.caPoidsRem2m),
            _1y : parseFloat(data.ca1y) + parseFloat(data.caPoidsRem1y),
            _global2m : parseFloat(data.caGlobal2m) + parseFloat(data.caPoidsRemGlobal2m)
        };

        result.caPartRem2m = _w.getPrct(data.caPoidsRem2m, val._2m);
        result.caPartRem1y = _w.getPrct(data.caPoidsRem1y, val._1y);
        result.caPartRemGlobal2m = _w.getPrct(data.caPoidsRemGlobal2m, val._global2m);
		

        result.caPartServ2m = _w.getPrct(data.caPoidsServ2m, data.qtePm2m);
		result.caPartServ1y = _w.getPrct(data.caPoidsServ1y, data.qtePm1y);
		result.caPartServGlobal2m = _w.getPrct(data.caPoidsServGlobal2m, data.qtePmGlobal2m);
        
		result.caPartOa2m = _w.getPrct(data.caPoidsOa2m, data.qteCodic2m);
		result.caPartOa1y = _w.getPrct(data.caPoidsOa1y, data.qteCodic1y);
		result.caPartOaGlobal2m = _w.getPrct(data.caPoidsOaGlobal2m, data.qteCodicGlobal2m);
        return result;
    }
	
	function computeScore(val, histo, moyenne, budget) {
		if (!isFinite(val))
			return 0; 
		var score = 0;
        (val > histo) && score++;
        (val > moyenne) && score++;
        budget && (val > histo + (histo * budget) / 100) && score++;		
		return score;
    }

    function computeScoreEvol(val, histo, moyenne, budget) {
        if (!isFinite(val))
			return 0;
		var score = 0;
		(val > histo) && score++;
        (val > histo + (histo * moyenne) / 100) && score++;
        budget && (val > histo + (histo * budget) / 100) && score++;
        return score;
    }

    return {
        getIndicateurs: getIndicateurs,
        getIndicateursEnt: getIndicateursEnt,
        getDetails: getDetails,
        computeScore: computeScore,
        computeScoreEvol: computeScoreEvol,
        computeLineValues: computeLineValues,
    }
})();
