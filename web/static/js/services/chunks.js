"use strict";

import {trace,debug} from "./logging"
import Peer from "./peer"
import {getOpenChannel} from "./chan"

import BlobStore from '../stores/blob_store'
import ChunkStore from '../stores/chunk_store'

let CHUNK_SIZE = Math.pow(2, 18); // 256KB chunks
let SIMULTANEOUS_DOWNLOADS = 5;

// Chunks we're waiting to download
let chunkQueue = [];

// Chunks we're downloading
let activeDownloads = [];

let downloadPromises = {};

let badPeers = [];

let downloadTimeout = 10000; // 10 seconds

let waiting = {};

function fetch(pool_id, chunk, remotePeerId) {
  trace("fetching chunk", pool_id, chunk, "from", remotePeerId);

  let promise = new Promise((resolve,reject) => {
    // We're going to store this until it's called back from conn
    downloadPromises[pool_id] = downloadPromises[pool_id] || {};
    downloadPromises[pool_id][chunk] = {
      resolve: resolve,
      reject: reject
    };
  });

  ChunkStore.getChunk(chunk).then(chunkObj => {
    if (chunkObj) {
      debug("already know of chunk", chunkObj.chunk)
      downloadPromises[pool_id][chunk].resolve(chunk);
    } else {
      if (activeDownloads.length < SIMULTANEOUS_DOWNLOADS) {
        download(pool_id, chunk, remotePeerId);
      } else {
        debug("queueing chunk", pool_id, chunk);
        chunkQueue.push([pool_id, chunk, remotePeerId]);
      }
    }
  });

  return promise;
}

function unactivate(pool_id, chunk) {
  activeDownloads = activeDownloads.filter(a => { return a[0] !== pool_id || a[1] !== chunk; });
}

function releaseDownload(pool_id, chunk) {
  // release this chunk
  unactivate(pool_id, chunk);

  debug("freed chunk..", pool_id, chunk, activeDownloads);

  // try to download a new chunk
  let nextChunkPeer = chunkQueue.shift();
  if (nextChunkPeer) {
    let [pool_id, nextChunk, remotePeerId] = nextChunkPeer;

    download(pool_id, nextChunk, remotePeerId);
  }
}

function download(pool_id, chunk, remotePeerId) {
  debug("downloading chunk", pool_id, chunk, "from", remotePeerId);

  // TODO: remotePeerId should be optional

  // This is now being downloaded
  activeDownloads.push([pool_id, chunk, remotePeerId]);

  let reconnect = (err) => {
    trace("error downloading", chunk, "from peer", remotePeerId, "going to try new remote peer", err);

    if (badPeers.indexOf(remotePeerId) === -1) {
      badPeers.push(remotePeerId);
      debug("bad peers", badPeers);
    }

    trace("finding new peer for", pool_id, chunk);
    
    getOpenChannel(pool_id)
      .push("find_a_peer_for_chunk", {pool_id: pool_id, chunk: chunk, but_please_not: badPeers})
      .receive("ok", (msg) => {
        if (msg.peer_id) {
          trace("trying again with peer", msg.peer_id);
          unactivate(pool_id, chunk);
          download(pool_id, chunk, msg.peer_id);
        } else {
          trace("failed to find peer for chunk", pool_id, chunk);
          releaseDownload(pool_id, chunk);
          downloadPromises[pool_id][chunk].reject(chunk);
        }
      })
      .receive("error", (reasons) => console.log("create failed", reasons) );
  };

  if (remotePeerId == null) {
    reconnect("no peer found"); // we didn't have a peer, let's try again
  } else {
    // We will re-use an existing connection, if given
    let remotePeer = Peer.getRemote(remotePeerId, reconnect);

    // timeout after a certain amount of time
    setTimeout(() => {
      if (waiting[pool_id + chunk]) {
        reconnect("timeout");
      }
    }, downloadTimeout);

    waiting[pool_id + chunk] = true;

    if (remotePeer) {
      debug("using existing connection", remotePeerId);

      // Just ask for the given chunk if we're already connected
      if (remotePeer.open) {
        remotePeer.send([pool_id,chunk]);
      } else {
        // We may still have to wait, though...
        remotePeer.on('open', () => {
          remotePeer.send([pool_id,chunk]);
        });
      }
    } else {
      debug("connecting to peer", remotePeerId);
      let conn = Peer.connectRemote(remotePeerId, reconnect);

      conn.on('close', () => {
        reconnect("closed");
      });

      conn.on('disconnected', () => {
        reconnect("disconnected");
      });

      conn.on('error', (err) => {
        reconnect(err);
      });

      conn.on('data', (message) => {
        let [pool_id, chunk, data] = message;

        debug("rec'd", pool_id, chunk, "from", remotePeerId);

        // track
        let wasWaitingOnChunk = delete [pool_id+chunk];

        if (!wasWaitingOnChunk) {
          debug("ignoring as we already timed out");
        } else {
          if (!data) {
            reconnect("chunk sent empty cell"); // failed to get this chunk from peer
          } else {
            let wordArray = CryptoJS.lib.WordArray.create(data);
            let sha = CryptoJS.SHA256(wordArray).toString();

            if (sha != chunk) {
              debug("sha", sha, "chunk", chunk);

              reconnect("chunk failed sha check");
            } else {
              // Store data in local object
              BlobStore.storeBlob({chunk: chunk, data: data}).then(blob => {
                debug("stored blob", blob.blob_id);

                ChunkStore.storeChunk({pool_id: pool_id, chunk: chunk, blob_id: blob.blob_id}).then(chunkObj => {

                  debug("stored chunk", chunkObj);

                  releaseDownload(pool_id, chunk);
                  downloadPromises[pool_id][chunk].resolve(chunk);
                });
              });
            }
          }
        }
      });
  
      // When we connect, let's ask for a chunk immediately
      conn.on('open', () => {
        conn.send([pool_id,chunk]);
      });

      // TODO: If we can't disconnect, inform server?
    }
  }
}

function getActiveDownloads() {
  return activeDownloads;
}

let Chunks = {
  fetch: fetch,
  getActiveDownloads: getActiveDownloads,
  CHUNK_SIZE: CHUNK_SIZE
};

export default Chunks;