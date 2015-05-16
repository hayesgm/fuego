"use strict";

import {trace,debug} from "./logging"
import db from "./database"
import Peer from "./peer"
import {getOpenChannel} from "./chan"

let CHUNK_SIZE = Math.pow(2, 18); // 256KB chunks
let SIMULTANEOUS_DOWNLOADS = 5;

// Chunks we're waiting to download
let chunkQueue = [];

// Chunks we're downloading
let activeDownloads = [];
let downloadPromises = {};

let badPeers = [];

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

  db.getChunk(chunk).then(chunkObj => {
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

function releaseDownload(pool_id, chunk) {
  // release this chunk
  activeDownloads = activeDownloads.filter(a => { return a[0] == pool_id && a[1] == chunk; });

  debug("freed chunk..", pool_id, chunk, activeDownloads);

  // try to download a new chunk
  let nextChunkPeer = chunkQueue.shift();
  if (nextChunkPeer) {
    let [pool_id, nextChunk, remotePeerId] = nextChunkPeer;

    download(pool_id, nextChunk, remotePeerId);
  }
}

function download(pool_id, chunk, remotePeerId) {
  debug("downloading chunk", pool_id, chunk);

  // TODO: remotePeerId should be optional

  // This is now being downloaded
  activeDownloads.push([chunk, remotePeerId]);

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
          download(pool_id, chunk, msg.peer_id);
        } else {
          trace("failed to find peer for chunk", pool_id, chunk);
          releaseDownload(pool_id, chunk);
          downloadPromises[pool_id][chunk].reject(chunk);
        }
      })
      .receive("error", (reasons) => console.log("create failed", reasons) );
  };

  // We will re-use an existing connection, if given
  let remotePeer = Peer.getRemote(remotePeerId, reconnect);

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
      trace('webrtc closed');
    });

    conn.on('disconnected', () => {
      trace('webrtc disconnected');
    });

    conn.on('error', (err) => {
      // TODO
      // We're going to need to find other peers when we have a WebRTC error
      // There's going to obviously be a ton of heuristics around "good peers"
      // "blacklisted peers", etc. The server may want information on good/bad
      // peers so it can take out dead nodes from the system. (when error rate > THRESHOLD)
      trace('webrtc error', err);
      releaseDownload(pool_id, chunk);
      downloadPromises[pool_id][chunk].reject();
    });

    conn.on('data', (message) => {
      let [pool_id, chunk, data] = message;

      debug("rec'd", pool_id, chunk, "from", remotePeerId);

      // TODO Verify SHA-256 sum of chunk

      // Store data in local object
      db.storeBlob(chunk, data).then(blob => {
        debug("stored blob", blob[0].blob_id);

        db.storeChunk(pool_id, chunk, blob[0].blob_id).then(chunkObj => {

          debug("stored chunk", chunkObj);

          releaseDownload(pool_id, chunk);
          downloadPromises[pool_id][chunk].resolve(chunk);
        });
      });
    });

    // When we connect, let's ask for a chunk immediately
    conn.on('open', () => {
      conn.send([pool_id,chunk]);
    });

    // TODO: If we can't disconnect, inform server?
  }
}

let Chunks = {
  fetch: fetch,
  CHUNK_SIZE: CHUNK_SIZE
};

export default Chunks;