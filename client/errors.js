var Errors = new Meteor.Collection (null);
var Logs   = new Meteor.Collection ('enrelogs');

Meteor.subscribe('enrelogs');

function getCollections() {
        return Errors.find().fetch().concat(Logs.find().fetch());
}

setInterval(function() {
        var id = Logs.insert({_id: 'noshow'});
        Logs.remove(id);
}, 1000);

Template.errors.helpers({
        errors: function() {
                return Logs.find().fetch();
        },
});

Template.errors.events({
        'click li': function (e) {
                var id = e.target.parentElement.id;
                var type = e.target.parentElement.className;

                if (type === 'log')
                        Logs.remove(id);
                else
                        Errors.remove(id);
        }
});

Template.error.helpers({
        prettyDate: function (date) {
                return moment.unix(date).fromNow();
        }
});

Template.adminicons.helpers({
        newmessages: function() {
                return getCollections().length || null;
        },
        nomessages: function() {
                return getCollections().length?null:'no';
        },
        newerrors: function() {
                return Errors.find({type: 'error'}).fetch().length || null;
        },
        newwarnings: function() {
                return Errors.find({type: 'warning'}).fetch().length || null;
        }
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

window.log = function(string, object) {
        var e = makeLogable ('log', string, object);
        Logs.insert (e);
}

window.error = function(string, object) {
        var e = makeLogable ('error', string, object);
        Errors.insert (e);
}

window.warn = function(string, object) {
        var e = makeLogable ('warn', string, object);
        Errors.insert (e);
}
