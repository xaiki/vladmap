// create marker collection
Markers = new Meteor.Collection('markers');

Meteor.subscribe('markers');

Template.map.rendered = function() {
  L.Icon.Default.imagePath = 'packages/leaflet/images';

  var map = L.map('map', {
    doubleClickZoom: false
  }).setView([-34.6, -58.5], 11);

  L.tileLayer.provider('Thunderforest.Outdoors').addTo(map);

    map.on('dblclick', function(event) {
        console.log (event.latlng);
//    Markers.insert({latlng: event.latlng});
  });

  var query = Markers.find();
  query.observe({
      added: function(document) {
          console.log ('added', document);
      var marker = L.marker(document).addTo(map);
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
};
