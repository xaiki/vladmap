var Errors = new Meteor.Collection(null);

Template.errors.helpers({
        errors: function() {
                return Errors.find();
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

window.error = function(string) {
        Errors.insert ({type: 'error',
                        value: string});
}

window.warn = function(string) {
        Errors.insert ({type: 'warning',
                        value: string});
}
