import {Socket} from "phoenix"

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

Array.prototype.diff = function(a) {
  return this.filter(function(i) {return a.indexOf(i) < 0;});
};

Object.values = obj => Object.keys(obj).map(key => obj[key]);

function showDownload(name, largeObject) {
  var downloadEl = document.querySelector('a#downloadEl');
  downloadEl.href = URL.createObjectURL(new Blob(Object.values(largeObject)));
  downloadEl.download = name;

  var text = 'Click to download ' + name;

  while (downloadEl.firstChild) {
    downloadEl.removeChild(downloadEl.firstChild);
  }

  downloadEl.appendChild(document.createTextNode(text));
  downloadEl.style.display = 'block';
};

var PEER_JS_API_KEY = 'dx24ylo616y9zfr';
var peerId = guid();
var peer = new Peer(peerId, {key: PEER_JS_API_KEY});
var chunkSize = 16384;

var veryLargeObject = {};
var metaData = {};

peer.on('connection', function(conn) {
  conn.on('data', function(data){
    console.log(data);
    var pool = data[0];
    var chunk = data[1];

    console.log("Sending peer chunk: " + pool + ":" + chunk);
    console.log(veryLargeObject[pool][chunk]);

    conn.send([pool, chunk, veryLargeObject[pool][chunk]]);
  });
});

var changeHash = function() {
  var pool = location.hash.slice(1);

  console.log("hash changed to: " + pool);

  var socket = new Socket("/pm")
  socket.connect()
  var chan = socket.chan("pool:" + pool, {client: true});

  chan.join().receive("ok", response => {
    console.log("You are joinining...");
    console.log(response);
    console.log(response.peers[0][0]);
    veryLargeObject[pool] = {};
    metaData[pool] = {
      chunks: response.peers.map(chunkPeer => {return chunkPeer[0];}),
      name: response.description
    };

    console.log(["metadata",metaData[pool]]);

    response.peers.forEach(chunkPeer => {
      var chunk = chunkPeer[0];
      var otherPeerId = chunkPeer[1];

      console.log(['chunk', chunk, otherPeerId]);

      var conn = peer.connect(otherPeerId);
      conn.on('data', (data) => {
        var pool = data[0];
        var chunk = data[1];
        var data = data[2];

        veryLargeObject[pool][chunk] = data;

        console.log("large object");
        console.log(veryLargeObject);
        
        var missingChunks = metaData[pool].chunks.diff(Object.keys(veryLargeObject[pool]));
        
        trace("missing chunks", missingChunks)
        if (missingChunks.length == 0) {
          console.log("file complete, downloading...");

          showDownload(metaData[pool].name, veryLargeObject[pool]);
        }
      });

      conn.on('open', () => {
        conn.send([pool,chunk]);
      });

    });
    // print

    location.hash = ""; // clear hash
  });
};

function registerPool(pool, description, chunks) {
  var socket = new Socket("/pm")
  socket.connect()
  
  trace("Registering pool for pool " + pool + " ( " + description + " ) ");
  trace(chunks)

  var createChan = socket.chan("pool:" + pool, {
    pool: pool,
    description: description,
    chunks: chunks,
    peer: peerId
  });

  trace("Channel connected for pool " + pool);

  createChan.join().receive("ok", message => {
    trace("got message back...");
    trace(message);
  });
};

// This is for receipt
window.addEventListener("hashchange", changeHash);
let refresh = document.querySelector('#refresh');
refresh.addEventListener('click', changeHash);

// This is for create a pool
let fileInput = document.querySelector('input#fileInput');
fileInput.addEventListener('change', createNewPoolAndSeed, false);

var seeds = [];

function trace() {
  if (arguments.length == 1) {
    console.log(arguments[0]);  
  } else {
    console.log(arguments);
  }
  
}

function createNewPoolAndSeed() {
  fileInput.disabled = true;

  var file = fileInput.files[0];
  
  trace('file is ' + [file.name, file.size, file.type, file.lastModifiedDate].join(' '));
  if (file.size === 0) {
    return;
  }
  
  let chunkHashes = [];
  let largeObject = {};

  var sliceFile = function(offset) {
    var reader = new window.FileReader();
    reader.onload = (function() {
      return function(e) {
        var wordArray = CryptoJS.lib.WordArray.create(e.target.result);

        trace("computing hash for", wordArray);
        let sha = CryptoJS.SHA256(wordArray).toString();

        trace("sha", wordArray);

        chunkHashes.push(sha);
        largeObject[sha] = e.target.result;

        if (file.size > offset + e.target.result.byteLength) {
          window.setTimeout(sliceFile, 0, offset + chunkSize);
        } else {
          // We're done walking through the slices

          let pool = CryptoJS.SHA256(chunkHashes.join("")).toString();

          veryLargeObject[pool] = largeObject;
          registerPool(pool, file.name, chunkHashes);

          trace("large object", veryLargeObject);
          
          fileInput.disabled = false;
        }
      };
    })(file);
    
    var slice = file.slice(offset, offset + chunkSize);

    reader.readAsArrayBuffer(slice);
  };

  sliceFile(0);
}

let App = {
}

export default App
