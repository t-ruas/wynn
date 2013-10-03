
darty.wynn.gui.accueil = (function () {

    var refreshTimer = null;

    function refreshPage() {

        refreshTimer = null;

        darty.wynn.data.getIndicateurs(darty.wynn.pageData.filtres, function (error, result) {
            if (error) {
            } else {
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
        });
    }

    return {
        start: start,
    };
})();
