"use strict";

import db from "services/database"

window.info = function() {
  return {
    db: {
      peer_id: Peer.peer_id,
      server: db.getServer(),
      pools: db.getServer().then((server) => { return server.pools.query().all().execute().then(x => {trace("pools",x)}) }),
      chunks: db.getServer().then((server) => { return server.chunks.query().all().execute().then(x => {trace("chunks",x)}) }),
      blobs: db.getServer().then((server) => { return server.blobs.query().all().execute().then(x => {trace("blobs",x)}) })
    }
  };
};