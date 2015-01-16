// marker collection
var Markers = new Meteor.Collection('markers');
Meteor.publish("markers", function () {
  return Markers.find();
});

var MarkersHistory = new Meteor.Collection('markershistory');
Meteor.publish("markershistory", function () {
        return MarkersHistory.find();
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
        return e;
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
                if (doc.corp != 'cortes') /* HACK */
                        return;

                var l = log ('Corte removed: ' + doc.latlng.lat + ', ' + doc.latlng.lng + ', data: ' + doc.text);
                if (doc.state === 'active')  { /* only insert active cuts to history */
                        doc.corp = 'history';
                        doc.state = 'closed';
                        doc.removed = l.date;
                        doc.time = doc.removed - doc.created;
                        MarkersHistory.insert (doc);
                }
        });

        Markers.before.insert (function (id, doc) {
                if (doc.corp != 'cortes') /* HACK */
                        return;

                var l = log ('Corte creado: ' + doc.latlng.lat + ', ' + doc.latlng.lng);
                doc.created = l.date;
        });

        Markers.after.update (function (id, doc) {
                if (doc.corp != 'cortes') /* HACK */
                        return;

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
