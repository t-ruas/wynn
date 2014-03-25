 // fab
darty.wynn.gui.details = (function () {
    var _w = darty.wynn;
    var refreshTimer = null;
    var lastRefresh = null;
    var nextRefresh = null;
	var flag1erAffichage = true;
	
	function refreshPage() {
        /*   ___________________________
			|							|\
			|							||
			|							||
			|							||
			|___________________________||
			\____________________________\
        Sont en sessionStorage : 
        - le nombre de données actuellement dans l'index
        - l'état du tableau : ouvert ou ferme
        - le tri : true ou false
        - la colonne*/

        refreshTimer = null;
        
        /* On sette la transition : */
        $('#mainContent div#spin').length === 0 && _w.fromClick ? $('#mainContent').prepend("<div id=\"spin\"></div>") : '';
		$('#mainContent div#spin').length === 1 && _w.fromClick ? $('#mainContent div#spin').prepend(spinner.el) : '';
		typeof sessionStorage.QTE_DAY_LINES !== 'undefined' ? ($('#mainContent div#spin').length === 1 && _w.fromClick ? $('#mainContent div#spin').prepend("<h3>Processing "+sessionStorage.QTE_DAY_LINES+" documents</h3>") : '' ) : ''

		_w.fromClick = true;
        
        /* On attend la réponse du serveur node */
        darty.wynn.data.getDetails(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
    			var tmp = result.pop(); // on récupère la valeur NB_LINES 
				typeof sessionStorage.QTE_DAY_LINES === 'undefined' ? sessionStorage.QTE_DAY_LINES = tmp.QTE_LINES : (sessionStorage.QTE_DAY_LINES !== tmp.QTE_LINES ? sessionStorage.QTE_DAY_LINES = tmp.QTE_LINES : '');
				
				
				spinner.stop(); // on stope le spinner
				$('#mainContent div#spin').remove(); // on enlève le container
				
				/* Mise en place des onglets */
				// Algo pour calculer le nombre de page, le nombre d'onglet à créer, ainsi que les objets dans la page !
				var pageActive = $('#onglet-container div.actif').attr('id'); // retrouver le .actif ! 
				// console.log(pageActive);
				//pageActive = 1;
				
				// Préparation des données pour être envoyées sur la page client 
				if (!darty.wynn.checkBrowser()) {// false = IE8 ! 
					$('#mainContentMiddle').html(doT.template($('#tmplDetailsTable').html())(prepareModel(result, pageActive)));
				}
				else {
					$('#mainContentMiddle').html(doT.template($('#tmplDetailsTable').text())(prepareModel(result, pageActive)));
				}
				
				setOnglets(result, pageActive);
				
				$("table").tablesorter( // configuration du tri de tableau !
					{ headers: { 
					0: {sorter:'text'}, // subclass :'(
					1: {sorter:'currency'}, 
					2: {sorter:'percent'},
					3: {sorter:'percent'},
					4: {sorter:'percent'},
					5: {sorter:'percent'},
					6: {sorter:'percent'} }
				});
				
				_w.fromClick = false;
				refreshTimer = window.setTimeout(refreshPage, _w.config.reqInterval);
                lastRefresh = new Date();
                nextRefresh = new Date(lastRefresh.getTime() + _w.config.reqInterval);
				
				getMenuAgg(function(){ // une fois le code généré, on le masque 
					$("div.menuDeroul").css({"display":"hidden"});
				});
				
				if ((typeof obj.filtres.prd6 != 'undefined' && obj.filtres.agg == 'org5' )||
					(typeof obj.filtres.org5 != 'undefined' && obj.filtres.agg == 'prd6' )) {
					$("table#detailsTable tbody").find("a").removeAttr("href");
				}
				if (obj.filtres.agg == 'org5'){
					$('table th#col2').html('% Evol')
					$('table td.linkExpand').removeClass().addClass('content linkExpand');
				}
				
				/* Ouverture tableau ! */
				// setTableauState();
				putTableauState();
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
        darty.wynn.orderResult(data);
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
            lineModel.lib = lineData.lib;
            lineModel.lib.length == 0 ? lineModel.lib = lineModel.cd : '',
            lineModel.ddQuery = makeDrillDownQuery(lineData.cd); 										// on rajoute les liens
            lineModel.dbQuery = makeDrillDownQuery(lineData.cd); 										// on rajoute les liens
            lineModel.order = typeof lineData.ordre === 'number' ? lineData.ordre : cptNotZero;
			if (j >= (darty.wynn.config.linePerPage*(pageNumber-1)) && j < (darty.wynn.config.linePerPage*pageNumber)) {
				model.list.push(lineModel);}															// on rajoute dans la liste de model.
			createSumLine(lineData, sum);
		}
		model.totals = createLineModel(sum);
		// console.log(sum);
		f = _w.makeSimpleFiltersClone();
		model.totals.dbQuery = _w.makeQuery(f);
		return model; 
		// La mise en forme est aussi définie sur le template 
    }
    // Ajout d'un objet sur les données de la ligne pour ne pas mélanger les valeurs d'affichage avec les données numériques en entrée.
    function createLineModel(data) {
        var result = _w.data.computeLineValues(data); 
        /* Les calculs sont effectués dans computeLineValues notamment les KPI */
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
        // console.log(z, result.ca2m);
		return z;
    }
	function createSumLine(data, sum) { // somme les valeurs d'une ligne pour l'ensemble
		for (y = 0; y < _w.fields.length; y++)
		{
			if (typeof data[_w.fields[y]] === 'number') {
				sum[_w.fields[y]] += data[_w.fields[y]];
			}
		}
		// console.log(sum)
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
		if(f.agg == 'prd6' || f.agg == 'org5')
			f.agg = f.agg.slice(0,3) == 'prd' ? (darty.wynn.getMaxFilter('org')== 5 ? 'org5' : 'org'+parseInt(darty.wynn.getMaxFilter('org')+1) ):
				(darty.wynn.getMaxFilter('prd')== 6 ? 'prd6' : 'prd'+parseInt(darty.wynn.getMaxFilter('prd')+1));
		else
			f.agg = f.agg.slice(0,3) + (parseInt(f.agg.slice(3)) + 1);
		// console.log(_w.makeQuery(f));
        return _w.makeQuery(f);
    }
	
	
	function setOnglets(result, pageActive) {
		// console.log('smth');
		// var pageActive = parseInt($('#onglet-container div.actif').attr("id"));
		isNaN(pageActive) ? pageActive = 1 : '';
		var pageNumber = result.length%darty.wynn.config.linePerPage > 0 ? parseInt(result.length/darty.wynn.config.linePerPage) + 1 : parseInt(result.length/darty.wynn.config.linePerPage);
		var text = '';
		// console.log("setOnglets : pageActive : ", pageActive, " pageNumber : ", pageNumber);
		// pageActive = 3;
		// pageNumber = 3;
		if (!isNaN(pageActive) && !isNaN(pageNumber)) {
			if (pageActive == 1 && pageNumber == 1) {
				text = "";
			}
			else if (pageActive == 1 && pageNumber > 0) {
				// btn inf inactif, #onglet, btn sup,
				text = "<div id=\"onglet-container\"><div class=\"fleche left\"><img src=\"img/ongletInfInactif.png\" width=\"24px\" heigth=\"24px\" alt=\"Précédent\"/></div>"
				text += "<div class=\"left valOnglet\">"+(parseInt(pageActive))+"</div>";
				text += "<div class=\"left fleche ongletCliquable\" id="+(parseInt(pageActive)+1)+" ><img src=\"img/ongletSupActif.png\" width=\"24px\"  heigth=\"24px\" alt=\"Suivant\"/></div></div>";
			}
			else if (pageActive > 1 && pageActive < pageNumber) {
				text = "<div id=\"onglet-container\"><div class=\"fleche left ongletCliquable\" id="+(parseInt(pageActive)-1)+" ><img src=\"img/ongletInfActif.png\" width=\"24px\"  heigth=\"24px\" alt=\"Suivant\"/></div>";
				text += "<div class=\"valOnglet actif left\" id="+(parseInt(pageActive))+">"+(parseInt(pageActive))+"</div>";
				text += "<div class=\"left fleche ongletCliquable\" id="+(parseInt(pageActive)+1)+" ><img src=\"img/ongletSupActif.png\" width=\"24px\"  heigth=\"24px\" alt=\"Suivant\"/></div></div>";
			}
			else if (pageActive > 1 && pageActive == pageNumber) {
				text = "<div id=\"onglet-container\"><div class=\"fleche left ongletCliquable\" id="+(parseInt(pageActive)-1)+" ><img src=\"img/ongletInfActif.png\" width=\"24px\"  heigth=\"24px\" alt=\"Suivant\"/></div>";
				text += "<div class=\"valOnglet left\">"+(parseInt(pageActive))+"</div>";
				text += "<div class=\"fleche left\"><img src=\"img/ongletSupInactif.png\" width=\"24px\" heigth=\"24px\" alt=\"Suivant\"/></div></div>"
			}
		}
		else {
			/*isNaN(pageActive) ? pageActive = '#' : '';
			text = "<div><img src=\"img/ongletInfInactif.png\" width=\"24px\" heigth=\"24px\" alt=\"Précédent\"/></div>"
			text += "<div class=\"valOnglet\">"+0+"</div>";
			text += "<div class=\"ongletCliquable\" id="+(parseInt(pageActive)+1)+" ><img src=\"img/ongletSupActif.png\" width=\"24px\"  heigth=\"24px\" alt=\"Suivant\"/></div>";
			*/
		}
		/*for(var i = 0; i < pageNumber; i++) {
			text += '<span href="" class="pageNumber ';
			if(typeof pageActive == 'number' && i+1 == pageActive)
				text += 'actif';
			else
				text += 'noActif';
			text += '" value="'+parseInt(i+1)+'">'+parseInt(i+1)+'</span>';
		}*/
		// if(parseInt(pageNumber) > 1) {
		// var test = 
		// console.log(text);
		$('div#pageNumberLoader').html(text);
		// console.log($('#pageNumberLoader').text());
		// console.log('3', text, test)
		// }
		// else 
		// 	$('#pageNumberLoader').remove();
		return pageActive;
	}

	function setTableauState() { // somme les valeurs d'une ligne pour l'ensemble!
		var tab = $('#detailsTable').attr('class') == 'reducted' ? 'ferme': 'ouvert';
		var ord = $('#detailsTable th.headerSortUp').length > 0 ? 'desc' : 
				$('#detailsTable th.headerSortDown').length > 0 ? 'asc' : '';
		var col = ord === 'desc' ? parseInt($('th.headerSortUp').attr('id').substring(3,4)) : 
			ord === 'asc' ? parseInt($('th.headerSortDown').attr('id').substring(3,4)) : '';

		if (typeof sessionStorage.tableau === 'undefined' || typeof sessionStorage.colonne === 'undefined' || typeof sessionStorage.ordre === 'undefined') {
			// Premier affichage de la journée : Setting des valeurs : 
			ord.length > 0 ? '' : ord = 'desc';
			typeof col === 'number' ? '' : col = 1;
			
			sessionStorage.setItem("tableau", tab);
			sessionStorage.setItem("ordre", ord);
			sessionStorage.setItem("colonne", col);
		}
		else
		{
			var localTab = sessionStorage.getItem('tableau') !== null ? sessionStorage.getItem('tableau') : '';
			if (localTab.length > 0) {
				if (tab.length > 0) {
					if (localTab !== tab)
						sessionStorage.setItem("tableau", tab);
				}
				else 
					sessionStorage.setItem("tableau", tab);
				}
			else 
				if (tab.length > 0) {
					sessionStorage.setItem("tableau", tab);
				}

			var localOrd = sessionStorage.getItem("ordre") !== null ? sessionStorage.getItem("ordre") : '';
			if(localOrd.length > 0){
				if (ord.length > 0){
					if (localOrd !== ord) 
						sessionStorage.setItem("ordre", ord);
				}
				else
					sessionStorage.setItem("ordre", ord);
			}
			else 
				if (ord.length > 0) {
					sessionStorage.setItem("ordre", ord);
				}

			var localCol = sessionStorage.getItem("colonne") !== null ? parseInt(sessionStorage.getItem("colonne")) : '';
			if (typeof localCol == "number") {
				if (typeof col == "number") {
					if (localCol !== col)
						sessionStorage.setItem("colonne", col);
				}
				else
					sessionStorage.setItem("colonne", col);
			}
			else 
				if (typeof col == 'number') {
					sessionStorage.setItem("colonne", col);
				}
		}
		// console.log('End of SessionStorageSet ', sessionStorage, localTab, localCol, localOrd)
	}
	function putTableauState() {
		if (typeof sessionStorage.tableau === 'undefined') {
			// console.log('Etat du tableau indeterminé ! ');
			var sorting = [[1,1]];
			$("table").trigger("sorton",[sorting]);
		}
		else {
			var a = sessionStorage.ordre === "desc" ? 1 : 0;
			var b = parseInt(sessionStorage.colonne);
			var sorting = [[b,a]];
			if (isNaN(b)) {
				b = 1;
				// return ;
			}
			$("table").trigger("sorton",[sorting]);
			if (sessionStorage.tableau === 'ferme') {
				if ($('#detailsTable.reducted').length == 0) {
					$('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
					$('#detailsTable').addClass('reducted');
				}
			}
			else 
				if($('#detailsTable.reducted').length == 1) {
					$('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
					$('#detailsTable').removeClass();
				}
		}
		setTableauState();
	}
	
    
	
    function start() {
		$(document).ready(function () {
			/* Si on  est au niveau vendeur : il faut afficher l'entete Prime et non evol + 
			Enlever la couleur du background de Prime pour fond blanc/gris clair */

			$(document).on('click', '#detailsTable .linkExpand', function () {
                $('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
                if($('#detailsTable').attr('class'))
					$('#detailsTable').removeClass();
				else
					$('#detailsTable').addClass('reducted');
				setTableauState(); 
				return false;
            });
            $(document).on('click', '#detailsTable .Dexpand', function () {
                $('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
                if($('#detailsTable').attr('class'))
					$('#detailsTable').removeClass();
				else
					$('#detailsTable').addClass('reducted');
				setTableauState(); 
				return false;
            });
			// Bouton Refresh Timer 
            $(document).on('click','p#lastUpdate', function () {
                if (refreshTimer) {
					setTableauState();
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
					if(($('span.active').attr('id') == 'prd' && i == 'prd6') || ($('span.active').attr('id') == 'org' && i == 'org5'))
						max = true;
					else if (i.substring(0,3) == $('span.active').attr('id'))
						top = parseInt(i.substring(3,4));
				}
				f.agg = (f.agg.substring(0,3) == 'prd'? 'org':'prd') + parseInt(top + 1);
				window.location.assign("/details?" + _w.makeQuery(f));
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
					window.location.assign("/details" + text);
				}
			});
			// bouton de suppression des filtres  
			$(document).on('click', 'div#ariane span.close', function () {
				darty.wynn.removeFilters('details',$(this).parent().parent().attr('class') );
            });
      //       $(document).on('click', 'body', function(){
      //       	// console.log('click');
      //   		// $('mainContentMiddle div#pageNumberLoader').html('<div><img src="img/ongletInfInactif.png" width="24px" heigth="24px" alt="Précédent"/></div><div class="valOnglet">1</div><div class="ongletCliquable" id=1 ><img src="img/ongletSupActif.png" width="24px"  heigth="24px" alt="Suivant"/></div>');
      //   		// $("div#pageNumberLoader").html('<div><img src="img/ongletInfInactif.png" width="24px" heigth="24px" alt="Précédent"/><span>Darty</span></div>');
      //   		$("div#pageNumberLoader").html('<div style="margin: 15px auto;width:110px;"><div style="float:left; margin:10px 5px"><img src="img/ongletInfInactif.png" width="24px" heigth="24px" alt="Précédent"/></div><div style="float:left" class="valOnglet">1</div><div style="float:left; margin:10px 5px" class="ongletCliquable" id="1" ><img src="img/ongletSupActif.png" width="24px"  heigth="24px" alt="Suivant"/></div></div>');
    		// });
			$(document).on('click', 'span#home', function () {
                window.location.assign("/accueil?agg=prd1");
            });
			// Menu déroulant => Affiche les options d'aggregat 
			$(document).on('click', 'div#zone', function () {
				if($('div.menuDeroul').is(":hidden")) { // console.log('hidden to show');
					$('div.menuDeroul').show("fast", function(){}); }
				else { 
					$('div.menuDeroul').hide("fast", function(){}); }
            });
			
			$(document).on("mouseenter", "tr td.first-column", function() {
				pos = $(this).findPos();
				$(this).prepend('<div id="rm" style="position:absolute;background-color:rgb(249, 249, 249);width: 80px; padding:0px 4px 0px 15px;top:'+(pos.y-116)+'px; left: '+(pos.x-50)+'px;">'+$(this).children("div.code").attr("code_to_display")+'</div>').fadeIn('slow'); 
			});
			$(document).on("mouseleave", "tr td.first-column", function() {
				$(this).children().remove("#rm");
			});

			// bouton des onglets du tableau
			$(document).on('click', 'div.ongletCliquable', function () {
				$('.actif').removeClass('actif');
				$(this).addClass('actif');
				// console.log($(this).attr('id'));
				refreshPage();
				return false;
            });

			
			
			// $("div.code rm").remove();
			// $(document).on("mouseleave", "table div.code", function (){
			// 	$('#rm').remove();
			// });
			// $(document).on("mouseover","table div.code", function () {
	  		//           pos = $(this).findPos();
	  		//           $(this).prepend('<div id="rm" style="position:absolute;background-color:rgb(249, 249, 249);width: 80px; padding:0px 4px 0px 15px;top:'+(pos.y-121)+'px; left: '+(pos.x-56)+'px;">'+$(this).attr("code_to_display")+'</div>').fadeIn('slow'); 
	  		//       });
	        // $(document).on("mouseover","table tr td.first-column", function () {
	        //     pos = $(this).findPos();
	        //     $(this).children('.code').prepend('<div id="rm" style="position:absolute;background-color:rgb(249, 249, 249);width: 80px; padding:0px 4px 0px 15px;top:'+(pos.y-121)+'px; left: '+(pos.x-56)+'px;">'+$(this).children('.code').attr("code_to_display")+'</div>').fadeIn('slow'); 
	        // });
	        // $(document).on("mouseout","table div.code", function () {
	        //     $('#rm').remove(); 
	        // });
	        window.setInterval(function(){ 
				var jour = new Date();
				setTableauState(); // TODO : ne pas en avoir autant d'exécution, bloquer sur > à délai max - 5 secondes ?!?! 
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