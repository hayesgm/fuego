"use strict";

import Reflux from 'reflux';
import {storeBlob} from 'actions/actions';
import db from "models/database";

let BlobStore = Reflux.createStore({

  init: function() {
    this.listenTo(storeBlob, 'storeBlob');
  },

  getBlob: function(chunk) {
    return db.getBlob(chunk);
  },

  getAllChunkData: function(pool_id) {
    return db.getAllPoolData(pool_id);
  },

  storeBlob: function(blobParams) {
    return db.storeBlob(blobParams.chunk, blobParams.data).then((blob) => {
      this.trigger(blob);
      return blob;
    });
  }
});

export default BlobStore;