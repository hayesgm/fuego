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
const SELF_HEALING_INTERVAL = 30000;
const SELF_HEALING_TIMEOUT = 10000;

function init(fatal) {
  return new Promise((resolve, reject) => {
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
        if (conn.remotePeerId) {
          releaseRemote(conn.remotePeerId);
        }
      });

      // "Seeder" being asked for a chunk
      conn.on('data', ([type,args]) => {
        debug("peer data", type, args);

        switch (type) {
          case 'ping':
            conn.send(['pong', args]);

            break;
          case 'download':
            let [pool_id, chunk] = args;

            activeUploads.push([pool_id, conn.remotePeerId, conn]); // add ourselves for stat tracking

            // TODO: when we don't have the chunk?

            trace("Sending peer chunk", pool_id, chunk);
            BlobStore.getBlob(chunk).then(blob => {
              if (blob) {
                conn.send(['chunk',[pool_id, chunk, blob.data]]);
              } else {
                conn.send(['chunk',[pool_id, chunk, null]]); // say we don't have it
              }
            });

            break;
          default:
            trace('unknown client message type', type, args);
        }
      });
    });

    peer.on('close', () => {
      trace("peer closed");
    });

    peer.on('disconnected', () => {
      if (!peer.destroyed) {
        trace("peer lost connection, reconnecting in " + Math.round(RECONNECTION_TIMEOUT/1000.0) + " seconds...");

        setTimeout(() => {
          debug("reconnecting...");
          peer.reconnect();
        }, RECONNECTION_TIMEOUT);
      } else {
        trace("peer destroyed...");
      }
    });

    peer.on('error', (err) => {
      let match = err.message.match(/peer\s([^\s]+)/i);

      debug('error', err.message, err);

      if (err.type == 'browser-incompatible') {
        reject(err.message);
      }

      // this is a hack right now to find connection errors
      if (err.type == "peer-unavailable" && match) {
        let remotePeerId = match[1];

        debug("peer unavailable", remotePeerId, err);

        errors[remotePeerId] = err;

        // Call the error function(s) for this peer
        if (errorHandlers[remotePeerId]) {
          errorHandlers[remotePeerId].forEach((errorHandler) => {
            errorHandler.call(err);
          });
        }
      } else {
        trace("peer error", err);
      }
    });

    peer.on('open', () => {
      selfHealing(config, () => {
        debug("self help failed.. recovering");

        if (!peer.disconnected) {
          debug("disconnecting...");
          peer.disconnect();
        } else {
          debug("reconnecting...");
          peer.reconnect();
        }
      }); // let ourselves detect connection issues
    });

/*
    window.addEventListener("offline", function(e) {
      debug("offline mode - disconnecting");
      peer.disconnect();
    }, false);

    window.addEventListener("online", function(e) {
      debug("online mode - reconnecting");
      peer.reconnect();
    }, false);
*/
  });
}

function selfHealing(peerConfig, reconnect) {
  debug("starting a self-healing check...");

  let lastPong = null;

  setTimeout(() => {

      if (peer.disconnected) {
        debug("peer disconnected... waiting");
        selfHealing(helperPeer, reconnect);
      } else {
        let helperPeerId = Helpers.guid();
        var helperPeer = Peer(helperPeerId, peerConfig);

        let check = function() {
          if (helperConn && !helperConn.disconnected) {
            helperConn.close();
          }

          helperPeer.destroy();

          if (lastPong < now) { // we didn't get back a timely pong
            debug("self healing... timeout", lastPong, now);
            reconnect();
          } else {
            debug("self healing.. all is good.");
            selfHealing(peerConfig, reconnect); // recurse.. which is going to eat the stack without TCO
          }
        };

        let timer = setTimeout(check, SELF_HEALING_TIMEOUT);

        // Try to connect to ourselves
        helperPeer.on('error', (err) => {
          debug("helper peer error", err);
        });

        let helperConn = helperPeer.connect(peer_id);
        let now = +new Date();

        debug('helper peer connection', helperConn);

        if (helperConn) {
          helperConn.on('error', (err) => {
            debug('helper peer error', err);
            reconnect();
          });

          helperConn.on('open', () => {
            debug('connected');

            helperConn.on('data', ([type,args]) => {
              debug("peer data", type, args);

              if (type == 'pong') {
                let [time] = args;

                lastPong = Math.max([time, lastPong]); // keep track of the most recent pong

                // Let's check right away
                clearTimeout(timer);
                check();
              }
            });

            helperConn.send(['ping', [now]]); // send a ping with current time
          });
        }
      }
    }, SELF_HEALING_INTERVAL);
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

  if (!peer.disconnected && !peer.destroyed) {
    var dataConnection = peer.connect(remotePeerId);
    if (dataConnection) {
      dataConnection.remotePeerId = remotePeerId; // for book-keeping
    }

    return peers[remotePeerId] = dataConnection;
  } else {
    return null; // we're not connected
  }
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

function releaseRemote(remotePeerId) {
  debug("removing peer", remotePeerId);

  if (errorHandlers[remotePeerId]) {
    delete errorHandlers[remotePeerId];
  }

  delete peers[remotePeerId];

  activeUploads = activeUploads.filter(d => { return d[1] == remotePeerId; }); // remove ourselves from active uploads
}

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
  peer: () => { return peer; },
  seed: seed,
  release: release,
  peer_id: peer_id,
  getRemote: getRemote,
  releaseRemote: releaseRemote,
  connectRemote: connectRemote,
  resumeSeeds: resumeSeeds,
  getActiveUploads: getActiveUploads
};