App.PoolsRoute = Ember.Route.extend({
  setupController: function(controller, pool) {
    controller.set('model', pool);
  },
  renderTemplate: function() {
    console.log(require('../templates/navigation')());
    this.render(require('../templates/navigation'), {outlet: 'navigation'});
  }
});