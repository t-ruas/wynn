
darty.wynn.gui.details = (function () {
//window.event.cancelBubble = true;
    var _w = darty.wynn;
    var refreshTimer = null;
    var lastRefresh = null;
    var nextRefresh = null;

	var oneTime = false;
    function refreshPage() {
        refreshTimer = null;
        darty.wynn.data.getDetails(darty.wynn.makeSimpleFiltersClone(), function (error, result) {
            if (error) {
            } else {
                $('#mainContentMiddle').html(doT.template($('#tmplDetailsTable').text())(prepareModel(result)));
                refreshTimer = window.setTimeout(refreshPage, _w.config.reqInterval);
                lastRefresh = new Date();
                nextRefresh = new Date(lastRefresh.getTime() + _w.config.reqInterval);
				if (oneTime === false) {
					oneTime = true;
					getMenuAgg(function(){
					$("div.menuDeroul").css({"display":"hidden"});
				});
				}
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
			// agrandir le tableau avec le volet droit 
            $(document).on('click', '#detailsTable .linkExpand', function () {
                $('#detailsTable th:nth-child(3), #detailsTable td:nth-child(3)').nextAll().toggle();
				$('table').removeAttr("id");
				$('table').attr('id','detailsTableExpanded');
                return false;
            });
			$(document).on('click', '#detailsTableExpanded .linkExpand', function () {
                $('#detailsTableExpanded th:nth-child(3), #detailsTableExpanded td:nth-child(3)').nextAll().toggle();
				$('table').removeAttr("id");
				$('table').attr('id','detailsTable');
                return false;
            });
			
			$( "th.table-header img.hideImage" ).bind( "click", function() {
				alert('Le kiki de coco ! ');
			});
			
			// Boutons de tri du tableau
            $(document).on('click', 'tr th.table-header', function () {
				if ($(this).attr('id'))
					tablesorterControler($(this).attr('id'));
                console.log('tri ! ');
            });
			
			// Bouton Refresh Timer 
            $('#refreshTimer').on('click', function () {
                if (refreshTimer) {
                    window.clearTimeout(refreshTimer);
                    refreshPage();
                }
            });
            
			// Bouton radio de choix de dimension
			$(document).on('click', 'div#bouton span.active', function () {
				var split = window.location.search.split("&");
				var add = '';
				if (split[0].substring(5,8) == 'org') { add = 'prd'; }
				else { add = 'org'; }
				var url = '';
				for (var n in split) {
					if (n == 0) {
							if (add == 'org' && split[0].substring(8,9) < 5)
								url += split[0].substring(0,5) + add + split[0].substring(8,9);
							else
								url += split[0].substring(0,5) + add + '4';
					}
					else {
						url += '&'+split[n];
					}
				}
				window.location.assign("http://" + window.location.host + "/details" + url);
			});
			
			// Menu déroulant => Redirect => itself + Aggregat 
			$(document).on('click', 'div.btn-menu', function () {
				if ($(this).attr('id')) {
					var text = '';
					split = window.location.search.split("&");
					for (var i in split) {
						if (i==0) 
							text += split[0].substring(0,5) + $(this).attr('id');
						else 
							text += '&'+split[i];
					}
				}
				window.location.assign("http://" + window.location.host + "/details" + text);
			});
			
			// bouton de suppression des filtres  
			$(document).on('click', 'div#bouton-home div#ariane div img', function () {
                var text='';
				text=$(this).parent().parent().attr('class');
				removeFilter($(this).parent().parent().attr('class'));
            });
			
			// Bouton Home => Redirect => Accueil 
			$(document).on('click', 'img#home', function () {
                window.location.assign("http://" + window.location.host + "/accueil");
            });
			
			// Menu déroulant => Affiche les options d'aggregat 
			$(document).on('click', 'div#zone span', function () {
                if($('div.menuDeroul').is(":hidden"))
					$('div.menuDeroul').show("slow", function(){}); 
				else
					$('div.menuDeroul').hide("fast", function(){});
				console.log('Menu deroulant !');
            });
			
			// Menu déroulant => Affiche les options d'aggregat 
			$(document).on('click', 'div#zone img', function () {
                console.log('tri sur la première colonne :)')
            });
			
			// bouton d'activation de test TEST !!! 
			$(document).on('click', 'div#blueContent', function () {
                getMenuAgg(function(){
					$('.menuDeroul').css('display','hidden');
				});
            });
			
			
            window.setInterval(function () {
                if (refreshTimer) {
                    $('#refreshTimer').text('date des données ' + _w.formatTime(lastRefresh) + ' prochaine récupération dans ' + Math.ceil((nextRefresh - new Date()) / 1000) + 's.');
                } else {
                    $('#refreshTimer').text('');
                }
            }, 1000);
			getAriane();
			refreshPage();
        });
    }
	
	// function de clic les croix des filtres 
	function elemCount(dim) { // compte le nombre d'élements type dim dans l'array et retourne la valeur
		var cpt = 0;
		obj = _w.pageData.filtres;
		for (var u in obj) {
			if (u.substring(0,3) == dim)
				cpt=u.substring(3,4);
		} 
		return cpt;
	}
	function constructUrl(dim, cpt) {
		// dim représente le niveau de celui que l'on doit exclure
		// cpt représente le niveau de celui que l'on doit exclure 
		obj = _w.pageData.filtres; // 3 trucs : agg, org, puis prd 
		var result = '';
		for (var n in obj) {
			if (n.substring(0,3) == 'agg') {
				// pour ne pas mettre l'&
				result += n + '=' +obj[n];
			}
			else if (n.substring(0,3) == dim && n.substring(3,4) == cpt) {
				// on ne le prend pas
			}
			else {
				result += '&' + n + '=' +obj[n].cd;
			}
		}
		return result;
	}
	function removeFilter(dim) { // au clic, il faut que le filtre de niveau le plus haut soit enlevé !
		obj = _w.pageData;
		for (var n in obj.filtres) {
			if (n.substring(0,3) == dim) { // TODO : check par l'objet plutôt que par l'url !  
				var url = window.location.search.split("&");
				var cpt = elemCount(dim); 
				url = constructUrl(dim, cpt);
				window.location.assign("http://" + window.location.host + "/details?" + url);
			}
		}
	}
	
	// function d'installation du fil d'ariane
	function setBouton(aggreg) {
		var agg = 'span#'+aggreg;
		$(agg).removeClass().addClass('noActive');
	}
	function getAriane() { // pour la ligne prd, afficher le filtre prd le plus haut
						   // pour la ligne org, afficher le filtre org le plus haut 
		var text = {};
		text.prdRep = 'Tous Produits';
		text.orgRep = 'Darty France';
		text.prd = '';
		text.org = '';
		text.intro1 = '<div id="ariane';
		text.intro2 = '>'
		text.endReq = '</div>'
		
		for(var index in _w.pageData.filtres) { 
			if (index.substring(0,3) == 'org') {
				text.org = '<span id="'+_w.pageData.filtres[index].lib+' class="org" "> '+_w.pageData.filtres[index].lib +' </span><span id="X.img"><img src="/images/details/croix.png" alt="org" /></span>'+'</div>'
			}
			if (index.substring(0,3) == 'prd') {
				text.prd = '<span id="'+_w.pageData.filtres[index].lib+' class="prd" "> '+_w.pageData.filtres[index].lib +' </span><span id="X.img"><img src="/images/details/croix.png" alt="prd" /></span>'+'</div>';
			}
		}
		$("#ariane1").remove();
		$("#ariane2").remove();
		// on enlève les 2 blocs à refaire ariane1 => Produits, ariane2 => Lieux
		if (text.org != '') { // si pas de filtre org 
			$("#ariane").append(text.intro1+'2" class="org"'+text.intro2+text.org+text.endReq);
		}
		else {  // si filtre org 
			$("#ariane").append(text.intro1+'2" class="org"'+text.intro2+text.orgRep+text.endReq); 
		}
		if (text.prd != '') {  // si pas de filtre prd
			$("#ariane").append(text.intro1+'1" class="prd"'+text.intro2+text.prd+text.endReq); 
		} 
		else {  // si filtre prd
			$("#ariane").append(text.intro1+'1" class="prd"'+text.intro2+text.prdRep+text.endReq); 
		}
		setBouton(_w.pageData.filtres.agg.substring(0,3));
	}
	
	function tablesorterControler(choix) { // fonction de tri du tableau (reçoit l'id du bloc html en arg)
		console.log(choix);
		$("table#detailsTable").tablesorter( {sortList: [[choix,0]]} );
	}
	
	// function de set du menu Déroulant !
	function getMenuAgg(callback) {
		console.log('1'+obj);
		var o = {};
		// catcher la  dimension d'aggreg 
		o.agg = {};
		o.agg.dim = obj.filtres.agg.substring(0,3);
		o.agg.niv = obj.filtres.agg.substring(3,4);
		o.render = {};
		
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
			o.render.imgTri = '<img src="images/details/fleche-top.png" alt="" class="" />';
			if (o.render.name != '') { // si jamais il y a un nom, on le rajoute
				var tmp = '';
				tmp = o.render.fin;
				o.render.fin = '<span>' + o.render.name + '</span>' + o.render.imgTri + tmp;
			}
			$('#zone').remove();
			$('#menu').append(o.render.dbt+o.render.fin+o.render.end);
		}
		callback();
	}	
    return {
        start: start,
		removeFilter: removeFilter
    };
	
})();
