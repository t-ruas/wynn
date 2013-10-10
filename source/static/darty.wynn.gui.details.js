
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
	// function de répartition des données dans le template HTML
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
	// function de création de la requ^te pour l'appel vers Dashboard
    function makeDashboardQuery(cd) {
        var f = _w.makeSimpleFiltersClone();
        f[f.agg] = cd;
        delete f.agg;
        return _w.makeQuery(f);
    }
	// function de création de la requête pour l'appel en Drill Down
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
            
			$(document).on('click', 'img#home', function () {
                window.location.assign("http://" + window.location.host + "/accueil");
            });
			
			// bouton de changement de dimension
			$(document).on('click', 'div#bouton span.active', function () {
				var param = {};
				param.url = window.location.search;
				param.split = param.url.split("&");
				console.log(param.split[0].substring(5,8));
				
				var add = '';
				if (param.split[0].substring(5,8) == 'org') { add = 'prd'; }
				else { add = 'org'; }
				
				var url = '';
				for (var n in param.split) {
					if (n == 0) {
						url += param.split[0].substring(0,5) + add + param.split[0].substring(8,9);
					}
					else {
						url += '&'+param.split[n];
					}
				}
				var toto = "http://" + window.location.host + "/details" + url;
				window.location.assign(toto);
			});
			
            window.setInterval(function () {
                if (refreshTimer) {
                    $('#refreshTimer').text('date des données ' + _w.formatTime(lastRefresh) + ' prochaine récupération dans ' + Math.ceil((nextRefresh - new Date()) / 1000) + 's.');
                } else {
                    $('#refreshTimer').text('');
                }
            }, 1000);
			refreshPage();
			
			getAriane();
        });
    }
	function elemCount(array, dim) { // compte le nombre d'élements type dim dans l'array et retourne la valeur
		var cpt = 0;
		for (var u in array) {
			if (array[u].substring(0,3) == dim) {
				cpt++;
			}
		} 
		return cpt;
	}
	function p(obj, dim) {
		console.log(obj, dim);
		for (var n in obj) {
			if (obj[n].agg) {
				// on compte le nombre d'élements 
				var param = {};
				param.url = window.location.search;
				console.log(param);
				var url = param.url.split("&");
				
				var cpt = elemCount(url, dim)
				
				cpt--; // on doit soustraire le filtre à enlever
				urlBis = '';// on va stocker l'url dans une var, puis redirect dessus 
				for (var u in url) { 
					if (url[u].substring(0,3)==dim && cpt > 0) {
						if (urlBis != '') urlBis += '&';
						urlBis += url[u];
						cpt--;
					} 
					else if (url[u].substring(0,3)==dim && cpt == 0) {}
					else {
						if (urlBis != '') urlBis += '&';
						urlBis += url[u];
					}
				} 
				var toto = "http://" + window.location.host + "/details" + urlBis;
				window.location.assign(toto);
			}
			else {
			}
		}
	}
	
	function getAriane() {
		var text = {};
		text.prdRep = 'Tous Produits';
		text.orgRep = 'Darty France';
		text.prd = '';
		text.org = '';
		text.intro1 = '<div id="ariane';
		text.intro2 = '">'
		text.endReq = '</div>'
		
		for(var index in _w.pageData.filtres) { 
			if ( index.substring(0,3) == 'org') {
				text.org = '<span id="'+_w.pageData.filtres[index].lib+'"> '+_w.pageData.filtres[index].lib +' </span><span id="X.img"><img src="/images/details/croix.png" onclick="darty.wynn.gui.details.p(obj, org);" alt="org" /></span>'+'</div>'
			}
			if ( index.substring(0,3) == 'prd') {
				text.prd = '<div id="ariane1">'+'<span id="'+_w.pageData.filtres[index].lib+'"> '+_w.pageData.filtres[index].lib +' </span><span id="X.img"><img src="/images/details/croix.png" onclick="darty.wynn.gui.details.p(obj, prd);" alt="prd" /></span>'+'</div>';
			}
		}
		$("#ariane1").remove();
		$("#ariane2").remove();
		// on enlève les 2 blocs à refaire ariane1 => Produits, ariane2 => Lieux
		if (text.org != '') { $("#ariane").append(text.intro1+'2'+text.intro2+text.org+text.endReq); }
		else { $("#ariane").append(text.intro1+'2'+text.intro2+text.orgRep+text.endReq); }
		if (text.prd != '') { $("#ariane").append(text.intro1+'1'+text.intro2+text.prd+text.endReq); } 
		else { $("#ariane").append(text.intro1+'1'+text.intro2+text.prdRep+text.endReq); }
		setBouton(_w.pageData.filtres.agg.substring(0,3));
	}
	function setBouton(aggreg) {
		var agg = 'span#'+aggreg;
		$(agg).removeClass().addClass('noActive');
	}
    return {
        start: start,
		p: p
    };
	
})();
