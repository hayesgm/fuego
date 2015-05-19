
App.PoolRoute = Ember.Route.extend({
  setupController: function(controller, pool) {
    controller.set('model', pool);
  },
  renderTemplate: function() {
    this.render('navigation', {outlet: 'navigation'});
    this.render('pool', {outlet: 'main'});
  },
  model: function(params) {
    return App.Pool.create({ pool_id: params.pool_id, description: 'hayes', chunks: [1,2,3] });
  },
  serialize: function(model) {
    return { pool_id: "dog" };
  }
});