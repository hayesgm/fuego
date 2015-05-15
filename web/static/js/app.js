"use strict";

import {Socket} from "phoenix"
import Helpers from "./helpers"
import {trace,debug} from "./logging"
import db from "./database"
import Peer from "./peer"
import Pool from "./pool"

let poolsEl = document.querySelector('#pools');
let downloadEl = document.querySelector('a#downloadEl');
let fileInputEl = document.querySelector('input#fileInput');
let alertEl = document.querySelector("#alert");

let socket = new Socket("/pm");

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

function init() {
  trace("peer", Peer.peer_id, "online...");

  socket.connect();

  // File Receipt
  window.addEventListener("hashchange", changeHash);

  // File Seeding
  fileInputEl.addEventListener('change', changeFile, false);

  // Start if given hash to begin with
  changeHash();

  Peer.resumeSeeds(socket, Peer.peer_id);

  Pool.refresh(socket, Peer.peer_id).then((pools) => {
    pools.forEach((pool) => {
      showShare(pool);
      preDownload(pool);
    });

  });

  debug("ready...");
}

function preDownload(pool) {
  Pool.getPercentComplete(pool).then((percent) => {
    let poolEl = document.querySelector("a#pool" + pool.pool_id) || document.createElement('a');

    poolEl.addEventListener('click', () => {
      showDownloadLink(pool);
    });

    while (poolEl.firstChild) {
      poolEl.removeChild(poolEl.firstChild);
    }

    poolEl.appendChild(document.createTextNode("Download " + pool.description + " (" + percent + "%)"));

    poolsEl.appendChild(poolEl);
    poolsEl.appendChild(document.createElement("br"));
  });
};

function showDownloadLink(pool) {
  Pool.getPoolBuffers(pool).then((arrayBuffers) => {
    debug("pool bufferS", arrayBuffers);

    downloadEl.href = URL.createObjectURL(new Blob(arrayBuffers));
    downloadEl.download = pool.description;

    let text = 'Click to download ' + pool.description;

    while (downloadEl.firstChild) {
      downloadEl.removeChild(downloadEl.firstChild);
    }

    downloadEl.appendChild(document.createTextNode(text));
  });
}

function showShare(pool) {
  let text = 'Pool created for `'+pool.description+'`, to share: ' + window.location.toString().replace("%F0%9F%94%A5","🔥").replace(/#.*/i,"") + "#" + pool.pool_id;

  alertEl.appendChild(document.createTextNode(text));
  alertEl.appendChild(document.createElement("br"));
}

function changeHash() {
  let pool_id = location.hash.slice(1);
  location.hash = ""; // clear hash

  if (pool_id != "") {
    Pool.fetch(socket, Peer.peer_id, pool_id).then(preDownload);
  }
}

function changeFile() {
  fileInput.disabled = true;

  var file = fileInput.files[0];
  
  trace('file', [file.name, file.size, file.type, file.lastModifiedDate]);
  if (file.size === 0 && !file.name) {
    return; // do nothing
  } else {
    Pool.createFromFile(file).then((pool) => {
      trace("got pool for file", pool);
      // and we're back...
      fileInput.disabled = false;

      Pool.register(socket, Peer.peer_id, pool).then(() => {
        preDownload(pool);
        showShare(pool);
      });
    });
  }
}

init();