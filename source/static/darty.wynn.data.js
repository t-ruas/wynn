// v fabien
darty.wynn.data = (function () {

    var _w = darty.wynn;

    function getIndicateurs(options, callback) {
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
				// console.log('data après le success du postSearch : ');
				// console.log(data);
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
		data.caEvo2m = _w.getEvol(data.ca2m, data.ca1y); // ok
        
        data.caEvoGlobal2m = _w.getEvol(data.caGlobal2m, data.caGlobal1y);

		data.caPartAcc2m = _w.getPrct(data.caPoidsAcc2m, data.ca2m); 					// le calcul de ratio se fait ici ! 
		data.caPartAcc1y = _w.getPrct(data.caPoidsAcc1y, data.ca1y);
		data.caPartAccGlobal2m = _w.getPrct(data.caPoidsAccGlobal2m, data.caGlobal2m);
		
		data.caPartServ2m = _w.getPrct(data.caPoidsServ2m, data.ca2m);
		data.caPartServ1y = _w.getPrct(data.caPoidsServ1y, data.ca1y);
		data.caPartServGlobal2m = _w.getPrct(data.caPoidsServGlobal2m, data.caGlobal2m);
		
		data.caPartRem2m = _w.getPrct(data.caPoidsRem2m, data.ca2m);
		data.caPartRem1y = _w.getPrct(data.caPoidsRem1y, data.ca1y);
		data.caPartRemGlobal2m = _w.getPrct(data.caPoidsRemGlobal2m, data.caGlobal2m);
		
		data.caPartOa2m = _w.getPrct(data.caPoidsOa2m, data.ca2m);
		data.caPartOa1y = _w.getPrct(data.caPoidsOa1y, data.ca1y);
		data.caPartOaGlobal2m = _w.getPrct(data.caPoidsOaGlobal2m, data.caGlobal2m);
    }
	
	function computeScore(val, histo, moyenne, budget) {
		console.log('computeScore : ' + val + ' - histo : ' + histo + ' - moyenne : ' + moyenne + ' - budget : ' + budget);
		if (!isFinite(val))
			return 0;
		var score = 0;
        (val > histo) && score++;
        (val > moyenne) && score++;
        budget && (val > histo + (histo * budget) / 100) && score++;
        console.log('score : '+ score);
        return score;
    }

    function computeScoreEvol(val, histo, moyenne, budget) {
        console.log('computeScoreEvol : ' + val + ' - histo : ' + histo + ' - moyenne : ' + moyenne + ' - budget : ' + budget);
		if (!isFinite(val))
			return 0;
		var score = 0;
		(val > histo) && score++;
        (val > histo + (histo * moyenne) / 100) && score++;
        budget && (val > histo + (histo * budget) / 100) && score++;
        console.log('score : ' + score);
        return score;
    }

    return {
        getIndicateurs: getIndicateurs,
        getIndicateursEnt: getIndicateursEnt,
        getDetails: getDetails,
        computeScore: computeScore,
        computeScoreEvol: computeScoreEvol,
        computeLineValues: computeLineValues,
    };
})();
