// v fabien
darty.wynn.data = (function () {

    var _w = darty.wynn;

    function getIndicateurs(options, callback) {
        postRequest('indicateurs', options, callback);
    }
    
    function getIndicateursEnt(options, callback) {
        postRequest('indicateursEnt', options, callback);
    }

    function getDetails(options, callback) {
        postRequest('details', options, callback);
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
    function computeLineValues(data) { // from : createLineModel => from : prepareModel
		// console.log('Compute Lines : ');
		// console.log(data);
        data.caEvo2m = _w.getEvol(data.ca2m, data.ca1y); // ok
        
        data.caEvoGlobal2m = _w.getEvol(data.caGlobal2m, data.caGlobal1y);

        data.vtPartAcc1y = _w.getPrct(data.vtAcc1y, data.vt1y);						// delete
        data.vtPartAcc2m = _w.getPrct(data.vtAcc2m, data.vt2m);                     // delete
        data.vtPartAccGlobal2m = _w.getPrct(data.vtAccGlobal2m, data.vtGlobal2m);   // delete
                                                                                    
        data.vtPartServ1y = _w.getPrct(data.vtServ1y, data.vt1y);                   // delete
        data.vtPartServ2m = _w.getPrct(data.vtServ2m, data.vt2m);                   // delete
        data.vtPartServGlobal2m = _w.getPrct(data.vtOaGlobal2m, data.vtGlobal2m);   // delete
                                                                                    
        data.vtPartOa1y = _w.getPrct(data.vtOa1y, data.vt1y);                       // delete
        data.vtPartOa2m = _w.getPrct(data.vtOa2m, data.vt2m);                       // delete
        data.vtPartOaGlobal2m = _w.getPrct(data.vtOaGlobal2m, data.vtGlobal2m);     // delete
                                                                                    
        data.caPartRem1y = _w.getPrct(data.caRem1y, data.ca1y);                     // delete
        data.caPartRem2m = _w.getPrct(data.caRem2m, data.ca2m);                     // delete
        data.caPartRemGlobal2m = _w.getPrct(data.caRemGlobal2m, data.caGlobal2m);   // delete
		
		/*
		data.caPartAcc2m = _w.getPrct(data.caPoidsAcc2m, data.ca2m);
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
		*/
    }
	
	function computeSumValues () {  // TODO : vérifier l'utilité ! 
	
		data.caEvo2m = isValid(_w.getEvol(data.ca2m, data.ca1y)) ? _w.getEvol(data.ca2m, data.ca1y) : 0; //ok
        
        data.caEvoGlobal2m = isValid(_w.getEvol(data.caGlobal2m, data.caGlobal1y)) ? _w.getEvol(data.caGlobal2m, data.caGlobal1y) : 0; // ok
		
        data.vtPartAcc1y = _w.getPrct(data.vtAcc1y, data.vt1y); 					// delete
        data.vtPartAcc2m = _w.getPrct(data.vtAcc2m, data.vt2m); 					// delete
        data.vtPartAccGlobal2m = _w.getPrct(data.vtAccGlobal2m, data.vtGlobal2m); 	// delete
		
        data.vtPartServ1y = _w.getPrct(data.vtServ1y, data.vt1y);					// delete
        data.vtPartServ2m = _w.getPrct(data.vtServ2m, data.vt2m);                   // delete
        data.vtPartServGlobal2m = _w.getPrct(data.vtOaGlobal2m, data.vtGlobal2m);   // delete

        data.vtPartOa1y = _w.getPrct(data.vtOa1y, data.vt1y);						// delete
        data.vtPartOa2m = _w.getPrct(data.vtOa2m, data.vt2m);                       // delete
        data.vtPartOaGlobal2m = _w.getPrct(data.vtOaGlobal2m, data.vtGlobal2m);     // delete

        data.caPartRem1y = _w.getPrct(data.caRem1y, data.ca1y);						// delete
        data.caPartRem2m = _w.getPrct(data.caRem2m, data.ca2m);                     // delete
        data.caPartRemGlobal2m = _w.getPrct(data.caRemGlobal2m, data.caGlobal2m);	// delete
	}
	
    function computeScore(val, histo, moyenne, budget) {
		console.log('val : ' + val+ ', histo : ' +histo+ ', moyenne : ' +moyenne+ ', budget : ' +budget );
        var score = 0;
        (val > histo) && score++;
        (val > moyenne) && score++;
        budget && (val > histo + (histo * budget) / 100) && score++;
        // console.log(score);
        return score;
    }

    function computeScoreEvol(val, histo, moyenne, budget) {
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
    };
})();
