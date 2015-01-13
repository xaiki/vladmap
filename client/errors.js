var Errors = new Meteor.Collection(null);

Template.errors.helpers({
        errors: function() {
                return Errors.find();
        },
});

Template.error.helpers({
        prettyDate: function (date) {
                return moment.unix(date).fromNow();
        }
});

Template.adminicons.helpers({
        newmessages: function() {
                return Errors.find().fetch().length || null;
        },
        nomessages: function() {
                return Errors.find().fetch().length?null:'no';
        },
        newerrors: function() {
                return Errors.find({type: 'error'}).fetch().length || null;
        },
        newwarnings: function() {
                return Errors.find({type: 'warning'}).fetch().length || null;
        }
});


window.log = function(string) {
        Errors.insert ({
                date: moment().unix(),
                type: 'log',
                value: string
        });
}

window.error = function(string) {
        Errors.insert ({
                date: moment().unix(),
                type: 'error',
                value: string
        });
}

window.warn = function(string) {
        Errors.insert ({
                date: moment().unix(),
                type: 'warning',
                value: string
        });
}
