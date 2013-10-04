
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
                $('#detailsContent').html(doT.template($('#tmplDetailsTable').text())(prepareModel(result)));
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

        var t = {
            ca1y: 0,
            ca2m: 0,
            vt1y: 0,
            vt2m: 0,
            vtAcc1y: 0,
            vtAcc2m: 0,
            vtServ1y: 0,
            vtServ2m: 0,
            vtOa1y: 0,
            vtOa2m: 0,
            caRem1y: 0,
            caRem2m: 0,
        };

        for (var i = 0, imax = data.length; i < imax; i++) {

            var lineData = data[i];

            var lineModel = createLineModel(lineData);
            lineModel.lib = lineData.lib;
            lineModel.ddQuery = makeDrillDownQuery(lineData.cd);
            lineModel.dbQuery = makeDashboardQuery(lineData.cd);
            model.list.push(lineModel);

            // Accumulation des valeurs.
            t.ca1y += lineData.ca1y;
            t.ca2m += lineData.ca2m;
            t.vt1y += lineData.vt1y;
            t.vt2m += lineData.vt2m;
            t.vtAcc1y += lineData.vtAcc1y;
            t.vtAcc2m += lineData.vtAcc2m;
            t.vtServ1y += lineData.vtServ1y;
            t.vtServ2m += lineData.vtServ2m;
            t.vtOa1y += lineData.vtOa1y;
            t.vtOa2m += lineData.vtOa2m;
            t.caRem1y += lineData.caRem1y;
            t.caRem2m += lineData.caRem2m;
        }

        model.totals = createLineModel(t);

        return model;
    }

    // Calcul de valeurs intermédiaires.
    function computeLineValues(data) {

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

    // Ajout d'un objet sur les données de la ligne pour ne pas mélanger les valeurs d'affichage avec les données numériques en entrée.
    function createLineModel(data) {

        computeLineValues(data);

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
                $('#detailsTable td:nth-child(3), #detailsTable th:nth-child(3)').nextAll().toggle();
                return false;
            });

            $(document).on('click', '#detailsTable th', function() {
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

/*
    function tablesorterControler(choix) {
        switch (choix) {
            case 'col1':
                console.log('case 1 : order by first column');
                $('table.tablesorter').tablesorter( {sortList: [[0,0]]} );
                break;
            case 'col2':
                console.log('case 2 : order by second column');
                $('table.tablesorter').tablesorter( {sortList: [[1,0]]} );
                break;
            case 'col3':
                console.log('case 3 : order by third column');
                $('table.tablesorter').tablesorter( {sortList: [[2,0]]} );
                break;
            case 'ACC':
                console.log('case 4 : order by fourth column');
                $('table.tablesorter').tablesorter( {sortList: [[3,0]]} );
                break;
            case 'PSE':
                console.log('case 5 : order by fifth column');
                $('table.tablesorter').tablesorter( {sortList: [[4,0]]} );
                break;
            case 'OA':
                console.log('case 6 : order by sixth column');
                $('table.tablesorter').tablesorter( {sortList: [[5,0]]} );
                break;
            case 'REM':
                console.log('case 7 : order by last column');
                $('table.tablesorter').tablesorter( {sortList: [[6,0]]} );
                break;
        }
    }

    function showOrHideKPI() { // rajouter le décalage en setTimedOut ... ou animate opacity en léger décalage =)
        if ($('.OA').is(':hidden') && $('.REM').is(':hidden') && $('.ACC').is(':hidden') && $('.PSE').is(':hidden')
            && $('#OA').is(':hidden') && $('#REM').is(':hidden') && $('#ACC').is(':hidden') && $('#PSE').is(':hidden')) {
            $('#OA').show();
            $('#REM').show();
            $('#ACC').show();
            $('#PSE').show();
            $('.OA').fadeIn();
            $('.REM').fadeIn();
            $('.ACC').fadeIn();
            $('.PSE').fadeIn();
            $('#content').css('top','12');
        } else {
            $('#OA').hide();
            $('#REM').hide();
            $('#ACC').hide();
            $('#PSE').hide();
            $('.OA').fadeOut();
            $('.REM').fadeOut();
            $('.ACC').fadeOut();
            $('.PSE').fadeOut();
            $('#content').css('top','32');
        }
    }

    var def = {
        tableHeader : $('#tableMaker').text()
        //<!-- tableContent : $('#tableContent').text() -->
    };

    function somme(data) {
        var sommeCA = 0;
        var sommeCAy = 0;
        var sommeACC = 0;
        var sommePSE = 0;
        var sommeOA = 0;
        var sommeREM = 0;
        for (i = 0; i<data.liste.length; i++) {
            sommeCA += parseInt(data.liste[i].CA);
            sommeCAy += parseInt(parseInt(data.liste[i].CA) / (1+(parseFloat(data.liste[i].CAevol)/100)));
            for (u=0; u<data.liste[i].indicateurs.length; u++) {
                // ensemble de lignes ACC / ensemble de lignes
                if (data.liste[i].indicateurs[u].name == 'ACC')
                    sommeACC += parseInt(data.liste[i].indicateurs[u].value);
                else if (data.liste[i].indicateurs[u].name == 'PSE')
                    sommePSE += parseInt(data.liste[i].indicateurs[u].value);
                else if (data.liste[i].indicateurs[u].name == 'OA')
                    sommeOA += parseInt(data.liste[i].indicateurs[u].value);
                else if (data.liste[i].indicateurs[u].name == 'REM')
                    sommeREM += parseInt(data.liste[i].indicateurs[u].value);
                else
                    alert('erreur, traitement 0909898');
            }
        }
        var tot = ((sommeCA/sommeCAy)-1)*10000;
        tot = Math.round(tot)/100;
        console.log(tot);
        $('th#sommeCA').html(sommeCA);
        var signe = '';
        if(sommeCAy < 0)
            signe = '- ';
        else
            signe = '+ ';
        $('th#sommeCAEvol').text(signe + tot + '%');
        $('th#sommeACC').text(sommeACC);
        $('th#sommePSE').text(sommePSE);
        $('th#sommeOA').text(sommeOA);
        $('th#sommeREM').text(sommeREM);
    }

    function toggleIndic() {
        var left = $('#content').css('left');
        var top = $('#content').css('top');
        $('div#content').css('margin-left','none');
        console.log('left vaut : ' + left + '- top vaut : '+ top);
        if (parseInt(left) >= 200) {
            $('#content').animate({left:'8px'}, 1000);
            showOrHideKPI();
        } else {
            $('#content').animate({left:'250px'}, 1000);
            showOrHideKPI();
        }
    }

*/
