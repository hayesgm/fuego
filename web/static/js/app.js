import {Socket} from "phoenix"
import Helpers from "web/static/js/helpers"
import {trace,debug} from "web/static/js/logging"
import db from "web/static/js/database"

let PEER_JS_API_KEY = 'dx24ylo616y9zfr';
let peer_id = Helpers.guid();
let CHUNK_SIZE = Math.pow(2, 18); // 256KB chunks

let peer = new Peer(peer_id, {key: PEER_JS_API_KEY, debug: 3});

let seeds = [];
let downloadEl = document.querySelector('a#downloadEl');
let refreshEl = document.querySelector('#refresh');
let fileInputEl = document.querySelector('input#fileInput');
let alertEl = document.querySelector("#alert");

let socket = new Socket("/pm");

let peers = {};

let chunkQueue = [];
let activeDownloads = [];
let SIMULTANEOUS_DOWNLOADS = 5;
let downloadLinks = {};

window.info = function() {
  return {
    server: db.server(),
    pools: db.server().pools.query().all().execute().then(x => {console.log(x)}),
    chunks: db.server().chunks.query().all().execute().then(x => {console.log(x)}),
    blobs: db.server().blobs.query().all().execute().then(x => {console.log(x)})
  };
};

function init() {
  socket.connect();

  // File Receipt
  window.addEventListener("hashchange", changeHash);
  refreshEl.addEventListener('click', changeHash);

  // File Seeding
  fileInputEl.addEventListener('change', createNewPoolAndSeed, false);

  changeHash();

  debug("ready...");
}

function showDownload(pool_id) {
  if (!downloadLinks[pool_id]) {
    downloadLinks[pool_id] = true; // let's make sure we only recompile this once

    Promise.all([db.getPoolInfo(pool_id), db.getAllChunkData(pool_id)]).then(values => {
      var [poolInfo, chunkData] = values;
      debug(poolInfo, chunkData);

      // Need to arrange this back into the correct order
      var arrayBuffers = poolInfo[0].chunks.map(chunk => {
        let match = chunkData.filter(chunkDatum => {
          return chunkDatum[0].chunk == chunk;
        })[0];

        return match[0].data;
      });

      downloadEl.href = URL.createObjectURL(new Blob(arrayBuffers));
      downloadEl.download = poolInfo[0].description;

      let text = 'Click to download ' + poolInfo[0].description;

      while (downloadEl.firstChild) {
        downloadEl.removeChild(downloadEl.firstChild);
      }

      downloadEl.appendChild(document.createTextNode(text));
    });
  }
};

