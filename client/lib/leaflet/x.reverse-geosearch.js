/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.OpenStreetMap uses openstreetmap geocoding service
 * https://github.com/smeijer/leaflet.control.geosearch
 */

L.ReverseGeoSearch = L.Class.extend({
    options: {

    },

    initialize: function(options) {
        options = L.Util.setOptions(this, options);
    },

    GetServiceUrl: function (point) {
        var parameters = L.Util.extend({
            lat: point.lat,
            lon: point.lng,
            format: 'json'
        }, this.options);

        return 'http://nominatim.openstreetmap.org/reverse'
            + L.Util.getParamString(parameters);
    },

    Search: function (point, cb) {
        $.get(this.GetServiceUrl(point))
            .done(cb);
    },
});
