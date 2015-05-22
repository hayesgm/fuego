import Reflux from '../reflux'
import {createPool} from '../actions/actions'
import db from "../models/database"

let PoolStore = Reflux.createStore({

  init: function() {
    this.listenTo(createPool, 'onCreatePool');
  },

  findOrCreatePool: function(pool_id, poolParams) {
    return db.getPool(pool_id).then((pool) => {
      if (pool) {
        return pool;
      } else {
        return this.onCreatePool(poolParams);
      }
    });
  },

  getPools: function() {
    return db.getPools();
  },

  getPool: function(pool_id) {
    return db.getPool(pool_id);
  },

  onCreatePool: function(poolParams) {
    return db.createPool(poolParams.pool_id, poolParams.chunks, poolParams.description, poolParams.chunk_size, poolParams.total_size).then((pool) => {
      this.trigger(pool);
      return pool;
    });
  },

});

export default PoolStore;