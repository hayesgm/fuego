import {Socket} from "phoenix"
import Helpers from "web/static/js/helpers"
import {trace,debug} from "web/static/js/logging"

let PEER_JS_API_KEY = 'dx24ylo616y9zfr';
let peer_id = Helpers.guid();
let CHUNK_SIZE = 16384;

let peer = new Peer(peer_id, {key: PEER_JS_API_KEY, debug: 3});
let veryLargeObject = {};
let metaData = {};

let seeds = [];
let downloadEl = document.querySelector('a#downloadEl');
let refreshEl = document.querySelector('#refresh');
let fileInputEl = document.querySelector('input#fileInput');
let alertEl = document.querySelector("#alert");

let socket = new Socket("/pm");

function init() {
  socket.connect();

  // File Receipt
  window.addEventListener("hashchange", changeHash);
  refreshEl.addEventListener('click', changeHash);

  // File Seeding
  fileInputEl.addEventListener('change', createNewPoolAndSeed, false);

  changeHash();
}

function showDownload(metaData, largeObject) {
  downloadEl.href = URL.createObjectURL(new Blob(metaData.chunks.map(chunk => { return largeObject[chunk]; })));
  downloadEl.download = metaData.name;

  let text = 'Click to download ' + metaData.name;

  while (downloadEl.firstChild) {
    downloadEl.removeChild(downloadEl.firstChild);
  }

  downloadEl.appendChild(document.createTextNode(text));
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
    debug(veryLargeObject[pool_id][chunk]);

    conn.send([pool_id, chunk, veryLargeObject[pool_id][chunk]]);
  });
});

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

    // Initialize pool
    veryLargeObject[pool_id] = {};

    // and set pool meta-data
    metaData[pool_id] = {
      chunks: response.chunks,
      name: response.description
    };

    response.peers.forEach(chunkPeer => {
      let [chunk, remotePeerId] = chunkPeer;

      // Let's try to connect to the other peer
      let conn = peer.connect(remotePeerId);

      conn.on('error', (err) => {
        trace('webrtc error', err);
      });

      conn.on('data', (message) => {
        let [pool_id, chunk, data] = message;

        // Store data in local object
        veryLargeObject[pool_id][chunk] = data;

        let missingChunks = Helpers.diff(metaData[pool_id].chunks, Object.keys(veryLargeObject[pool_id]));
        
        debug("missing chunks", missingChunks)

        if (missingChunks.length == 0) {
          trace("Pool download complete", pool_id);
          showDownload(metaData[pool_id], veryLargeObject[pool_id]);
        }
      });

      // When we connect, let's ask for a chunk immediately
      conn.on('open', () => {
        conn.send([pool_id,chunk]);
      });

      // TODO: If we can't disconnect, inform server?

    });
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
  let largeObject = {};

  var sliceFile = function(offset) {
    var reader = new window.FileReader();

    reader.onload = (function() {
      return function(e) {
        var wordArray = CryptoJS.lib.WordArray.create(e.target.result);

        debug("computing hash for", wordArray);
        let sha = CryptoJS.SHA256(wordArray).toString();

        trace("sha", wordArray);

        chunkHashes.push(sha);
        largeObject[sha] = e.target.result;

        if (file.size > offset + e.target.result.byteLength) {
          // repeat
          window.setTimeout(sliceFile, 0, offset + CHUNK_SIZE);
        } else {
          // We're done walking through the slices
          let pool = CryptoJS.SHA256(chunkHashes.join("")).toString();

          // Store locally
          veryLargeObject[pool] = largeObject;

          // Register with the big man
          registerPool(pool, file.name, chunkHashes);

          // debug("large object", veryLargeObject);
            
          // and we're back...
          fileInput.disabled = false;
        }
      };
    })(file);
    
    var slice = file.slice(offset, offset + CHUNK_SIZE);

    reader.readAsArrayBuffer(slice);
  };

  sliceFile(0);
}

init();