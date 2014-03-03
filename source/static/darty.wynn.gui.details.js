 // fab
darty.wynn.gui.details = (function () {
    var _w = darty.wynn;
    var refreshTimer = null;
    var lastRefresh = null;
    var nextRefresh = null;
	var flag1erAffichage = true;
	var metaDataTable = {};
	
	function refreshPage() { // controller de la page
        // console.log('RefreshPage : ', new Date().getTime());
        refreshTimer = null;
        
        /* On sette la transition : */
        $('#mainContent div#spin').length === 0 && _w.fromClick ? $('#mainContent').prepend("<div id=\"spin\"></div>") : '';
		$('#mainContent div#spin').length === 1 && _w.fromClick ? $('#mainContent div#spin').prepend(spinner.el) : '';
		typeof sessionStorage.QTE_DAY_LINES !== 'undefined' ? ($('#mainContent div#spin').length === 1 && _w.fromClick ? $('#mainContent div#spin').prepend("<h3>Processing "+sessionStorage.QTE_DAY_LINES+" documents</h3>") : '' ) : ''
		_w.fromClick = true;
        
        darty.wynn.data.getDetails(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
				// console.log('GetDetails : ', new Date().getTime());
		
				var tmp = result.pop(); // on récupère la valeur NB_LINES 
				typeof sessionStorage.QTE_DAY_LINES === 'undefined' ? sessionStorage.QTE_DAY_LINES = tmp.QTE_LINES : (sessionStorage.QTE_DAY_LINES !== tmp.QTE_LINES ? sessionStorage.QTE_DAY_LINES = tmp.QTE_LINES : '');
				
				

				// Algo pour calculer le nombre de page, le nombre d'onglet à créer, ainsi que les objets dans la page !
				var pageActive = parseInt($('.actif').html()); 																// ok ! 
				var pageNumber = result.length%darty.wynn.config.linePerPage > 0 ? parseInt(result.length/darty.wynn.config.linePerPage) + 1 : parseInt(result.length/darty.wynn.config.linePerPage);
				var text = '';
				for(var i = 0; i < pageNumber; i++) {
					text += '<span href="" class="pageNumber ';
					if(typeof pageActive == 'number' && i+1 == pageActive)
						text += 'actif';
					else
						text += 'noActif';
					text += '" value="'+parseInt(i+1)+'">'+parseInt(i+1)+'</span>';
				}
				
				spinner.stop(); // on stope le spinner
				$('#mainContent div#spin').remove(); // on enlève le container
				

				if (!darty.wynn.checkBrowser()) {// false = IE8 ! 
					$('#mainContentMiddle').html(doT.template($('#tmplDetailsTable').html())(prepareModel(result, pageActive)));
				}
				else {
					$('#mainContentMiddle').html(doT.template($('#tmplDetailsTable').text())(prepareModel(result, pageActive)));
				}
				
				if(parseInt(pageNumber) > 1)
					$('#pageNumberLoader').prepend(text);
				else 
					$('#pageNumberLoader').remove();
				
				_w.fromClick = false;
				refreshTimer = window.setTimeout(refreshPage, _w.config.reqInterval);
                lastRefresh = new Date();
                nextRefresh = new Date(lastRefresh.getTime() + _w.config.reqInterval);
				
				getMenuAgg(function(){ // une fois le code généré, on le masque 
					$("div.menuDeroul").css({"display":"hidden"});
				});
				
				if ((typeof obj.filtres.prd6 != 'undefined' && obj.filtres.agg == 'org4' )||
					(typeof obj.filtres.org4 != 'undefined' && obj.filtres.agg == 'prd6' )) {
					$("table#detailsTable tbody").find("a").removeAttr("href");
					// console.log(obj);
					$(".libelle").css("font-size","60%"); 													// contrôle ?!? Vérification ?!
				}
				else if (obj.filtres.agg == 'org4' || obj.filtres.agg == 'prd6')
				{
					$(".libelle").css("font-size","60%"); 
				}
				else {
					$(".code").remove();
				}
				
				$("table").tablesorter( // configuration du tri de tableau ! TODO : faire fonctionner l'historique de tri ! 
					{ headers: { 
					0: {sorter:'subclass'},
					1: {sorter:'currency'}, 
					2: {sorter:'percent'},
					3: {sorter:'percent'},
					4: {sorter:'percent'},
					5: {sorter:'percent'},
					6: {sorter:'percent'} }
				});
				if((metaDataTable.orientation || metaDataTable.col) || metaDataTable.etat) { // Mise à jour du tableau postRefresh ! 
					var sorting = [[(typeof metaDataTable.col === 'number' ? metaDataTable.col : ''),metaDataTable.orientation == '' ? '' : (metaDataTable.orientation == 'up' ? 1 : 0)]]; 
					
					metaDataTable.orientation != '' && metaDataTable.col != '' ? $("table").trigger("sorton",[sorting]) : '';
					
					if (metaDataTable.etat == 'ferme') { // doit être ferme
						if ($('#detailsTable.reducted').length == 0) {// mais est ouvert
							$('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
							updateClassTable();
						}
					}
					else { // doit etre ouvert
						if ($('#detailsTable.reducted').length == 1) {// et est ouvert
							$('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
							updateClassTable();
						}
					}
					
				}
				if (flag1erAffichage) {
					$('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
					flag1erAffichage = false;
					updateClassTable();
				}
				// console.log('EndLoading : ', new Date().getTime());
			}
        });
    }
	
	// function de répartition des données dans le template HTML
    function prepareModel(data, pageNumber) {
		if (isNaN(pageNumber))
			pageNumber = 1;
		var model = {
            list: []
        };
		var sum = {}; 
        var t = {};
		
		for (var i = 0, imax = _w.fields.length; i < imax; i++) {
            t[_w.fields[i]] = 0; // init
			sum[_w.fields[i]] = 0;
        }
		var cptNotZero = 1;
		for (var j = 0, jmax = data.length; j < jmax; j++) {
			cptNotZero ++;
			var lineData = data[j]; 
			var lineModel = createLineModel(lineData); 													// on créé la ligne
			lineModel.cd = lineData.cd;
            lineModel.lib = lineData.lib; 																// on rajoute le lib
            lineModel.ddQuery = makeDrillDownQuery(lineData.cd); 										// on rajoute les liens
            lineModel.dbQuery = makeDashboardQuery(lineData.cd); 										// le second lien
			lineModel.order = typeof lineData.ordre === 'number' ? lineData.ordre : cptNotZero;
			if (j >= (darty.wynn.config.linePerPage*(pageNumber-1)) && j < (darty.wynn.config.linePerPage*pageNumber)) {
				model.list.push(lineModel);}															// on rajoute dans la liste de model.
			createSumLine(lineData, sum); 																// mais on veut une somme correcte, donc on garde la somme =)
		}
		model.totals = createLineModel(sum);
		f = _w.makeSimpleFiltersClone();
		model.totals.dbQuery = "/accueil?" + _w.makeQuery(f);
		return model;
    }
	
	function createSumLine(data, sum) { // somme les valeurs d'une ligne pour l'ensemble
		for (y = 0; y < _w.fields.length; y++)
		{
			if (typeof data[_w.fields[y]] === 'number') {
				sum[_w.fields[y]] += data[_w.fields[y]];
			}
		}
	}
	
    // Ajout d'un objet sur les données de la ligne pour ne pas mélanger les valeurs d'affichage avec les données numériques en entrée.
    function createLineModel(data) {
        var result = _w.data.computeLineValues(data);
		// console.log(_w.pageData.filtres.agg === 'org4', result)
		var z = {
			ca: _w.formatPrice(result.ca2m),
            caEvo: {
                val: _w.formatEvo(result.caEvo2m),
                cls: isNaN(result.caEvo2m) || !isFinite(result.caEvo2m) ? 'gray' : _w.score2Cls(_w.data.computeScoreEvol(result.caEvo2m, data.ca1y, data.caEvoGlobal2m, _w.pageData.budget.CA), 4)
            },
			acc: {
                val: _w.formatPrct(result.caPartAcc2m), 							// seulement la forme, le fond est modifié dans computeLineValues ! 
                cls: isNaN(result.caPartAcc2m) || !isFinite(result.caPartAcc2m) ? 'gray' : _w.score2Cls(_w.data.computeScore(result.caPartAcc2m, result.caPartAcc1y, result.caPartAccGlobal2m,_w.pageData.budget.ACCESSOIRES), 4)
            },
			serv: {
                val: _w.formatPrct(result.caPartServ2m),//darty.wynn.getPrct(data.indicateurs.caPoidsRem2m, data.indicateurs.ca2m)
                cls: isNaN(result.caPartServ2m) || !isFinite(result.caPartServ2m) ? 'gray' : _w.score2Cls(_w.data.computeScore(result.caPartServ2m, result.caPartServ1y, result.caPartServGlobal2m, _w.pageData.budget.SERVICES), 4)
            },
			rem: { // TODO : appliquer une formule particulière ? 
                val: _w.formatPrct(result.caPartRem2m),
                cls: isNaN(result.caPartRem2m) || !isFinite(result.caPartRem2m)  ? 'gray' : _w.score2Cls(_w.data.computeScore(result.caPartRem2m, result.caPartRem1y, result.caPartRemGlobal2m, _w.pageData.budget.REMISE), 4)
            },
			oa: {
                val: _w.formatPrct(result.caPartOa2m),
                cls: isNaN(result.caPartOa2m) || !isFinite(result.caPartOa2m)  ? 'gray' : _w.score2Cls(_w.data.computeScore(result.caPartOa2m, result.caPartOa1y, result.caPartOaGlobal2m,_w.pageData.budget.OFFRESACTIVES), 4)
			}
        }
		return z;
    }
	// function de création de la requête pour l'appel vers Dashboard
    function makeDashboardQuery(cd) {
		var f = _w.makeSimpleFiltersClone();
		var aggreg = f.agg;
        f[f.agg] = cd;
		var test = delete f.agg;
		return 'agg='+aggreg+'&'+_w.makeQuery(f);
    }
	// function de création de la requête pour l'appel en Drill Down
    function makeDrillDownQuery(cd) {
        var f = _w.makeSimpleFiltersClone();
		f[f.agg] = cd;
		if(f.agg == 'prd6' || f.agg == 'org4')
			f.agg = f.agg.slice(0,3) == 'prd' ? (darty.wynn.getMaxFilter('org')== 4 ? 'org4' : 'org'+parseInt(darty.wynn.getMaxFilter('org')+1) ):
				(darty.wynn.getMaxFilter('prd')== 6 ? 'prd6' : 'prd'+parseInt(darty.wynn.getMaxFilter('prd')+1));
		else
			f.agg = f.agg.slice(0,3) + (parseInt(f.agg.slice(3)) + 1);
        return _w.makeQuery(f);
    }
	
	
	function updateTable() {
		metaDataTable.orientation = $('th.headerSortUp').length>0 ? 'up' : ($('th.headerSortDown').length>0 ? 'down' : '');
		metaDataTable.col = metaDataTable.orientation == 'up' ? parseInt($('th.headerSortUp').attr('id').substring(3,4)) : (metaDataTable.orientation == 'down' ? parseInt($('th.headerSortDown').attr('id').substring(3,4)) : '');
		metaDataTable.etat = $('#detailsTable').attr('class') == 'reducted' ? 'ferme':'ouvert';
	};
	
	function updateClassTable() {
		if($('#detailsTable').attr('class'))
			$('#detailsTable').removeClass();
		else
			$('#detailsTable').addClass('reducted');
	}
	
    function start() {
		$(document).ready(function () {
			$(document).on('click', '#detailsTable .linkExpand', function () {
                $('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
				updateClassTable();
				return false;
            });
			
			// Bouton Refresh Timer 
            $(document).on('click','p#lastUpdate', function () {
                if (refreshTimer) {
					updateTable();
					window.clearTimeout(refreshTimer);
                    refreshPage();
                }
            });
			
			// Bouton radio de choix de dimension
			$(document).on('click', 'div#bouton span.active', function () {
				// trouver le max de chaque dimension, et en fonction de celle ou l'on va, appliquer le max ! 
				var f = _w.makeSimpleFiltersClone();
				var max = false;
				var top = 0;
				for (var i in f) {
					if(($('span.active').attr('id') == 'prd' && i == 'prd6') || ($('span.active').attr('id') == 'org' && i == 'org4'))
						max = true;
					else if (i.substring(0,3) == $('span.active').attr('id'))
						top = parseInt(i.substring(3,4));
				}
					f.agg = (f.agg.substring(0,3) == 'prd'? 'org':'prd') + parseInt(top + 1);
				window.location.assign("http://" + window.location.host + "/details?" + _w.makeQuery(f));
			});
			
			// Menu déroulant => Redirect => itself + Aggregat 
			$(document).on('click', 'div.btn-menu.btnY', function () {
				if ($(this).attr('id')) {
					var text = '';
					split = window.location.search.split("&");
					for (var i in split) {
						if (i==0) 
							text += split[0].substring(0,5) + $(this).attr('id');
						else 
							text += '&'+split[i];
					}
					window.location.assign("http://" + window.location.host + "/details" + text);
				}
			});
			
			// bouton de suppression des filtres  
			$(document).on('click', 'div#ariane span.close', function () { // TODO : Clic sur l'img ... 
				darty.wynn.removeFilters('details',$(this).parent().parent().attr('class') );
            });
			
			// Bouton Home => Redirect => Accueil 
			$(document).on('click', 'span#home', function () {
                window.location.assign("http://" + window.location.host + "/accueil?agg=prd1");
            });
			
			// Menu déroulant => Affiche les options d'aggregat 
			$(document).on('click', 'div#zone', function () {
				// console.log('click sur div#zone');
                if($('div.menuDeroul').is(":hidden")) { // console.log('hidden to show');
					$('div.menuDeroul').show("fast", function(){}); }
				else { // console.log('show to hide');
					$('div.menuDeroul').hide("fast", function(){}); }
				// console.log('Menu deroulant !');
            });
			
			
			// bouton des onglets du tableau
			$(document).on('click', '.pageNumber.noActif', function () {
				// appel à refresh page, avec la valeur dans le DOM ! 
				$('.actif').removeClass('actif').addClass('noActif');
				$(this).removeClass('noActif').addClass('actif');
				refreshPage();
				return false;
            });
			
            window.setInterval(function(){ 
				var jour = new Date();
				updateTable(); // TODO : ne pas en avoir autant d'exécution, bloquer sur > à délai max - 5 secondes ?!?! 
				var text = parseInt(jour.getDate()) + '/'+(parseInt(jour.getMonth())+1) + '/'+parseInt(jour.getYear()%100)
				if (refreshTimer) {
					$('#lastUpdate').remove();
					$('#blueContentTop').prepend('<p id="lastUpdate">Dernière Màj: '+text+' à '+darty.wynn.formatTimeSecondLess(new Date(lastRefresh.getTime() - darty.wynn.config.timeDiff)) + ' <br />Prochaine Màj: ' + Math.ceil((nextRefresh - new Date()) / 1000) + 's</p>');
				}
				else {
					$('#lastUpdate').remove();
					$('#blueContentTop').prepend('<p id="lastUpdate"></p>');
				}
				refreshTimerDisplay = Math.ceil((nextRefresh - new Date()) / 1000);
			}, darty.wynn.config.refreshInfo);
            
			darty.wynn.setFilters('details');
			refreshPage();
			// $("table").tablesorter({ }); 
			$('div.delete').remove();
        });
    }
	
	// function de set du menu Déroulant !
	function getMenuAgg(callback) {
		var o = {};
		// catcher la  dimension d'aggreg 
		o.agg = {};
		o.agg.dim = obj.filtres.agg.substring(0,3);
		o.agg.niv = obj.filtres.agg.substring(3,4);
		o.render = {};
		
		$('th#menu').append('<div style="clear: both;"></div>');
		
		o.render.fin = '<div class="menuDeroul">';
		for (var n in obj) {
			if (n === 'dims') {
				for (var i in obj[n]) {
					if (i.substring(0,3) === o.agg.dim) {
						for (var h in obj[n][i]) {
							if (h.substring(3,4)===o.agg.niv)
							o.render.fin += '<div class="btn-menu btnX"><span>'+obj[n][i][h]+'</span></div>';
							else
							o.render.fin += '<div id="'+h+'" class="btn-menu btnY"><span>'+obj[n][i][h]+'</span></div>';
						}
					}
				}
			}
		}
		o.render.fin+='</div>';
		// récupère le nom par rapport au niveau d'aggreg
		for (var n in obj.dims) {
			if (n === o.agg.dim) {
				var size = obj.dims[n].length;
				for (var j in obj.dims[n]) {
					if (j.substring(3,4) === o.agg.niv)
						o.render.name = obj.dims[n][j];
				}
			}
		}
		// fonction de création du bloc html 
		if (o.render.fin != '') { 
			o.render.dbt = '<div id="zone">';
			o.render.end = '</div>'
			//o.render.imgTri = '<img class="arrow" src="./img/arrow.png">';
			o.render.imgTri = '';
			if (o.render.name != '') { // si jamais il y a un nom, on le rajoute
				var tmp = '';
				tmp = o.render.fin;
				o.render.fin = '<span>' + o.render.name + '</span>' + tmp;
			}
			//$('#zone').remove();
			$('#zone').append(o.render.fin);
			//$('.delete').append(o.render.imgTri);
		}
		callback();
	}	
    return {
        start: start
    };
	
})();
