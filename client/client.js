// create marker collection
var MarkersHistory = new Meteor.Collection('markershistory');

var throttledScale = _.throttle(renderScale, 1000, {leading: false});
var throttledTotal = _.throttle(renderTotal, 1000, {leading: false});

var map;
var markersGroup = {
        edenor: L.layerGroup(),
        edesur: L.layerGroup(),
        cortes: L.layerGroup(),
};

var min, max;
var userCount = {total: 0, edenor: 0, edesur: 0};
var caseCount = {total: 0, edenor: 0, edesur: 0};
var lastValue = {};

var RG = new L.ReverseGeoSearch({'accept-language': 'es'});

var heatmapLayer = new HeatmapOverlay({
        radius: 0.02,
        maxOpacity: .8,
        scaleRadius: true,
        useLocalExtrema: false,
        valueField: 'value'
});

var toolong = 60*60;

moment.locale('es');
Meteor.subscribe('markers');
Meteor.subscribe('markershistory');

function timestamp(str) {
        return moment(str).unix();
}

function formatDate(value) {
        return moment.unix(value).format('YYYY-MM-DD hh:mm:ss');
}

function setDate(value) {
        $(this).html(formatDate(value));
        renderMap($('#range').val());
}

function scaleRange() {
        var range = $('#range').val();
        if (!range)
                return '';
        var duration = range[1] - range[0];
        return moment.duration(duration, 'seconds').humanize();
}

function renderScale (from, to) {
        var range = $('#range').noUiSlider({
                start: [ timestamp(from), timestamp(to) ],
	        range: {
		        'min': timestamp(from),
		        'max': timestamp(to)
	        },
//                step: 60 * 60 * 1000,
	        // Full number format support.
	        format: wNumb({
		        decimals: 0
	        }),
                connect: true,
        });

        // Optional addon: creating Pips (Percentage In Point);
        $('#range').noUiSlider_pips({
	        mode: 'range',
	        density: 10
        });

        $("#range").Link('lower').to('-inline-<div class="tooltip"></div>', setDate);
        $("#range").Link('upper').to('-inline-<div class="tooltip"></div>', setDate);
}

function renderTotal (userCount, caseCount) {
        $('.userCountTotal').html(userCount.total);
        $('.userCountEDENOR').html(userCount.edenor);
        $('.userCountEDESUR').html(userCount.edesur);

        $('.caseCountTotal').html(caseCount.total);
        $('.caseCountEDENOR').html(caseCount.edenor);
        $('.caseCountEDESUR').html(caseCount.edesur);
}

function popupContent (document) {
        return Blaze.toHTMLWithData(Template.cuttext, document);
}

