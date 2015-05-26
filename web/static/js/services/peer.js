"use strict";

import {trace,debug} from "./logging";
import Chan from "./chan";
import Helpers from "./helpers";
import ChunkStore from "../stores/chunk_store";
import BlobStore from "../stores/blob_store";
  
let PEER_JS_API_KEY = 'dx24ylo616y9zfr';
let peer_id = Helpers.guid();
let peers = {};
let errorHandlers = {};
let errors = {};
let peer = null;
let activeUploads = [];

if (window.Peer) {
  peer = new Peer(peer_id, {key: PEER_JS_API_KEY, debug: 3}); // optional for now

  // "Seeder" being asked for a chunk
  peer.on('connection', function(conn) {
    conn.on('close', function() {
      activeUploads = activeUploads.filter(d => { return d[1] == conn; }); // remove ourselves
    });

    conn.on('data', function(data){
      debug("peer data", data);

      var [pool_id, chunk] = data;

      activeUploads.push([pool_id, conn]); // add ourselves for stat tracking

      // TODO: when we don't have the chunk?

      trace("Sending peer chunk", pool_id, chunk);
      BlobStore.getBlob(chunk).then(blob => {
        conn.send([pool_id, chunk, blob.data]);
      });
    });
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
    }
  });

}

function seed(chan, pool_id, chunk) {
  // debug("seeding", pool_id, chunk);
  chan.push("claim_chunk", {pool_id: pool_id, chunk: chunk});
};

function connectRemote(remotePeerId, onError) {
  errorHandlers[remotePeerId] = [onError]; // set error handlers

  let dataConnection = peer.connect(remotePeerId);

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

let p = {
  peer: peer,
  seed: seed,
  peer_id: peer_id,
  getRemote: getRemote,
  connectRemote: connectRemote,
  resumeSeeds: resumeSeeds,
  getActiveUploads: getActiveUploads
};

export default p;