"use strict";

import {trace,debug} from "services/logging";

// Global register of active channels
var channels = {};

function getOpenChannel(pool_id) {
  if (channels[pool_id]) {
    let [chan,_] = channels[pool_id];

    return chan;  
  } else {
    return nil;
  }
}

// This will try to find a pool from the server
// If this server doesn't know about pool, this
// will reject the promise
function find(socket, peer_id, pool_id) {
  return new Promise((resolve,reject) => {
    if (channels[pool_id]) {
      resolve(channels[pool_id]);
    } else {
      let chan = socket.chan("pool:" + pool_id, {client: true, peer_id: peer_id});

      chan.join().receive("ok", reply => {
        debug("connect chan for pool", pool_id);

        channels[pool_id] = [chan,reply];
        resolve(channels[pool_id]);
      }).receive("error", (err) => {
        trace("error joining channel", err);
        reject(err);
      });
    }
  });
}

function create(socket, peer_id, pool_id, chunks, description, chunk_size, total_size) {
  return new Promise((resolve,reject) => {
    if (channels[pool_id]) {
      resolve(channels[pool_id]);
    } else {
      let chan = socket.chan("pool:" + pool_id, {
        peer_id: peer_id,
        pool_id: pool_id,
        chunks: chunks,
        description: description,
        chunk_size: chunk_size || 0,
        total_size: total_size || 0
      });

      chan.join().receive("ok", reply => {
        debug("connect chan for pool", pool_id);
        trace("registered pool", reply);

        channels[pool_id] = [chan,reply];
        resolve(channels[pool_id]);
      });
    }
  });
}

let Chan = {
  find: find,
  create: create,
  getOpenChannel: getOpenChannel
};

export default Chan;
