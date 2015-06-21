"use strict";

import Reflux from 'includes/reflux';
import {storeChunk} from 'actions/actions';
import db from "models/database";

let ChunkStore = Reflux.createStore({

  init: function() {
    this.listenTo(storeChunk, 'storeChunk');
  },

  getChunk: function(chunk) {
    return db.getChunk(chunk);
  },

  getChunks: function(pool_id) {
    return db.getChunks(pool_id);
  },

  getAllChunks: function() {
    return db.getAllChunks();
  },

  getAllChunkData: function(pool_id) {
    return db.getAllChunkData(pool_id);
  },

  storeChunk: function(chunkParams) {
    return db.storeChunk(chunkParams.pool_id, chunkParams.chunk, chunkParams.blob_id).then((chunk) => {
      this.trigger(chunk);
      return chunk;
    });
  }

});

export default ChunkStore;