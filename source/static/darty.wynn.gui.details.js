// fab
darty.wynn.gui.details = (function () {
//window.event.cancelBubble = true;
    var _w = darty.wynn;
    var refreshTimer = null;
    var lastRefresh = null;
    var nextRefresh = null;

	var oneTime = false;
    function refreshPage() { // controller de la page
        refreshTimer = null;
        darty.wynn.data.getDetails(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
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
				// récupérer la valeur à modifier ! 
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
				
				refreshTimer = window.setTimeout(refreshPage, _w.config.reqInterval);
                lastRefresh = new Date();
                nextRefresh = new Date(lastRefresh.getTime() + _w.config.reqInterval);
				
				getMenuAgg(function(){ // une fois le code généré, on le masque 
					$("div.menuDeroul").css({"display":"hidden"});
				});
				if ((obj.filtres.agg.substring(0,3) == 'prd' && obj.filtres.agg.substring(3,4) == '6' )||
					(obj.filtres.agg.substring(0,3) == 'org' && obj.filtres.agg.substring(3,4) == '4' )) {
					$("table#detailsTable").find("a").removeAttr("href");
					$(".libelle").css("font-size","60%"); // contrôle ?!? Vérification ?!
					// console.log($('.first-column div.code a').text());
				}
				else
				{
					$(".code").remove();
				}
				$("table").tablesorter({ // configuration du tri de tableau ! 
					headers: { 
					0: {sorter:'subclass'},
					1: {sorter:'currency'}, 
					2: {sorter:'percent'},
					3: {sorter:'percent'},
					4: {sorter:'percent'},
					5: {sorter:'percent'},
					6: {sorter:'percent'}
					} 
				});
				// pour réduire le tableau au rechargement de la page ! 
				$('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
				if($('#detailsTable').attr('class'))
					$('#detailsTable').removeClass();
				else
					$('#detailsTable').addClass('reducted');
				
				
			}
        });
    }
	
	// function de répartition des données dans le template HTML
    function prepareModel(data, pageNumber) {
		if (isNaN(pageNumber))
			pageNumber = 1;
		// console.log('prepare model ! pageNumber : ' + pageNumber);
        var model = {
            list: []
        };
		var sum = {}; 
		
        var fields = ['ca1y', 'ca2m', 'vt1y', 'vt2m', 'vtAcc1y', 'vtAcc2m', 'vtServ1y', 'vtServ2m', 'vtOa1y', 'vtOa2m', 'caRem1y', 'caRem2m'];
        var t = {};

        for (var i = 0, imax = fields.length; i < imax; i++) {
            t[fields[i]] = 0; // init
			sum[fields[i]] = 0;
        }

		var cptNotZero = 1;
		
		//console.log('jmax = ' +  data.length);
        for (var j = 0, jmax = data.length; j < jmax; j++) {
			cptNotZero ++;
			
			var lineData = data[j]; 																	// lineData contient toutes les infos d'une ligne
																										// console.log('lineData : ');
			var lineModel = createLineModel(lineData); 													// on créé la ligne
			lineModel.cd = lineData.cd;
            lineModel.lib = lineData.lib; 																// on rajoute le lib
            lineModel.ddQuery = makeDrillDownQuery(lineData.cd); 										// on rajoute les liens
            lineModel.dbQuery = makeDashboardQuery(lineData.cd); 										// le second lien
			lineModel.order = typeof lineData.ordre === 'number' ? lineData.ordre : cptNotZero;
			if (j >= (darty.wynn.config.linePerPage*(pageNumber-1)) && j < (darty.wynn.config.linePerPage*pageNumber)) {
			//	console.log('j : ' + j)
				model.list.push(lineModel); 																}// on rajoute dans la liste de model.
			// on ne push que les lignes de cette page précise ! 
			createSumLine(lineData, sum); // mais on veut une somme correcte, donc on garde la somme =)
        }

		console.log('Total : ');
        model.totals = createLineModel(sum);
        return model;
    }
	
	function createSumLine(data, sum) { // somme les valeurs d'une ligne pour l'ensemble
		var fields = ['ca1y', 'ca2m', 'vt1y', 'vt2m', 'vtAcc1y', 'vtAcc2m', 'vtServ1y', 'vtServ2m', 'vtOa1y', 'vtOa2m', 'caRem1y', 'caRem2m'];
		for (y = 0; y < fields.length; y++)
		{
			if (typeof data[fields[y]] === 'number')
				sum[fields[y]] += data[fields[y]];
		}
	}
	
    // Ajout d'un objet sur les données de la ligne pour ne pas mélanger les valeurs d'affichage avec les données numériques en entrée.
    function createLineModel(data) {
        _w.data.computeLineValues(data);
		return {
            ca: _w.formatPrice(data.ca2m),
            caEvo: {
                val: _w.formatEvo(data.caEvo2m),
                cls: isNaN(data.caEvo2m) || !isFinite(data.caEvo2m) ? 'gray' : _w.score2Cls(_w.data.computeScoreEvol(data.caEvo2m, data.ca1y, data.caEvoGlobal2m, _w.pageData.budget.CA), 4)
            },
			acc: {
                val: _w.formatPrct(data.caPartAcc2m),
                cls: isNaN(data.caPartAcc2m) || !isFinite(data.caPartAcc2m) ? 'gray' : _w.score2Cls(_w.data.computeScore(data.caPartAcc2m, data.caPartAcc1y, data.caPartAccGlobal2m,_w.pageData.budget.ACCESSOIRES), 4)
            },
			serv: {
                val: _w.formatPrct(data.caPartServ2m),
                cls: isNaN(data.caPartServ2m) || !isFinite(data.caPartServ2m) ? 'gray' : _w.score2Cls(_w.data.computeScore(data.caPartServ2m, data.caPartServ1y, data.caPartServGlobal2m, _w.pageData.budget.SERVICES), 4)
            },
			rem: {
                val: _w.formatPrct(data.caPartRem2m),
                cls: isNaN(data.caPartRem2m) || !isFinite(data.caPartRem2m)  ? 'gray' : _w.score2Cls(_w.data.computeScore(data.caPartRem2m, data.caPartRem1y, data.caPartRemGlobal2m, _w.pageData.budget.REMISE), 4)
            },
			oa: {
                val: _w.formatPrct(data.caPartOa2m),
                cls: isNaN(data.caPartOa2m) || !isFinite(data.caPartOa2m)  ? 'gray' : _w.score2Cls(_w.data.computeScore(data.caPartOa2m, data.caPartOa1y, data.caPartOaGlobal2m,_w.pageData.budget.OFFRESACTIVES), 4)
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
			// agrandir le tableau avec le volet droit 
            $(document).on('click', '#detailsTable .linkExpand', function () {
                $('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
				if($('#detailsTable').attr('class'))
					$('#detailsTable').removeClass();
				else
					$('#detailsTable').addClass('reducted');
				return false;
            });
			
			// Bouton Refresh Timer 
            $('#blueContentTop').on('click', function () {
                if (refreshTimer) {
                    window.clearTimeout(refreshTimer);
                    refreshPage();
                }
            });
            
			// Bouton radio de choix de dimension
			$(document).on('click', 'div#bouton span.active', function () {
				// trouver le max de chaque dimension, et en fonction de celle ou l'on va, appliquer le max ! 
				var split = window.location.search.split("&");
				
				// console.log('changement de dimension => go to ('+agg+')');
				// console.log('split : ');
				// console.log(split);
				var url = '';
				var maxPrd = 0;
				var maxOrg = 0;
				for (var n in split) {
					if (n != 0) {
						// console.log('split['+n+'] : ' + split[n].substring(0,3));
						// console.log(split[n])
						if (split[n].substring(0,3) == 'prd') {
							if (split[n].substring(3,4) > maxPrd) {
								maxPrd = parseInt(split[n].substring(3,4));
							}
						}
						else if (split[n].substring(0,3) == 'org') {
							if (split[n].substring(3,4) > maxOrg) {
								maxOrg = parseInt(split[n].substring(3,4));
							}
						}
						else {
							console.log('Bug changement de dimension ! ')
						}
					}
				}
				var agg = '';
				maxPrd += 1;
				maxOrg += 1;
				if (split[0].substring(5,8) == 'org') // &agg=org3
					agg = 'prd'+(maxPrd); 
				else
					agg = 'org'+(maxOrg);
				
				for(var i = 0; i < split.length; i++) {
					if (i != 0) {
						url += '&'+split[i];
					}
					else {
						url += '?agg='+agg;
					}
				}
					
				// console.log();
				window.location.assign("http://" + window.location.host + "/details" + url);
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
                window.location.assign("http://" + window.location.host + "/accueil");
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
			
			// Menu déroulant => Affiche les options d'aggregat 
			$(document).on('click', 'div.delete', function () {
                $("table").tablesorter({ // configuration du tri de tableau ! 
					headers: { 
					0: {sorter:'subclass'},
					1: {sorter:'currency'}, 
					2: {sorter:'percent'},
					3: {sorter:'percent'},
					4: {sorter:'percent'},
					5: {sorter:'percent'},
					6: {sorter:'percent'}
					} 
				
				}); 
				//$('div#zone').parent().addClass('headerSortDown');
				var elem = $("div.delete").remove();
				//$('div#zone').append('');
				//$('div#zone').append('<a><img class="arrow" src="./img/arrow.png"></a>')
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
				var text = parseInt(jour.getDate()) + '/'+parseInt(jour.getMonth()) + '/'+parseInt(jour.getYear()%100)
				if (refreshTimer) {
					$('#lastUpdate').remove();
					$('#blueContentTop').prepend('<p id="lastUpdate">Dernière Mise à jour le : '+text+' à '+darty.wynn.formatTimeSecondLess(lastRefresh) + ' <br />Prochaine mise à jour dans: ' + Math.ceil((nextRefresh - new Date()) / 1000) + 's</p>');
				}
				else {
					$('#lastUpdate').remove();
					$('#blueContentTop').prepend('<p id="lastUpdate"></p>');
				}
				refreshTimerDisplay = Math.ceil((nextRefresh - new Date()) / 1000);
			}, darty.wynn.config.refreshInfo);
            
			darty.wynn.setFilters('details');
			refreshPage();
			$("table").tablesorter({ }); 
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
