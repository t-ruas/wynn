
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
    function computeLineValues(data) {
		console.log (data);
		console.log ("evol", data.caEvo2m, "evol 1 Y",data.ca1y );
        data.caEvo2m = _w.getEvol(data.ca2m, data.ca1y);
        
        data.caEvoGlobal2m = _w.getEvol(data.caGlobal2m, data.caGlobal1y);

        data.vtPartAcc1y = _w.getPrct(data.vtAcc1y, data.vt1y);
        data.vtPartAcc2m = _w.getPrct(data.vtAcc2m, data.vt2m);
        data.vtPartAccGlobal2m = _w.getPrct(data.vtAccGlobal2m, data.vtGlobal2m);

        data.vtPartServ1y = _w.getPrct(data.vtServ1y, data.vt1y);
        data.vtPartServ2m = _w.getPrct(data.vtServ2m, data.vt2m);
        data.vtPartServGlobal2m = _w.getPrct(data.vtOaGlobal2m, data.vtGlobal2m);

        data.vtPartOa1y = _w.getPrct(data.vtOa1y, data.vt1y);
        data.vtPartOa2m = _w.getPrct(data.vtOa2m, data.vt2m);
        data.vtPartOaGlobal2m = _w.getPrct(data.vtOaGlobal2m, data.vtGlobal2m);

        data.caPartRem1y = _w.getPrct(data.caRem1y, data.ca1y);
        data.caPartRem2m = _w.getPrct(data.caRem2m, data.ca2m);
        data.caPartRemGlobal2m = _w.getPrct(data.caRemGlobal2m, data.caGlobal2m);
    }

    function computeScore(val, histo, moyenne, budget) {
        var score = 0;
        (val > histo) && score++;
        (val > moyenne) && score++;
        budget && (val > histo + (histo * budget) / 100) && score++;
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
