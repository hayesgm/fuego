"use strict";

import {assert} from 'services/helpers';

let serverPromise = null;

function init() {
  serverPromise = db.open({
    server: 'burn-pm-7',
    version: 6,
    schema: {
      pools: { // {pool_id, chunks, description, chunk_size, total_size}
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
  });
}

function getServer() {
  return serverPromise;
}

function getPools() {
  return serverPromise.then((server) => {
    return server.pools.query().all().execute();
  });
};

function findOrCreatePool(pool_id, chunks, description, chunk_size, total_size) {
  return serverPromise.then((server) => {
    return getPool(pool_id).then( (pool) => {
      if (pool) {
        return pool;
      } else {
        return createPool(pool_id, chunks, description, chunk_size, total_size);
      }
    });
  });
};

function createPool(pool_id, chunks, description, chunk_size, total_size) {
  return serverPromise.then((server) => {
    assert(!!pool_id, "pool store requires pool_id");
    assert(!!chunks, "pool store requires chunks");
    assert(!!chunk_size, "pool store requires chunk_size");
    assert(!!total_size, "pool store requires total_size");

    return server.pools.add({
      pool_id: pool_id,
      chunks: chunks,
      description: description,
      chunk_size: chunk_size,
      total_size: total_size
    }).then((pool) => {
      return pool[0];
    });
  });
}

function destroyPool(pool_id) {
  return serverPromise.then((server) => {
    
    return getChunks(pool_id).then((chunks) => {
      let chunkRemovePromises = chunks.map((chunk) => {

        // remove the blobs
        let blobRemovePromise = getBlob(chunk.chunk).then((blob) => {
          if (blob) {
            console.log("removing blob", blob.blob_id);
            return server.blobs.remove(blob.blob_id);
          } else {
            return true;
          }
        });

        // then the chunk itself
        console.log("removing chunk", chunk.chunk);
        let chunkRemovePromise = server.chunks.remove(chunk.chunk);

        return Promise.all([blobRemovePromise, chunkRemovePromise]);
      });

      return Promise.all(chunkRemovePromises).then(() => {

        // after we've removed the chunks, let's actually delete the pool itself
        console.log("removing pool", pool_id);
        return server.pools.remove(pool_id);
      });
    });
  });
}

function getBlob(chunk) {
  return serverPromise.then((server) => {
    return server.blobs.query('chunk').only(chunk).execute().then((blob) => {
      return blob[0];
    });
  });
}

function getChunk(chunk) {
  return serverPromise.then((server) => {
    return server.chunks.get(chunk).then((chunk) => {
      return chunk;
    })
  });
}

function getChunks(pool_id) {
  return serverPromise.then((server) => {
    return server.chunks.query('pool_id').only(pool_id).execute();
  });
}

function getAllChunks() {
  return serverPromise.then((server) => {
    return server.chunks.query().all().execute();
  });
}

function getPool(pool_id) {
  return serverPromise.then((server) => {
    return server.pools.get(pool_id).then((pool) => {
      return pool;
    });
  });
}

function getAllChunkData(pool_id) {
  return serverPromise.then((server) => {
    return getChunks(pool_id).then(chunks => {

      var promises = chunks.map(chunk => {return getBlob(chunk.chunk);});
      return Promise.all(promises).then((promises) => {
        return promises;
      });
    });
  });
}

function storeBlob(chunk, data) {
  return serverPromise.then((server) => {
    assert(!!chunk, "blob store requires chunk");
    assert(!!data, "blob store requires data");

    return server.blobs.query('chunk').only(chunk).execute().then(blobs => {
      if (blobs.length > 0) {
        return blobs[0];
      } else {
        return server.blobs.add({
          chunk: chunk,
          data: data
        }).then((blob) => {
          return blob[0];
        });
      }
    });
  });
}

function storeChunk(pool_id, chunk, blob_id) {
  return serverPromise.then((server) => {
    assert(!!pool_id, "chunk store requires pool_id");
    assert(!!chunk, "chunk store requires chunk");
    assert(!!blob_id, "chunk store requires blob_id");

    return server.chunks.query('chunk').only(chunk).filter('pool_id', pool_id).execute().then(chunks => {
      if (chunks.length > 0) {
        return chunks[0];
      } else {
        return server.chunks.add({
          chunk: chunk,
          pool_id: pool_id,
          blob_id: blob_id
        }).then((chunk) => {
          return chunk[0];
        });
      }
    });
  });
}

let Database = {
  init: init,
  getServer: getServer,
  getPools: getPools,
  findOrCreatePool: findOrCreatePool,
  createPool: createPool,
  destroyPool: destroyPool,
  getChunks: getChunks,
  getAllChunks: getAllChunks,
  getBlob: getBlob,
  getChunk: getChunk,
  getPool: getPool,
  getAllChunkData: getAllChunkData,
  storeBlob: storeBlob,
  storeChunk: storeChunk,
};

export default Database;