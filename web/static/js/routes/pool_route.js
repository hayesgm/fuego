
App.PoolRoute = Ember.Route.extend({
  setupController: function(controller, pool) {
    controller.set('model', pool);
  },
  renderTemplate: function() {
    this.render('navigation', {outlet: 'navigation'});
  },
  model: function(params) {
    return { pool_id: params.pool_id, geoff: 'hayes' };
  },
  serialize: function(model) {
    return { pool_id: "dog" };
  }
});