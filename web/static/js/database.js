"use strict";

let serverPromise = db.open({
  server: 'burn-pm-7',
  version: 6,
  schema: {
    pools: { // {pool_id, description, chunks }
      key: { keyPath: 'pool_id' },
      indexes: {
        pool_id: { unique: true }
      }
    },
    chunks: { // {chunk, pool_id, blob_id }
      key: { keyPath: 'chunk' },
      indexes: {
        chunk: {},
        pool_id: {}
      }
    },
    blobs: { // {blob_id, chunk, data}
      key: { keyPath: 'blob_id', autoIncrement: true },
      indexes: {
        blob_id: {},
        chunk: { unique: true }
      }
    }
  }
})

function getServer() {
  return serverPromise;
}

function getPools() {
  return serverPromise.then((server) => {
    return server.pools.query().all().execute();
  });
};

function findOrCreatePool(pool_id, chunks, description) {
  return serverPromise.then((server) => {
    return getPool(pool_id).then( (pool) => {
      if (pool) {
        return pool;
      } else {
        return createPool(pool_id, chunks, description);
      }
    });
  });
};

function createPool(pool_id, chunks, description) {
  return serverPromise.then((server) => {
    return server.pools.add({
      pool_id: pool_id,
      chunks: chunks,
      description: description
    }).then((pool) => {
      return pool[0];
    });
  });
}

function getBlob(chunk) {
  return serverPromise.then((server) => {
    return server.blobs.query().filter('chunk', chunk).execute();
  });
}

function getChunk(chunk) {
  return serverPromise.then((server) => {
    return server.chunks.query().filter('chunk', chunk).execute().then((chunk) => {
      return chunk[0];
    })
  });
}

function getChunks(pool_id) {
  return serverPromise.then((server) => {
    return server.chunks.query().filter('pool_id', pool_id).execute();
  });
}

function getPool(pool_id) {
  return serverPromise.then((server) => {
    return server.pools.query().filter('pool_id', pool_id).execute().then((pool) => {
      return pool[0];
    });
  });
}

function getAllChunkData(pool_id) {
  return serverPromise.then((server) => {
    return server.chunks.query().filter('pool_id', pool_id).execute().then(chunks => {
      var promises = chunks.map(chunk => {return getChunkData(chunk.chunk);});
      return Promise.all(promises);
    });
  });
}

function getChunkData(chunk) {
  return serverPromise.then((server) => {
    return server.blobs.query().filter('chunk', chunk).execute().then((blob) => {
      return blob[0];
    });
  });
}

function storeBlob(chunk, data) {
  return serverPromise.then((server) => {
    return server.blobs.query().filter('chunk',chunk).execute().then(blobs => {
      if (blobs.length > 0) {
        return blobs;
      } else {
        return server.blobs.add({
          chunk: chunk,
          data: data
        });
      }
    });
  });
}

function storeChunk(pool_id, chunk, blob_id) {
  return serverPromise.then((server) => {
    return server.chunks.query().filter('chunk',chunk).filter('pool_id', pool_id).execute().then(chunks => {
      if (chunks.length > 0) {
        return chunks;
      } else {
        return server.chunks.add({
          chunk: chunk,
          pool_id: pool_id,
          blob_id: blob_id
        });
      }
    });
  });
}

let Database = {
  getServer: getServer,
  getPools: getPools,
  findOrCreatePool: findOrCreatePool,
  createPool: createPool,
  getChunks: getChunks,
  getBlob: getBlob,
  getChunk: getChunk,
  getPool: getPool,
  getAllChunkData: getAllChunkData,
  getChunkData: getChunkData,
  storeBlob: storeBlob,
  storeChunk: storeChunk,
};

export default Database;