var server;

db.open( {
  server: 'burn-pm-6',
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
} ).then(function(s) {
  server = s
});

function server() {
  return server;
}

function createPool(pool_id, chunks, description) {
  return server.pools.add({
    pool_id: pool_id,
    chunks: chunks,
    description: description
  });
}

function getBlob(chunk) {
  return server.blobs.query().filter('chunk', chunk).execute();
}

function getChunks(pool_id) {
  return server.chunks.query().filter('pool_id', pool_id).execute();
}

function getPoolInfo(pool_id) {
  return server.pools.query().filter('pool_id', pool_id).execute();
}

function getAllChunkData(pool_id) {
  return server.chunks.query().filter('pool_id', pool_id).execute().then(chunks => {
    console.log(["chunks",chunks]);
    var promises = chunks.map(chunk => {return getChunkData(chunk.chunk);});
    console.log(["promises",promises]);
    return Promise.all(promises);
  });
}

function getChunkData(chunk) {
  return server.blobs.query().filter('chunk', chunk).execute();
}

function storeBlob(chunk, data) {
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
}

function storeChunk(pool_id, chunk, blob_id) {
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
}

let Database = {
  server: server,
  createPool: createPool,
  getChunks: getChunks,
  getBlob: getBlob,
  getPoolInfo: getPoolInfo,
  getAllChunkData: getAllChunkData,
  getChunkData: getChunkData,
  storeBlob: storeBlob,
  storeChunk: storeChunk,
};

export default Database;