function showShare(pool_id) {
  let text = 'Pool created, share this link: ' + window.location.toString().replace("%F0%9F%94%A5","🔥").replace(/#.*/i,"") + "#" + pool_id;

  alertEl.appendChild(document.createTextNode(text));
}

// "Seeder" being asked for a chunk
peer.on('connection', function(conn) {
  conn.on('data', function(data){
    debug("peer data", data);

    var [pool_id, chunk] = data;

    trace("Sending peer chunk", pool_id, chunk);
    db.getChunkData(chunk).then(blob => {
      conn.send([pool_id, chunk, blob[0].data]);
    });
  });
});

function downloadChunk(pool_id, chunk, remotePeerId) {
  debug("downloading chunk", chunk);
  activeDownloads.push([chunk, remotePeerId]);

  // We will re-use an existing connection, if given
  if (peers[remotePeerId]) {
    debug("using existing connection", remotePeerId);

    // Just ask for the given chunk if we're already connected
    peers[remotePeerId].on('open', () => {
      peers[remotePeerId].send([pool_id,chunk]);
    });
  } else {
    // Set into conn
    debug("connecting to peer", remotePeerId);
    peers[remotePeerId] = peer.connect(remotePeerId);

    let conn = peers[remotePeerId]

    conn.on('error', (err) => {
      trace('webrtc error', err);
    });

    conn.on('data', (message) => {
      debug(message);
      let [pool_id, chunk, data] = message;
      debug("rec'd", pool_id, chunk, data);

      // Store data in local object
      db.storeBlob(chunk, data).then(blob => {
        debug("stored blob", blob, blob[0].blob_id);
        db.storeChunk(pool_id, chunk, blob[0].blob_id).then(chunkObj => {
          debug("stored chunk", chunkObj);
          Promise.all([db.getPoolInfo(pool_id), db.getChunks(pool_id)]).then(values => {
            debug("as promised...", values);
            let [poolInfo, chunkObjs] = values;
            let totalChunks = poolInfo[0].chunks;
            let fetchedChunks = chunkObjs.map(obj => {return obj.chunk;});

            debug(poolInfo, chunkObjs, totalChunks, fetchedChunks);

            let missingChunks = Helpers.diff(totalChunks, fetchedChunks);
          
            debug("missing chunks", missingChunks)

            freeChunk(pool_id, chunk);

            if (missingChunks.length == 0) {
              trace("Pool download complete", pool_id);
              showDownload(pool_id);
            }
          });
        });
      });
    });

    // When we connect, let's ask for a chunk immediately
    conn.on('open', () => {
      conn.send([pool_id,chunk]);
    });

    // TODO: If we can't disconnect, inform server?
  }
}

function freeChunk(pool_id, chunk) {
  activeDownloads = activeDownloads.filter(a => { return a[0] == pool_id && a[1] == chunk; });
  debug("freeing chunk", activeDownloads);

  let nextChunkPeer = chunkQueue.shift();
  if (nextChunkPeer) {
    let [pool_id, nextChunk, remotePeerId] = nextChunkPeer;

    downloadChunk(pool_id, nextChunk, remotePeerId);
  }
}

function getChunk(pool_id, chunk, remotePeerId) {
  if (activeDownloads.length < SIMULTANEOUS_DOWNLOADS) {
    downloadChunk(pool_id, chunk, remotePeerId);
  } else {
    debug("queueing chunk", chunk);
    chunkQueue.push([pool_id, chunk, remotePeerId]);
  }
}

function changeHash() {
  let pool_id = location.hash.slice(1);
  location.hash = ""; // clear hash

  if (pool_id == "") {
    return;
  }

  trace("fetching pool", pool_id);

  let chan = socket.chan("pool:" + pool_id, {client: true, peer_id: peer_id});

  chan.join().receive("ok", response => {
    trace("joined pool", response);

    var findPeers = function() {
      response.peers.forEach(chunkPeer => {
        let [chunk, remotePeerId] = chunkPeer;
        getChunk(pool_id, chunk, remotePeerId);
      });
    };

    db.createPool(pool_id, response.chunks, response.description).then(findPeers).catch(findPeers);
  });
};

function registerPool(pool_id, description, chunks) {
  trace("Registering pool for pool", pool_id, description);
  debug("Chunks", chunks);

  let chan = socket.chan("pool:" + pool_id, {
    pool_id: pool_id,
    description: description,
    chunks: chunks,
    peer_id: peer_id
  });

  chan.join().receive("ok", message => {
    trace("registered pool", message);
    showShare(pool_id)
  });
};

function createNewPoolAndSeed() {
  fileInput.disabled = true;

  var file = fileInput.files[0];
  
  trace('file', [file.name, file.size, file.type, file.lastModifiedDate]);
  if (file.size === 0 && !file.name) {
    return;
  }

  let chunkHashes = [];
  let chunkMap = {};

  var sliceFile = function(offset) {
    var reader = new window.FileReader();

    reader.onload = (function() {
      return function(e) {
        var wordArray = CryptoJS.lib.WordArray.create(e.target.result);

        // debug("computing hash for", wordArray);
        let sha = CryptoJS.SHA256(wordArray).toString();

        // trace("sha", wordArray);

        chunkHashes.push(sha);
        db.storeBlob(sha, e.target.result).then(blob => {
          // debug("blob", blob);
          chunkMap[sha] = blob[0].blob_id;

          if (file.size > offset + e.target.result.byteLength) {
            // repeat
            window.setTimeout(sliceFile, 0, offset + CHUNK_SIZE);
          } else {
            // We're done walking through the slices
            let pool_id = CryptoJS.SHA256(chunkHashes.join("")).toString();

            var addChunksAndComplete = () => {
              trace("chunk hashes", chunkHashes);
              let promises = chunkHashes.map(chunk => {
                trace("storing chunk", pool_id, chunk, chunkMap[chunk]);
                db.storeChunk(pool_id, chunk, chunkMap[chunk]);
              });

              Promise.all(promises).then(() => {
                // Register with the big man
                registerPool(pool_id, file.name, chunkHashes);

                // and we're back...
                fileInput.disabled = false;
              });
            };

            db.createPool(pool_id, chunkHashes, file.name).then(addChunksAndComplete).catch(addChunksAndComplete);
          }
        });
      };
    })(file);
    
    var slice = file.slice(offset, offset + CHUNK_SIZE);

    reader.readAsArrayBuffer(slice);
  };

  sliceFile(0);
}

init();