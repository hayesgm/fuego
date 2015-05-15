"use strict";

import {trace,debug} from "./logging"
import db from "./database"
import Peer from "./peer"

let CHUNK_SIZE = Math.pow(2, 18); // 256KB chunks
let SIMULTANEOUS_DOWNLOADS = 5;

// Chunks we're waiting to download
let chunkQueue = [];

// Chunks we're downloading
let activeDownloads = [];
let downloadPromises = {};

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

  // We will re-use an existing connection, if given
  if (Peer.getRemote(remotePeerId)) {
    debug("using existing connection", remotePeerId);

    let remotePeer = Peer.getRemote(remotePeerId);

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
    let conn = Peer.connectRemote(remotePeerId);

    conn.on('error', (err) => {
      // TODO
      trace('webrtc error', err);
      releaseDownload(pool_id, chunk);
      downloadPromises[pool_id][chunk].reject();
    });

    conn.on('data', (message) => {
      let [pool_id, chunk, data] = message;

      debug("rec'd", pool_id, chunk);

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