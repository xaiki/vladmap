// create marker collection
//var Markers = new Meteor.Collection('markers');

var throttledScale = _.throttle(renderScale, 1000, {leading: false});
var throttledTotal = _.throttle(renderTotal, 1000, {leading: false});
var map;
var markersGroup = L.layerGroup();

var min, max;
var userCount = {total: 0, edenor: 0, edesur: 0};
var caseCount = {total: 0, edenor: 0, edesur: 0};
var lastValue = {};

moment.locale('es');
Meteor.subscribe('markers');

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
        return '<textarea rows="4" cols="40" id="' + document._id + '">'+ document.text +'</textarea>';
}

function renderMap(range) {
        $('.humanRange').html(scaleRange());
        markersGroup.clearLayers();
        userCount = {total: 0, edenor: 0, edesur: 0};
        caseCount = {total: 0, edenor: 0, edesur: 0};
        var limit = {};
        if (range) {
                limit = { $and: [
                        {date: { $gt: formatDate(range[0])}},
                        {date: { $lt: formatDate(range[1])}}
                ]};
        };

        var query = Markers.find(limit);

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
        query.observe({
                added: function(document) {
                        var amplitude = 2 + document.amplitude/10;
                        var icon = L.divIcon({className: 'map-icon-' + document.corp.toLowerCase(), iconSize: [amplitude, amplitude]});
                        var marker = L.marker(document.latlng ,
                                              {icon: icon,
                                               title: document.amplitude + ' usuarios',
                                               opacity: 0.8
                                              }).addTo(markersGroup);
                        marker.id = document._id;
                        if (document.date) {
                                insertCorp();
                        } else {
                                marker.on('dblclick', function(event) {
                                        Markers.remove(event.target.id);
                                });
                                marker.bindPopup(popupContent(document));
                                var popup = marker.getPopup();
                                popup.on('close', function (e) {
                                        var doc = Markers.findOne(marker.id);
                                        doc.text = lastValue[marker.id];
                                        Markers.update(marker.id, doc);
                                        console.log ('updating', doc);
                                });
                        }
                },
                changed: function (document) {
                        markerById(markersGroup, document._id, function (layer) {
                                layer.getPopup().setContent(popupContent(document));
                        });
                },
                removed: function(oldDocument) {
                        markerById(markersGroup, oldDocument._id, function (layer) {
                                markersGroup.removeLayer (layer);
                        });
                }
        });
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
        }
});


Template.map.rendered = function() {
  L.Icon.Default.imagePath = 'packages/leaflet/images';

  map = L.map('map', {
    doubleClickZoom: false
  }).setView([-34.6, -58.5], 10);

  L.tileLayer.provider('OpenMapSurfer.Roads').addTo(map);
        map.on('dblclick', function(event) {
                console.log (event.latlng);
                Markers.insert({corp: 'cut', text: 'notas', latlng: event.latlng});
        });

        markersGroup.addTo(map);
        renderMap();
};
