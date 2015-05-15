"use strict";

import {trace,debug} from "./logging";
import db from "./database";
import Chan from "./chan";
import Helpers from "./helpers";

let PEER_JS_API_KEY = 'dx24ylo616y9zfr';
let peer_id = Helpers.guid();

let peer = new Peer(peer_id, {key: PEER_JS_API_KEY, debug: 3});
let peers = {};

// "Seeder" being asked for a chunk
peer.on('connection', function(conn) {
  conn.on('data', function(data){
    debug("peer data", data);

    var [pool_id, chunk] = data;

    // TODO: when we don't have the chunk?

    trace("Sending peer chunk", pool_id, chunk);
    db.getChunkData(chunk).then(blob => {
      conn.send([pool_id, chunk, blob.data]);
    });
  });
});

function seed(chan, pool_id, chunk) {
  trace("seeding", pool_id, chunk);
  chan.push("claim_chunk", {pool_id: pool_id, chunk: chunk});
};

function connectRemote(remotePeerId) {
  return peers[remotePeerId] = peer.connect(remotePeerId);
};

function getRemote(remotePeerId) {
  return peers[remotePeerId];
};

function resumeSeeds(socket, peer_id) {
  return db.getChunks().then((chunks) => {
    chunks.forEach((chunk) => {
      Chan.find(socket, peer_id, chunk.pool_id).then((chan) => {
        seed(chan, chunk.pool_id, chunk.chunk);
      });
    });
  });
};

let p = {
  seed: seed,
  peer_id: peer_id,
  getRemote: getRemote,
  connectRemote: connectRemote,
  resumeSeeds: resumeSeeds
};

export default p;