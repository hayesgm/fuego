"use strict";

import Chan from "services/chan";
import Chunks from "services/chunks";
import db from "models/database";
import {trace,debug} from "services/logging";
import Peer from "services/peer";

import PoolStore from 'stores/pool_store';
import ChunkStore from 'stores/chunk_store';
import BlobStore from 'stores/blob_store';

const RETRY_INTERVAL = 20000;

function refresh(socket, peer_id) {
  
  // let's look at each pool we know of and either resume or seed
  return PoolStore.getPools().then((pools) => {
    return Promise.all(pools.map((pool) => {
      // show as a potential downlaod
      return isComplete(pool).then((complete) => {

        debug("got pool", pool.description, complete ? "complete" : "incomplete");

        if (complete) {
          // If we have, then let's seed it ourselves
          return register(socket, peer_id, pool);
        } else {
          // If we haven't finished, try to complete download
          return fetch(socket, peer_id, pool.pool_id);
        }

      });
    }));
  });
}

// fetch pool will get information about the pool from the server via a chan
// it will return that chan and a database entry for this pool via a promise
function fetch(socket, peer_id, pool_id) {
  trace("fetching pool", pool_id);
  return Chan.find(socket, peer_id, pool_id).then( ([chan, response]) => {
    return PoolStore.findOrCreatePool(pool_id, {pool_id: pool_id, chunks: response.chunks, description: response.description, chunk_size: response.chunk_size, total_size: response.total_size}).then( (pool) => {
      // The server should have given us peers automatically, but these may be stale
      debug("response", response);
      var promises = response.peers.map(chunkPeer => {
        debug("chunk peer", chunkPeer);

        let [chunk,remotePeerId] = chunkPeer;

        let fetchChunk = function() {
          return Chunks.fetch(pool_id, chunk, remotePeerId).then((chunk) => {
            Peer.seed(chan, pool_id, chunk);
            return chunk;
          });
        };

        return new Promise((resolve, reject) => {
          let f = function() {
            fetchChunk().then((chunk) => {
              return resolve(chunk);
            }).catch(() => {
              PoolStore.getPool(pool_id).then((p) => {
                if (p) {
                  debug("failed to fetch chunk, retrying in " + RETRY_INTERVAL / 1000.0 + " seconds...");
                  setTimeout(f, RETRY_INTERVAL);
                } else {
                  debug("failed to fetch chunk, but pool has been destroyed");
                }
              });
            });
          };

          f();
        });
      });

      return Promise.all(promises).then(() => {
        return pool;
      });
    });
  });
}

function destroy(socket, peer_id, pool) {
  trace("destroying pool", pool.pool_id);

  let promise = new Promise((resolve, reject) => {
    Chan.find(socket, peer_id, pool.pool_id).then( (chan, _response) => {
      // Let's seed each of the chunks
      pool.chunks.forEach((chunk) => {
        debug("releasing chunk", chunk)
        Peer.release(chan, pool.pool_id, chunk);
      });
 
      resolve(); // existed, removed ourselves
    }).catch(() => {
      resolve(false); // doesn't exist
    });
  });

  return promise.then((_removed) => {
    return PoolStore.destroyPool(pool.pool_id);
  })
}

// register pool is when we have a complete pool, either from localdb or a file
function register(socket, peer_id, pool) {
  trace("registering pool for pool", pool.pool_id, pool.description, pool.chunk_size, pool.total_size);
  debug("chunks", pool.chunks);

  return new Promise((resolve, reject) => {
    Chan.create(socket, peer_id, pool.pool_id, pool.chunks, pool.description, pool.chunk_size, pool.total_size).then( (chan, _response) => {

      // Let's seed each of the chunks
      pool.chunks.forEach((chunk) => {
        Peer.seed(chan, pool.pool_id, chunk);
      });
 
      resolve(pool);
    });
  });
}

function createFromFile(file) {
  let chunkHashes = [];
  let chunkMap = {};

  return new Promise((resolve, reject) => {
    var sliceFile = function(offset) {
      var reader = new window.FileReader();

      reader.onload = (function() {
        return function(e) {
          var wordArray = CryptoJS.lib.WordArray.create(e.target.result);

          // debug("computing hash for", wordArray);
          let sha = CryptoJS.SHA256(wordArray).toString();

          // trace("sha", wordArray);

          chunkHashes.push(sha);

          BlobStore.storeBlob({chunk: sha, data: e.target.result}).then(blob => {
            // debug("blob", blob);
            chunkMap[sha] = blob.blob_id;

            if (file.size > offset + e.target.result.byteLength) {
              // repeat
              window.setTimeout(sliceFile, 0, offset + Chunks.CHUNK_SIZE);
            } else {
              // We're done walking through the slices
              let pool_id = CryptoJS.SHA256(chunkHashes.join("")).toString();

              // TODO: catch
              PoolStore.findOrCreatePool(pool_id, {pool_id: pool_id, chunks: chunkHashes, description: file.name, chunk_size: Chunks.CHUNK_SIZE, total_size: file.size}).then((pool) => {
                trace("chunk hashes", chunkHashes);

                // Let's store the chunks locally
                let promises = chunkHashes.map(chunk => {
                  trace("storing chunk", pool_id, chunk, chunkMap[chunk]);
                  ChunkStore.storeChunk({pool_id: pool_id, chunk: chunk, blob_id: chunkMap[chunk]});
                });

                // TODO: catch
                Promise.all(promises).then(() => {
                  // resolve for the big man
                  resolve(pool);
                });
              });
            }
          });
        };
      })(file);
      
      var slice = file.slice(offset, offset + Chunks.CHUNK_SIZE);

      reader.readAsArrayBuffer(slice);
    };

    sliceFile(0);
  });
}

function isComplete(pool) {
  return ChunkStore.getChunks(pool.pool_id).then((chunks) => {
    return chunks.length == pool.chunks.length;
  });
}

function getPoolBuffers(pool) {
  return ChunkStore.getAllChunkData(pool.pool_id).then(chunkData => {
    debug("got pool", pool, chunkData);

    // Need to arrange this back into the correct order
    return pool.chunks.map(chunk => {
      let match = chunkData.filter(chunkDatum => {
        return chunkDatum.chunk == chunk;
      })[0];

      return match.data;
    });
  });
}

let Pool = {
  refresh: refresh,
  fetch: fetch,
  register: register,
  destroy: destroy,
  createFromFile: createFromFile,
  getPoolBuffers: getPoolBuffers,
};

export default Pool;