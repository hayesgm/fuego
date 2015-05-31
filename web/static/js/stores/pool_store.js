"use strict";

import Reflux from 'reflux';
import {createPool, removePool} from 'actions/actions';
import db from "models/database";
import Chunks from 'services/chunks';

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

  destroyPool: function(pool_id) {
    Chunks.stopPool(pool_id); // first, let's make sure we're no longer downloading from it

    return db.destroyPool(pool_id).then(() => {
      removePool.trigger(pool_id);
    });
  },

  onCreatePool: function(poolParams) {
    return db.createPool(poolParams.pool_id, poolParams.chunks, poolParams.description, poolParams.chunk_size, poolParams.total_size).then((pool) => {
      this.trigger(pool);
      return pool;
    });
  },

});

export default PoolStore;