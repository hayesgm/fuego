"use strict";

import {trace,debug} from "./logging";

// Global register of active channels
var channels = {};

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
        channels[pool_id] = [chan,reply];
        resolve(channels[pool_id]);
      }).receive("error", (err) => {
        reject(err);
      });
    }
  });
}

function create(socket, peer_id, pool_id, description, chunks) {
  return new Promise((resolve,reject) => {
    if (channels[pool_id]) {
      resolve(channels[pool_id]);
    } else {
      let chan = socket.chan("pool:" + pool_id, {
        pool_id: pool_id,
        description: description,
        chunks: chunks,
        peer_id: peer_id
      });

      console.log("freeze0"); // TODO: This is freezing on the server
      chan.join().receive("ok", reply => {
        console.log("freeze1");
        trace("registered pool", reply);

        channels[pool_id] = [chan,reply];
        resolve(channels[pool_id]);
      });
    }
  });
}

let Chan = {
  find: find,
  create: create
};

export default Chan;
