
darty.wynn.data = (function () {

    function getIndicateurs(options, callback) {
        postRequest('indicateurs', options, callback);
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
        getDetails: getDetails,
        computeScore: computeScore,
        computeScoreEvol: computeScoreEvol
    };
})();