function renderMap(range) {
        $('.humanRange').html(scaleRange());
        _.each (markersGroup, function (layer) {
                layer.clearLayers();
        });
        userCount = {total: 0, edenor: 0, edesur: 0};
        caseCount = {total: 0, edenor: 0, edesur: 0};
        var limit = {};
        if (range) {
                limit = { $and: [
                        {date: { $gt: formatDate(range[0])}},
                        {date: { $lt: formatDate(range[1])}}
                ]};
        };

        function insertCorp (document) {
                var modified = false;
                if (!min || min > document.date) {
                        min = document.date;
                        modified = true;
                }
                if (!max || max < document.date) {
                        max = document.date;
                        modified = true;
                }
                var corp = document.corp.toLowerCase();
                userCount.total += Number(document.amplitude);
                userCount[corp] += Number(document.amplitude);

                caseCount.total++;
                caseCount[corp]++;

                throttledTotal(userCount, caseCount);

                if (modified) {
                        throttledScale(min, max);
                }
        }

        function migrate_cut_cortes (document) {
                if (document.corp != 'cut')
                        return false;

                var doc = Markers.findOne(document._id);
                doc.corp = 'cortes';
                Markers.update (doc._id, doc);
        };

        function insertCut (document, marker) {
                marker.on('dblclick', function(event) {
                        Markers.remove(event.target.id);
                });
                marker.bindPopup(popupContent(document));

                var popup = marker.getPopup();
                popup.on('open', function (e) {
                        delete lastValue[marker.id];
                        $('textarea').focus();
                });
                popup.on('close', function (e) {
                        if (! lastValue[marker.id])
                                return;
                        var doc = Markers.findOne(marker.id) || document;

                        doc.text = lastValue[marker.id];
                        if (! doc.state)
                                doc.state = 'active';

                        Markers.update(marker.id, doc);
                });
                if (! document.text) {
                        marker.openPopup();
                }
        }

        function makeIcon(document) {
                var className;
                var amplitude = 2 + document.amplitude/10;

                if (document.state)
                        className = document.corp + '-' + document.state;
                else
                        className = document.corp.toLowerCase();

                return L.divIcon({className: 'map-icon-' + className,
                                  iconSize: [amplitude, amplitude]});
        }

        MarkersHistory.find(limit);
        var query = Markers.find(limit);
        query.observe({
                added: function(document) {
                        if (migrate_cut_cortes(document))
                                return;

                        var icon = makeIcon(document);
                        var marker = L.marker(document.latlng ,
                                              {icon: icon,
                                               title: document.amplitude + ' usuarios',
                                               opacity: 0.8
                                              }).addTo(markersGroup[document.corp]);
                        marker.id = document._id;
                        if (document.corp === 'cortes') {
                                insertCut(document, marker);
                        } else if (document.corp === 'history') {
                                /* do nothing */
                        } else {
                                insertCorp(document);
                        }

                        if (! document.geocode) {
                                var doc = Markers.findOne(marker.id);
                                RG.Search (document.latlng, function (data) {
                                        var doc = Markers.findOne(marker.id);
                                        doc.geocode = data.display_name;
                                        Markers.update(doc._id, doc);
                                });
                        }
                },
                changed: function (document) {
                        markerById(markersGroup[document.corp], document._id, function (layer) {
                                if (document.corp === 'cortes')
                                        layer.getPopup().setContent(popupContent(document));

                                layer.setIcon (makeIcon(document));
                        });
                },
                removed: function(oldDocument) {
                        markerById(markersGroup[oldDocument.corp], oldDocument._id, function (layer) {
                                markersGroup[oldDocument.corp].removeLayer (layer);
                        });
                }
        });


        function markerToHeat(item) {
                var t = moment.unix(item.removed);
                var now = moment();
                var diff = t.diff (now, 'seconds');
                var value = 100*((toolong + diff)/toolong);

                if (toolong + diff <  0)
                        value = 0;

                return {
                        lat: item.latlng.lat,
                        lng: item.latlng.lng,
                        value: value
                };
        }

        function refreshHeat (query) {
                var data = {
                        max: 100,
                        data: _.map (query.fetch(), markerToHeat)
                };
                heatmapLayer.setData(data);
        }

        var throttledRefreshHeat = _.throttle(refreshHeat, 100, {leading: false});

        limit = { removed: { $gt: moment().unix() - toolong}};
        console.log (limit);
        query = MarkersHistory.find(limit);
        query.observe({
                added:   function (doc) { return throttledRefreshHeat(query)},
                changed: function (doc) { return throttledRefreshHeat(query)},
                removed: function (doc) { return throttledRefreshHeat(query)}
        });

        Meteor.setInterval(function () {
                return throttledRefreshHeat(query);
        }, toolong/10); /* refresh every 1/100th $toolong */
}

function markerById(group, id, fn) {
        group.getLayers().forEach(function (layer) {
                if (layer.id === id) {
                        fn (layer);
                }
        });
}

Template.map.events({
        'input textarea': function (e) {
                lastValue[e.target.id] = e.target.value;
        },
        'click .cut-type-select': function (e) {
                var id = e.target.parentElement.id;
                var state = e.target.id;

                var doc = Markers.findOne(id);
                doc.state = state;

                Markers.update(id, doc);
        },
        'click .close-marker': function (e) {
                var id = e.target.id || e.target.parentElement.id;
                Markers.remove(id);
        }

});

Template.map.rendered = function() {
  L.Icon.Default.imagePath = 'packages/leaflet/images';

  map = L.map('map', {
    doubleClickZoom: false
  }).setView([-34.6, -58.5], 10);

  L.tileLayer.provider('OpenMapSurfer.Roads').addTo(map);
        map.on('dblclick', function(event) {
                Markers.insert({corp: 'cortes', latlng: event.latlng});
        });

        new L.Control.GeoSearch({
                provider: new L.GeoSearch.Provider.OpenStreetMap({
                        viewbox: '-59.71,-33.68,-57.52,-35.5',
                        countrycodes: 'ar',
                        'accept-language': 'es'
                }),
                showMarker: false,
        }).addTo(map);

        _.each (markersGroup, function (layer) {
                layer.addTo(map);
        });

        map.addLayer(heatmapLayer);

        L.control.layers({}, _.extend ({historia: heatmapLayer}, markersGroup)).addTo(map);
        renderMap();
};
