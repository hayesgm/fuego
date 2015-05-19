App.NavigationController = Ember.ArrayController.extend({
  promise: App.Pool.findAll()
});
