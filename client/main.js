$(function() {
        window.Markers = new Meteor.Collection('markers');
  $(window).resize(function() {
    $('#map').css('height', window.innerHeight - 82 - 45);
  });
  $(window).resize(); // trigger resize event
});
