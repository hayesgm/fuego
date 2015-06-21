"use strict";

import {env} from "env"
import {trace,debug} from "services/logging";
import Chan from "services/chan";
import Helpers from "services/helpers";
import ChunkStore from "stores/chunk_store";
import BlobStore from "stores/blob_store";
import Config from "services/config";

let peer_id = Helpers.guid();
let peers = {};
let errorHandlers = {};
let errors = {};
let peer = null;
let activeUploads = [];

const RECONNECTION_TIMEOUT = 10000;
  
function init() {
  if (env.debug) {
    var config = {
      key: Config.PEER_JS_API_KEY,
      debug: 3,
    };
  } else {
    var config = {
      host: Config.PEER_JS_SERVER,
      secure: location.protocol === 'https:',
      port: location.protocol === 'https:' ? 443 : 80,
    };
  }

  trace("initializing peer", peer_id, config);

  peer = Peer(peer_id, config);

  peer.on('connection', function(conn) {
    conn.on('close', function() {
      debug("removing peer", conn, conn.remotePeerId);
      delete peers[conn.remotePeerId];
      debug("now", peers);

      activeUploads = activeUploads.filter(d => { return d[1] == conn.remotePeerId; }); // remove ourselves
    });

    // "Seeder" being asked for a chunk
    conn.on('data', function(data){
      debug("peer data", data);

      var [pool_id, chunk] = data;

      activeUploads.push([pool_id, conn.remotePeerId, conn]); // add ourselves for stat tracking

      // TODO: when we don't have the chunk?

      trace("Sending peer chunk", pool_id, chunk);
      BlobStore.getBlob(chunk).then(blob => {
        if (blob) {
          conn.send([pool_id, chunk, blob.data]);
        } else {
          conn.send([pool_id, chunk, null]); // say we don't have it
        }
      });
    });
  });

  peer.on('close', () => {
    trace("peer closed");
  });

  peer.on('disconnected', () => {
    trace("peer lost connection, reconnecting in " + Math.round(RECONNECTION_TIMEOUT/1000.0) + " seconds...");

    setTimeout(() => {
      debug("reconnecting...");
      peer.reconnect();
    }, RECONNECTION_TIMEOUT);
  });

  peer.on('error', (err) => {
    let match = err.message.match(/peer\s([^\s]+)/i);

    // this is a hack right now to find connection errors
    if (err.type == "peer-unavailable" && match) {
      let remotePeerId = match[1];

      debug("peer unavailable", remotePeerId, err);

      errors[remotePeerId] = err;

      // Call the error function(s) for this peer
      errorHandlers[remotePeerId].forEach((errorHandler) => {
        errorHandler.call(err);
      });
    } else {
      trace("peer error", err);
    }
  });

  return peer;
}

function seed(chan, pool_id, chunk) {
  // debug("seeding", pool_id, chunk);
  chan.push("claim_chunk", {pool_id: pool_id, chunk: chunk});
};

function release(chan, pool_id, chunk) {
  debug("releasing", pool_id, chunk);
  return new Promise((resolve, reject) => {
    chan.push("drop_chunk", {pool_id: pool_id, chunk: chunk})
      .receive("ok", (message) => resolve() )
      .receive("error", (reasons) => reject(reasons) )
      .after(10000, () => debug("Networking issue. Still waiting...") );
  });
};

function connectRemote(remotePeerId, onError) {
  errorHandlers[remotePeerId] = [onError]; // set error handlers

  let dataConnection = peer.connect(remotePeerId);
  if (dataConnection) {
    dataConnection.remotePeerId = remotePeerId; // for book-keeping
  }

  return peers[remotePeerId] = dataConnection;
};

// todo: track when a pool is finished which peers we can disconnect from
function getRemote(remotePeerId, onError) {
  // If we already saw an error, call it right away. We're getting close to a promise here.
  if (errors[remotePeerId]) {
    onError(errors[remotePeerId]);
  }

  if (errorHandlers[remotePeerId]) {
    errorHandlers[remotePeerId].push(onError);
  }

  return peers[remotePeerId];
};

// TODO: Is this working?
function resumeSeeds(socket, peer_id) {
  return ChunkStore.getAllChunks().then((chunks) => {
    chunks.forEach((chunk) => {
      Chan.find(socket, peer_id, chunk.pool_id).then((chan) => {
        seed(chan, chunk.pool_id, chunk.chunk);
      });
    });
  });
};

function getActiveUploads() {
  return activeUploads;
}

export default {
  init: init,
  peer: () => { peer },
  seed: seed,
  release: release,
  peer_id: peer_id,
  getRemote: getRemote,
  connectRemote: connectRemote,
  resumeSeeds: resumeSeeds,
  getActiveUploads: getActiveUploads
};