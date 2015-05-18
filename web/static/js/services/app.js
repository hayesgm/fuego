"use strict";

import {Socket} from "phoenix"
import Helpers from "./services/helpers"
import {trace,debug} from "./services/logging"
import db from "./services/database"
import Peer from "./services/peer"
import Pool from "./services/pool"

let poolsEl = document.querySelector('#pools');
let downloadEl = document.querySelector('a#downloadEl');
let cinemaEl = document.querySelector('div#cinema');
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

  // Peer.resumeSeeds(socket, Peer.peer_id);

  Pool.refresh(socket, Peer.peer_id).then((pools) => {
    pools.forEach((pool) => {
      showShare(pool);
      preDownload(pool);
    });

  });

  debug("ready...");
}

function getType(pool) {
  if (pool.description.match(/\.mp4$/i)) {
    return "video";
  } else {
    return "file";
  }
}

function preDownload(pool) {
  Pool.getPercentComplete(pool).then((percent) => {

    let poolEl = document.querySelector("a#pool" + pool.pool_id) || document.createElement('a');
    poolEl.href = "javascript:void(0)";

    poolEl.addEventListener('click', () => {
      switch (getType(pool)) {
      case "file":
        showDownloadLink(pool);  
        break;
      case "video":
        playVideo(pool);
        break;
      }
      
    });

    while (poolEl.firstChild) {
      poolEl.removeChild(poolEl.firstChild);
    }

    switch (getType(pool)) {
      case "file":
        poolEl.appendChild(document.createTextNode("Download " + pool.description + " (" + pool.total_size + " bytes) [" + percent + "%]"));
        break;
      case "video":
        poolEl.appendChild(document.createTextNode("Play " + pool.description + " (" + pool.total_size + " bytes) [" + percent + "%]"));
        break;
    }

    poolsEl.appendChild(poolEl);
    poolsEl.appendChild(document.createElement("br"));
  });
};

function playVideo(pool) {
  Pool.getPoolBuffers(pool).then((arrayBuffers) => {
    let blob = new Blob(arrayBuffers)

    let video = document.createElement("video");
    video.autoplay = true;
    video.controls = true;
    video.src = URL.createObjectURL(blob);

    while (cinemaEl.firstChild) {
      cinemaEl.removeChild(cinemaEl.firstChild);
    }

    trace("playing", pool.description);
    cinemaEl.appendChild(video);
  });
}

function showDownloadLink(pool) {
  let offset = (() => {
    var startTime = new Date().valueOf();
    return () => {
      return "(+" + ( new Date().valueOf() - startTime ) + "ms)";
    };
  })();

  debug("gathering pool buffers", offset());
  Pool.getPoolBuffers(pool).then((arrayBuffers) => {
    debug("got pool buffers", offset());

    let blob = new Blob(arrayBuffers)

    debug("created blob", offset());

    downloadEl.href = URL.createObjectURL(blob);

    debug("create object url", offset());
    downloadEl.download = pool.description;

    let text = 'Click to download ' + pool.description + "("+pool.total_size+" bytes)";

    while (downloadEl.firstChild) {
      downloadEl.removeChild(downloadEl.firstChild);
    }

    downloadEl.appendChild(document.createTextNode(text));

    debug("appended link", offset());
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
    Pool.fetch(socket, Peer.peer_id, pool_id).then(([pool,buffers]) => {
      preDownload(pool);
    });
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