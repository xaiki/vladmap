// marker collection
var Markers = new Meteor.Collection('markers');
Meteor.publish("markers", function () {
  return Markers.find();
});

Meteor.startup(function () {
    collectionApi = new CollectionAPI({
        authToken: '97f0ad9e24ca5e0408a269748d7fe0a0',
//        apiPath: 'api/v1'
    });
    collectionApi.addCollection(Markers, 'markers');
    collectionApi.start();
});

Meteor.methods({
        reset: function (col, data) {
                Markers.remove({});
                if (data)
                        data.forEach (function (d) {
                                Markers.insert (d);
                        });
        }
});
