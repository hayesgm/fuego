import db from "../services/database"

App.Pool = Ember.Object.extend({});

App.Pool.reopenClass({

  findAll: function() {
    return db.getPools().then((pools) => {
      return pools.map((pool) => {
        return App.Pool.create(pool);
      });
    });
  }

});

export default App.Pool;