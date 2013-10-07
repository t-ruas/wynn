
darty.wynn.gui.details = (function () {

    var _w = darty.wynn;

    var refreshTimer = null;
    var lastRefresh = null;
    var nextRefresh = null;

    function refreshPage() {
        refreshTimer = null;
        darty.wynn.data.getDetails(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
                $('#mainContentMiddle').html(doT.template($('#tmplDetailsTable').text())(prepareModel(result)));
                refreshTimer = window.setTimeout(refreshPage, _w.config.reqInterval);
                lastRefresh = new Date();
                nextRefresh = new Date(lastRefresh.getTime() + _w.config.reqInterval);
            }
        });
    }

    function prepareModel(data) {

        var model = {
            list: []
        };

        var fields = ['ca1y', 'ca2m', 'vt1y', 'vt2m', 'vtAcc1y', 'vtAcc2m', 'vtServ1y', 'vtServ2m', 'vtOa1y', 'vtOa2m', 'caRem1y', 'caRem2m'];
        var t = {};

        for (var i = 0, imax = fields.length; i < imax; i++) {
            t[fields[i]] = 0;
        }

        for (var j = 0, jmax = data.length; j < jmax; j++) {

            var lineData = data[j];

            var lineModel = createLineModel(lineData);
            
            lineModel.lib = lineData.lib;
            lineModel.ddQuery = makeDrillDownQuery(lineData.cd);
            console.log(lineData.cd);
            lineModel.dbQuery = makeDashboardQuery(lineData.cd);
            model.list.push(lineModel);

            // Accumulation des valeurs.
            for (var i = 0, imax = fields.length; i < imax; i++) {
                t[fields[i]] += lineData[fields[i]];
            }
        }

        model.totals = createLineModel(t);

        return model;
    }

    // Ajout d'un objet sur les données de la ligne pour ne pas mélanger les valeurs d'affichage avec les données numériques en entrée.
    function createLineModel(data) {

        _w.data.computeLineValues(data);

        return {
            ca: _w.formatPrice(data.ca2m),
            caEvo: {
                val: _w.formatEvo(data.caEvo2m),
                cls: isNaN(data.caEvo2m) ? '' : _w.score2Cls(_w.data.computeScoreEvol(data.ca2m, data.ca1y, data.caEvoGlobal2m, _w.pageData.budget.ca), 4)
            },
            acc: {
                val: _w.formatPrct(data.vtPartAcc2m),
                cls: isNaN(data.vtPartAcc2m) ? '' : _w.score2Cls(_w.data.computeScore(data.vtPartAcc2m, data.vtPartAcc1y, data.vtPartAccGlobal2m), 3)
            },
            serv: {
                val: _w.formatPrct(data.vtPartServ2m),
                cls: isNaN(data.vtPartServ2m) ? '' : _w.score2Cls(_w.data.computeScore(data.vtPartServ2m, data.vtPartServ1y, data.vtParServGlobal2m), 3)
            },
            oa: {
                val: _w.formatPrct(data.vtPartOa2m),
                cls: isNaN(data.vtPartOa2m) ? '' : _w.score2Cls(_w.data.computeScore(data.vtPartOa2m, data.vtPartOa1y, data.vtPartOaGlobal2m), 3)
            },
            rem: {
                val: _w.formatPrct(data.caPartRem2m),
                cls: isNaN(data.caPartRem2m) ? '' : _w.score2Cls(_w.data.computeScore(data.caPartRem2m, data.caPartRem1y, data.caPartRemGlobal2m), 3)
            },
        }
    }

    function makeDashboardQuery(cd) {
        var f = _w.makeSimpleFiltersClone();
        delete f.agg;
        return _w.makeQuery(f);
    }

    function makeDrillDownQuery(cd) {
        var f = _w.makeSimpleFiltersClone();
        f[f.agg] = cd;
        f.agg = f.agg.slice(0,3) + (parseInt(f.agg.slice(3)) + 1);
        return _w.makeQuery(f);
    }

    function start() {
        $(document).ready(function () {

            $(document).on('click', '#detailsTable .linkExpand', function () {
                $('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
                return false;
            });

            $(document).on('click', '#detailsTable th', function () {
                $('#detailsTable').tablesorter({sortList: [[$(this).index(), 0]]});
            });

            $('#refreshTimer').on('click', function () {
                if (refreshTimer) {
                    window.clearTimeout(refreshTimer);
                    refreshPage();
                }
            });
            
            window.setInterval(function () {
                if (refreshTimer) {
                    $('#refreshTimer').text('date des données ' + _w.formatTime(lastRefresh) + ' prochaine récupération dans ' + Math.ceil((nextRefresh - new Date()) / 1000) + 's.');
                } else {
                    $('#refreshTimer').text('');
                }
            }, 1000);

            refreshPage();
        });
    }

    return {
        start: start,
    };
})();
