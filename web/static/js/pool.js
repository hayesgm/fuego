"use strict";

import Chan from "./chan";
import Chunks from "./chunks";
import db from "./database";
import {trace,debug} from "./logging";
import Peer from "./peer";

function refresh(socket, peer_id) {
  // let's look at each pool we know of

  return db.getPools().then((pools) => {
    return Promise.all(pools.map((pool) => {
      // show as a potential downlaod
      return getPercentComplete(pool).then((percent) => {

        debug("got pool", pool.description, percent, "% complete")

        // If we haven't finished, try to complete download
        if (percent < 99.999) {
          return fetch(socket, peer_id, pool.pool_id).then(([pool,_buffers]) => {
            return pool;
          });
        } else {
          // If we have, then let's seed it ourselves
          return register(socket, peer_id, pool);
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
    return db.findOrCreatePool(pool_id, response.chunks, response.description, response.chunk_size, response.total_size).then( (pool) => {
      // The server should have given us peers automatically, but these may be stale
      var promises = response.peers.map(chunkPeer => {
        let [chunk,remotePeerId] = chunkPeer;

        return Chunks.fetch(pool_id, chunk, remotePeerId).then((chunk) => {
          Peer.seed(chan, pool_id, chunk);
          return chunk;
        });
      });

      return Promise.all(promises).then(() => {
        return getPoolBuffers(pool).then((buffers) => {
          return [pool,buffers];
        });
      });
    });
  });
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
          db.storeBlob(sha, e.target.result).then(blob => {
            // debug("blob", blob);
            chunkMap[sha] = blob[0].blob_id;

            if (file.size > offset + e.target.result.byteLength) {
              // repeat
              window.setTimeout(sliceFile, 0, offset + Chunks.CHUNK_SIZE);
            } else {
              // We're done walking through the slices
              let pool_id = CryptoJS.SHA256(chunkHashes.join("")).toString();

              // TODO: catch
              db.findOrCreatePool(pool_id, chunkHashes, file.name, Chunks.CHUNK_SIZE, file.size).then((pool) => {
                trace("chunk hashes", chunkHashes);

                // Let's store the chunks locally
                let promises = chunkHashes.map(chunk => {
                  trace("storing chunk", pool_id, chunk, chunkMap[chunk]);
                  db.storeChunk(pool_id, chunk, chunkMap[chunk]);
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

function getPercentComplete(pool) {
  let totalChunks = pool.chunks.length;

  return db.getChunks(pool.pool_id).then((chunks) => {
    return chunks.length / ( totalChunks / 100.0 );
  });
}

function getPoolBuffers(pool) {
  return db.getAllChunkData(pool.pool_id).then(chunkData => {
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
  createFromFile: createFromFile,
  getPercentComplete: getPercentComplete,
  getPoolBuffers: getPoolBuffers
};

export default Pool;