// marker collection
var Markers = new Meteor.Collection('markers');
Meteor.publish("markers", function () {
  return Markers.find();
});

var Logs = new Meteor.Collection('enrelogs');
Meteor.publish("enrelogs", function () {
  return Logs.find();
});

var CutLogs = new Meteor.Collection('cutlogs');
Meteor.publish("cutlogs", function () {
  return CutLogs.find();
});


function makeLogable (type, string, object) {
        var ret = {
                date: moment().unix(),
                value: string,
                type: type
        };
        if (object && object._id)
                ret.id = object._id;

        return ret;
}

var log = function(string, object) {
        var e = makeLogable ('log', string, object);
        Logs.insert (e);
}

Meteor.startup(function () {
        collectionApi = new CollectionAPI({
                authToken: '97f0ad9e24ca5e0408a269748d7fe0a0',
                //        apiPath: 'api/v1'
        });
        collectionApi.addCollection(Markers, 'markers');
        collectionApi.addCollection(Logs,    'logs');
        collectionApi.start();

        Logs.before.remove (function (id, doc) {
                if (id === 'noshow')
                        return; /* HACK */
                CutLogs.insert (doc);
        });

        Markers.before.remove (function (id, doc) {
                log ('Corte removed: ' + doc.latlng.lat + ', ' + doc.latlng.lng + ', data: ' + doc.text);
        });

        Markers.after.insert (function (id, doc) {
                log ('Corte creado: ' + doc.latlng.lat + ', ' + doc.latlng.lng);
        });

        Markers.after.update (function (id, doc) {
                log ('Corte update: ' + doc.latlng.lat + ', ' + doc.latlng.lng + ', data: ' + doc.text + ', state: ' + doc.state);
        });
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
