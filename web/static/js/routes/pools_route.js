App.PoolsRoute = Ember.Route.extend({
  setupController: function(controller, pool) {
    controller.set('model', pool);
  },
  renderTemplate: function() {
    this.render('navigation', {outlet: 'navigation'});
  },
  model: function(params) {
    return {
      pools: [
        { pool_id: 'abc', description: 'Game of Thrones, Season 3 Ep 14.mp4' },
        { pool_id: 'def', description: 'Simpsons, S24 E3 Krusty\'s Revenge' }
      ]
    };
  },
});