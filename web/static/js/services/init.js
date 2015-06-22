"use strict";

import {env} from 'env';
import Peer from "services/peer";
import Pool from "services/pool";
import {trace,debug} from "services/logging";
import db from "models/database";
import Chunks from 'services/chunks';
import {ENDPOINT} from 'services/config';

let socket = null;

// Runs initializaiton code to connect to a peer group
function init() {
  return new Promise((resolve, reject) => {
    trace("initializing environment", env.prod ? "prod" : "dev");

    db.init(); // connect to database

    socket = new Phoenix.Socket(ENDPOINT);

    Peer.init().catch((error) => {
      reject(error);
    }); // initialize ourselves as a peer

    trace("peer", Peer.peer_id, "online...");

    socket.connect(); // connect to web socket

    Pool.refresh(socket, Peer.peer_id); // tell server about any pools we know about

    debug("ready..."); // and we're good to go

    // Handy debug function if we need to see what's going on
    window.fuego = function() {
      return {
        peer: Peer,
        db: {
          peer_id: Peer.peer_id,
          server: db.getServer(),
          pools: db.getServer().then((server) => { return server.pools.query().all().execute().then(x => {trace("pools",x)}) }),
          chunks: db.getServer().then((server) => { return server.chunks.query().all().execute().then(x => {trace("chunks",x)}) }),
          blobs: db.getServer().then((server) => { return server.blobs.query().all().execute().then(x => {trace("blobs",x)}) })
        },
        downloads: Chunks.getActiveDownloads(),
        queue: Chunks.getDownloadQueue(),
      };
    };
  });
}

let Init = {
  init: init,
  socket: () => { return socket; },
  peer_id: Peer.peer_id
};

export default Init;