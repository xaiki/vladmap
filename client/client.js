// create marker collection
var Markers = new Meteor.Collection('markers');

var throttledScale = _.throttle(renderScale, 1000, {leading: false});
var throttledTotal = _.throttle(renderTotal, 1000, {leading: false});
var map;
var markersGroup = L.layerGroup();

var min, max;
var totalCount = 0;


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

function renderTotal (total) {
        $('.totalCount').html(totalCount);
}

function renderMap(range) {
        $('.humanRange').html(scaleRange());
        markersGroup.clearLayers();
        totalCount = 0;
        var limit = {};
        if (range) {
                limit = { $and: [
                        {date: { $gt: formatDate(range[0])}},
                        {date: { $lt: formatDate(range[1])}}
                ]};
        };

        var query = Markers.find(limit);
        query.observe({
                added: function(document) {
                        var modified = false;
                        if (!min || min > document.date) {
                                min = document.date;
                                modified = true;
                        }
                        if (!max || max < document.date) {
                                max = document.date;
                                modified = true;
                        }

                        totalCount += Number(document.amplitude);
                        throttledTotal(totalCount);

                        var amplitude = 2 + document.amplitude/20;
                        var icon = L.divIcon({className: 'map-icon-' + document.corp.toLowerCase(), iconSize: [amplitude, amplitude]});
                        var marker = L.marker(document.latlng ,
                                              {icon: icon,
                                               title: document.amplitude + ' usuarios',
                                               opacity: 0.8
                                              }).addTo(markersGroup);
                        if (modified) {
                                throttledScale(min, max);
                        }
                },
                removed: function(oldDocument) {
                        layers = map._layers;
                        var key, val;
                        for (key in layers) {
                                val = layers[key];
                                if (val) {
                                        if (val.lat === oldDocument.lat && val.lng === oldDocument.lng) {
                                                map.removeLayer(val);
                                        }
                                }
                        }
                }
        });
}

Template.map.rendered = function() {
  L.Icon.Default.imagePath = 'packages/leaflet/images';

  map = L.map('map', {
    doubleClickZoom: false
  }).setView([-34.6, -58.5], 10);

  L.tileLayer.provider('OpenMapSurfer.Roads').addTo(map);

        markersGroup.addTo(map);
        renderMap();
};
