
darty.wynn.gui.details = (function () {

    var refreshTimer = null;

    function refreshPage() {

        refreshTimer = null;

        darty.wynn.data.getIndicateurs(darty.wynn.pageData.filtres, function (error, result) {
            if (error) {
            } else {

                var pagefn = doT.template($('#load').text(), undefined, def);
                $('#content').html(pagefn(result));
                somme(result);

                refreshTimer = window.setTimeout(refreshPage, darty.wynn.config.reqInterval);
            }
        });
    }

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

    function start() {
        $(document).ready(function () {
            refreshPage();

            $(document).on('click', 'th.evolution', function(){
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
            });

            $(document).on('click', 'th.fixe', function(){
                alert('Direction Drill Down vers Dashboard : ' + $(this).attr('id'));
            });

            $(document).on('click', 'th.table-header', function() {
                //alert('TableSorting(' + $(this).attr('id')+')');
                tablesorterControler($(this).attr('id'));
            });

            $(document).on('click', 'th.liste', function(){
                alert('Drill Down dans la dimension ' + $(this).attr('id'));
            });

        });
    }

    return {
        start: start,
    };
})();
